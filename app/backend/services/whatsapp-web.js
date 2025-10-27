import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

let clients = {}; // uid → client

export async function startWhatsApp(uid, onQR, onReady, onDisconnected) {
  if (clients[uid]) return clients[uid];
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: uid }),
    puppeteer: { headless: true, args: ["--no-sandbox"] },
  });

  client.on("qr", (qr) => {
    console.log(`[${uid}] QR gerado`);
    if (onQR) onQR(qr);
    else qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log(`[${uid}] WhatsApp conectado`);
    if (onReady) onReady();
  });

  client.on("disconnected", (reason) => {
    console.log(`[${uid}] WhatsApp desconectado:`, reason);
    delete clients[uid];
    if (onDisconnected) onDisconnected(reason);
  });

  await client.initialize();
  clients[uid] = client;
  return client;
}

export function getClient(uid) {
  return clients[uid] || null;
}

export function disconnectClient(uid) {
  const client = clients[uid];
  if (client) {
    client.destroy();
    delete clients[uid];
  }
}
