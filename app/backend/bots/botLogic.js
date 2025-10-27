// app/backend/bots/botLogic.js

import OpenAI from "openai";
import { getUserMemory, updateUserMemory } from "../services/memoryService.js";
import { getUserByPhone, db, admin } from "../services/firebaseAdmin.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalizeHistory(mem) {
  // Aceita {history:[{role,content}]} ou {memory:[{pergunta,resposta}]}
  if (!mem) return [];
  if (Array.isArray(mem.history)) return mem.history.slice(-16);
  if (Array.isArray(mem.memory)) {
    const pairs = mem.memory.slice(-8);
    const flat = [];
    for (const item of pairs) {
      if (item.pergunta) flat.push({ role: "user", content: item.pergunta });
      if (item.resposta) flat.push({ role: "assistant", content: item.resposta });
    }
    return flat.slice(-16);
  }
  return [];
}

export async function handleBotMessage(msg, client) {
  const text = (msg.body || "").trim();
  if (!text) return;
  if (msg.fromMe) return;

  const userPhone = msg.from.replace("@c.us", "");

  try {
    console.log(`📩 Mensagem recebida de ${userPhone}: ${text}`);

    // 1) Buscar/auto-criar usuário
    let userData = await getUserByPhone(userPhone);
    if (!userData) {
      console.warn(`Usuário ${userPhone} não encontrado. Criando provisório...`);
      const payload = {
        phone: userPhone,
        assistantId: process.env.DEFAULT_ASSISTANT_ID || null,
        status: "provisional",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        business: {
          nome: process.env.BIZ_NAME || "Atendimento",
          segmento: process.env.BIZ_SEGMENTO || "geral",
          cidade: process.env.BIZ_CIDADE || "",
          horario: process.env.BIZ_HORARIO || "",
          cardapio_url: process.env.BIZ_CARDAPIO_URL || "",
          contato_humano: process.env.BIZ_CONTATO || "Atendente",
          whatsapp_humano: process.env.BIZ_WHATS || "",
          politica_entrega: process.env.BIZ_ENTREGA || ""
        }
      };
      const ref = await db.collection("users").add(payload);
      userData = { uid: ref.id, ...payload };
    }

    const biz = userData.business || {};
    const memoryUid = userData?.uid || `phone:${userPhone}`;
    const memoryRaw = await getUserMemory(memoryUid);
    const history = normalizeHistory(memoryRaw);

    // 2) Sistema + estilo
    const SYSTEM = [
      `Você é atendente virtual da empresa "${biz.nome || "Atendimento"}" (segmento: ${biz.segmento || "geral"}; cidade: ${biz.cidade || ""}).`,
      `Fale PT-BR, direto e natural, frases curtas, sem floreio.`,
      `Priorize utilidade e próximo passo claro.`,
      `Se pedir comida: ofereça opções objetivas. Se faltar dado (sabor, endereço, pagamento), peça exatamente o que precisa.`,
      `Cardápio: ${biz.cardapio_url || "sem link"}.`,
      `Contato humano: ${biz.contato_humano || "Atendente"} ${biz.whatsapp_humano ? "(WhatsApp " + biz.whatsapp_humano + ")" : ""}.`,
      `Política de entrega: ${biz.politica_entrega || "não informada"}.`,
      `Nunca invente preço/estoque. Sem emojis.`
    ].join("\n");

    // 3) Few-shot para ancorar tom
    const FEWSHOT = [
      { role: "user", content: "Quero comer" },
      { role: "assistant", content: "Te ajudo agora. Prefere burger clássico, cheddar bacon, frango ou vegetariano? Posso mandar o link do cardápio." },
      { role: "user", content: "Rola" },
      { role: "assistant", content: "Rola sim. Diz o que tá a fim e já te passo as opções. Quer ver o cardápio?" },
      { role: "user", content: "Quero falar com Michel" },
      { role: "assistant", content: `Posso te passar o contato do ${biz.contato_humano || "atendente"}${biz.whatsapp_humano ? " no WhatsApp " + biz.whatsapp_humano : ""}. Quer falar com ele ou seguimos por aqui?` }
    ];

    // 4) Montagem de mensagens para fallback
    const messages = [
      { role: "system", content: SYSTEM },
      ...FEWSHOT,
      ...history,
      { role: "user", content: text }
    ];

    // 5) Tenta Assistants API somente se houver assistantId
    let reply;
    if (userData.assistantId) {
      try {
        const run = await openai.beta.threads.createAndRun({
          assistant_id: userData.assistantId,
          thread: { messages: [{ role: "system", content: SYSTEM }, { role: "user", content: text }] }
        });
        reply = run.output?.[0]?.content?.[0]?.text?.value?.trim();
      } catch (e) {
        console.warn("⚠️ Assistants API falhou; usando fallback:", e.message);
      }
    }

    // 6) Fallback Chat Completions — tom natural e objetivo
    if (!reply) {
      const comp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
        top_p: 0.8,
        presence_penalty: 0.0,
        frequency_penalty: 0.2
      });
      reply = comp.choices?.[0]?.message?.content?.trim();
    }

    if (!reply) reply = "Consigo te ajudar agora. Prefere burger clássico, cheddar bacon, frango ou vegetariano?";

    await client.sendMessage(msg.from, reply);
    await updateUserMemory(memoryUid, text, reply);
    console.log("🤖 Resposta enviada:", reply);
  } catch (err) {
    console.error("❌ Erro crítico em handleBotMessage:", err);
    try {
      await client.sendMessage(msg.from, "Tive um problema aqui. Diz em uma frase o que você precisa e eu resolvo.");
    } catch {}
  }
}