import express from "express";
import { connectWhatsApp } from "../services/whatsappService.js";

const router = express.Router();

router.post("/connect", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ message: "UID é obrigatório." });

    const qr = await connectWhatsApp(uid);
    return res.json({ qr });
  } catch (err) {
    console.error("Erro WhatsApp:", err);
    res.status(500).json({ message: "Erro ao gerar QR Code." });
  }
});

export default router;