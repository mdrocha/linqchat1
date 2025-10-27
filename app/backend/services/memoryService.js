import { db } from "./firebaseAdmin.js";

export async function getUserMemory(uid) {
  const ref = db.collection("memories").doc(uid);
  const snap = await ref.get();
  const mem = snap.exists ? snap.data() : { history: [] };
  // mantém só as últimas 8 trocas (user+assistant)
  const trimmed = (mem.history || []).slice(-16);
  return { history: trimmed };
}

export async function updateUserMemory(uid, pergunta, resposta) {
  const ref = db.collection("memories").doc(uid);
  const snap = await ref.get();
  const history = snap.exists ? (snap.data().history || []) : [];
  history.push({ role: "user", content: pergunta, ts: Date.now() });
  history.push({ role: "assistant", content: resposta, ts: Date.now() });
  await ref.set({ history: history.slice(-16) }, { merge: true });
}