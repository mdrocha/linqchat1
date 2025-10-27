import dotenv from "dotenv";
dotenv.config();

const ENDPOINT = "https://api.openai.com/v1/assistants";
const MODEL = "gpt-4o-mini";

export async function createAssistant(segment) {
  const prompts = {
    odontologia: "Você é um assistente especializado em clínicas odontológicas.",
    estetica: "Você é um assistente especializado em clínicas de estética.",
    loja_roupas: "Você é um assistente especializado em lojas de roupas e moda.",
    restaurante: "Você é um assistente especializado em restaurantes e delivery.",
    outros: "Você é um assistente genérico de atendimento comercial.",
  };

  const body = {
    name: `Assistente ${segment || "outros"}`,
    model: MODEL,
    instructions: prompts[segment] || prompts.outros,
  };

  try {
    console.log(">>> Criando assistente na OpenAI...");
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify(body),
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Resposta bruta:", text);

    if (!res.ok) {
      throw new Error(`Falha ao criar assistente (${res.status})`);
    }

    const data = JSON.parse(text);
    if (!data.id) {
      throw new Error("Retornou sem id de assistente");
    }
    console.log("Assistente criado:", data.id);
    return data;
  } catch (err) {
    console.error("Erro ao criar assistente:", err);
    return { id: `local-${Date.now()}`, model: MODEL, segment };
  }
}