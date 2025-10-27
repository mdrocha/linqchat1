/**
 * Worker de tarefas agendadas.
 * Usa node-cron para executar rotinas automáticas em intervalos definidos.
 */
import "dotenv/config";
import cron from "node-cron";
import { db, FieldValue } from "../services/firebaseAdmin.js";

/**
 * Tarefa executada a cada minuto — exemplo de heartbeat.
 * Substituir por rotinas reais conforme necessidade (ex: checar assinaturas, filas, logs).
 */
cron.schedule("* * * * *", async () => {
  try {
    await db.collection("cronLogs").add({
      task: "heartbeat",
      ranAt: FieldValue.serverTimestamp(),
    });
    console.log(`[CRON] Heartbeat salvo em ${new Date().toISOString()}`);
  } catch (e) {
    console.error("[CRON] Erro ao registrar heartbeat:", e);
  }
});

/**
 * Pode-se adicionar outras tarefas aqui:
 * cron.schedule("0 0 * * *", tarefaDiaria);
 */

console.log("Cron worker iniciado e em execução...");