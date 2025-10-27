import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode";
import { Server } from "socket.io";
import { handleBotMessage } from "../bots/botLogic.js";

let io = null;
let client = null;

// estado do QR
const qrState = {
  img: null,
  active: false,
  expiresAt: 0,
  timer: null,
};

export function registerSocket(server) {
  io = new Server(server, {
    cors: { origin: ["http://localhost:5173"], methods: ["GET", "POST"], credentials: true },
  });

  io.on("connection", (socket) => {
    // entrega estado atual
    if (qrState.img && qrState.active) {
      socket.emit("qr", { img: qrState.img, expiresAt: qrState.expiresAt });
    }
    socket.emit("ready", !!(client && client.info?.wid));

    // cliente pediu regenerar QR manualmente
    socket.on("qr_regenerate", async () => {
      if (qrState.active) return; // só permite se expirado
      await regenerateQR();
    });
  });

  startWhatsApp();
}

async function startWhatsApp() {
  if (client) return;

  client = new Client({
    authStrategy: new LocalAuth({ clientId: "defaultClient" }),
    restartOnAuthFail: true,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 0,
    qrMaxRetries: 1,        // apenas UM QR por ciclo
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
    // evita spam de QR
    if (qrState.active) return;

    qrState.active = true;
    qrState.expiresAt = Date.now() + 55_000; // ~55s
    qrState.img = await qrcode.toDataURL(qr);
    if (io) io.emit("qr", { img: qrState.img, expiresAt: qrState.expiresAt });

    // agenda expiração local e notificação
    clearTimeout(qrState.timer);
    qrState.timer = setTimeout(() => {
      qrState.active = false;
      if (io) io.emit("qr_expired");
    }, 56_000);
  });

  client.on("ready", () => {
    clearQR();
    if (io) io.emit("ready", true);
    console.log("✅ WhatsApp conectado");
  });

  client.on("message", async (msg) => {
    try {
      if (msg.fromMe) return;
      if (msg.from.includes("status@broadcast")) return;
      if (msg.from.includes("@g.us")) return;
      await handleBotMessage(msg, client);
    } catch (e) {
      console.error("message error", e);
    }
  });

  client.on("auth_failure", (e) => {
    clearQR();
    console.warn("auth_failure", e?.message || e);
  });

  client.on("disconnected", async (reason) => {
    clearQR();
    console.warn("disconnected:", reason);
    try { await client.destroy(); } catch {}
    client = null;
  });

  client.initialize();
}

function clearQR() {
  clearTimeout(qrState.timer);
  qrState.timer = null;
  qrState.active = false;
  qrState.img = null;
  qrState.expiresAt = 0;
}

// destrói a instância e cria outra para forçar um novo QR
async function regenerateQR() {
  clearQR();
  try {
    if (client) {
      await client.destroy();
      client = null;
    }
  } catch {}
  // nova instância para gerar novo QR quando “qr” disparar
  startWhatsApp();
}
