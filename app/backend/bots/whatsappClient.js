// app/backend/bots/whatsappClient.js

import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode";
import { handleBotMessage } from "./botLogic.js";

const state = { ready: false, lastQR: null };
export function getWhatsAppState() {
  return { ...state };
}

export function createWhatsAppClient(userId, io) {
  if (global.__wappClient) return global.__wappClient; // evita múltiplas instâncias

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: userId }),
    restartOnAuthFail: true,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 0,
    qrMaxRetries: 0,
    authTimeoutMs: 120000,
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
        "--disable-extensions", "--disable-gpu", "--single-process", "--no-zygote",
      ],
    },
  });

  client.on("qr", async (qr) => {
    state.ready = false;
    state.lastQR = await qrcode.toDataURL(qr);
    io.emit("qr", state.lastQR);
    console.log("[WA] QR gerado");
  });

  client.on("ready", () => {
    state.ready = true;
    io.emit("ready");
    console.log(`[WA] Conectado (${userId})`);
  });

  client.on("authenticated", () => console.log(`[WA] Sessão autenticada (${userId})`));
  client.on("auth_failure", (err) => {
    state.ready = false;
    console.error(`[WA] Falha na autenticação (${userId}):`, err);
  });
  client.on("disconnected", (reason) => {
    state.ready = false;
    console.warn(`[WA] Desconectado (${userId}):`, reason);
    client.initialize();
  });

  // LISTENER DE MENSAGENS — ESSENCIAL PARA RESPONDER
  client.on("message", async (msg) => {
    try {
      if (msg.fromMe) return; // ignora eco
      if (msg.from.includes("status@broadcast")) return; // ignora status
      // opcional: ignorar grupos — remova se quiser atender grupos
      if (msg.from.includes("@g.us")) return;

      console.log("[WA] Mensagem recebida:", { from: msg.from, body: msg.body });
      await handleBotMessage(msg, client);
    } catch (err) {
      console.error("[WA] Erro ao processar mensagem:", err);
    }
  });

  client.initialize();
  global.__wappClient = client;
  return client;
}
