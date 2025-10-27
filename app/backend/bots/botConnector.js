/**
 * Módulo responsável por buscar e conectar configurações
 * específicas de cada bot/cliente a partir do Firestore.
 */
import { db } from "../services/firebaseAdmin.js";

/**
 * Retorna a configuração do bot associada a um tenantId.
 * @param {string} tenantId - identificador do cliente/bot.
 */
export async function getBotConfig(tenantId) {
  try {
    const doc = await db.collection("botConfigs").doc(tenantId).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (e) {
    console.error("Erro ao buscar configuração do bot:", e);
    throw e;
  }
}

/**
 * Atualiza ou cria a configuração de um bot.
 * @param {string} tenantId - id do cliente/bot.
 * @param {object} config - objeto de configuração.
 */
export async function saveBotConfig(tenantId, config) {
  try {
    await db.collection("botConfigs").doc(tenantId).set(config, { merge: true });
    return true;
  } catch (e) {
    console.error("Erro ao salvar configuração do bot:", e);
    return false;
  }
}