import { Router } from "express";
import { db, FieldValue } from "../services/firebaseAdmin.js";

const router = Router();

/**
 * GET /api/client/metrics
 * Retorna dados de métricas armazenados na coleção "metrics".
 */
router.get("/metrics", async (_req, res) => {
  try {
    const snapshot = await db.collection("metrics").get();
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

/**
 * POST /api/client/events
 * Registra um novo evento genérico na coleção "events".
 */
router.post("/events", async (req, res) => {
  try {
    const { type, payload } = req.body;
    if (!type) return res.status(400).json({ error: "Campo 'type' é obrigatório" });

    const ref = await db.collection("events").add({
      type,
      payload: payload || {},
      createdAt: FieldValue.serverTimestamp(),
    });

    res.json({ id: ref.id });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

export default router;