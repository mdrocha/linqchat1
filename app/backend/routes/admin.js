import { Router } from "express";
import { db } from "../services/firebaseAdmin.js";

const router = Router();

/**
 * GET /api/admin/users
 * Lista até 50 usuários cadastrados no Firestore.
 */
router.get("/users", async (_req, res) => {
  try {
    const snapshot = await db.collection("users").limit(50).get();
    const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(users);
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Remove um usuário específico.
 */
router.delete("/users/:id", async (req, res) => {
  try {
    await db.collection("users").doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

/**
 * PUT /api/admin/users/:id
 * Atualiza dados básicos de um usuário.
 */
router.put("/users/:id", async (req, res) => {
  try {
    const data = req.body;
    await db.collection("users").doc(req.params.id).update(data);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: String(e) });
  }
});

export default router;