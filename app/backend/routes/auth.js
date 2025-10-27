import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { auth, db } from "../services/firebaseAdmin.js"; // usa o SDK Admin
import { createAssistant } from "../services/openai.js";

const router = express.Router();

/* ================================
 * CADASTRO DE USUÁRIO
 * ================================ */
router.post("/register", async (req, res) => {
  console.log("=== INICIANDO CADASTRO ===");
  try {
    const { email, password, firstName, lastName, segment, phone, whatsapp } = req.body;
    console.log("Recebido:", req.body);

    // Verifica se já existe e-mail
    try {
      const existing = await auth.getUserByEmail(email);
      if (existing) {
        console.log("Usuário já existe:", existing.uid);
        return res.status(409).json({ message: "E-mail já cadastrado." });
      }
    } catch (e) {
      if (e.code !== "auth/user-not-found") {
        console.error("Erro ao verificar e-mail:", e);
        return res.status(500).json({ message: "Falha ao verificar e-mail existente." });
      }
    }

    console.log("Criando usuário no Firebase...");
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    console.log("Usuário criado:", userRecord.uid);

    console.log("Criando assistente...");
    const assistant = await createAssistant(segment);
    if (!assistant.id) {
      console.error("Assistente sem id retornado:", assistant);
      return res.status(502).json({ message: "Falha ao criar assistente." });
    }
    console.log("Assistente criado:", assistant.id);

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);

    console.log("Salvando dados no Firestore...");
    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      segment,
      phone,
      whatsapp,
      assistantId: assistant.id,
      plan: "basic_trial",
      stripeCustomerId: null,
      trialEnds: trialEnds.toISOString(),
      createdAt: new Date().toISOString(),
    });

    console.log("=== CADASTRO FINALIZADO ===");
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("ERRO COMPLETO AO REGISTRAR:", err);
    return res.status(500).json({ message: "Erro ao registrar usuário.", details: err.message });
  }
});

/* ================================
 * LOGIN DE USUÁRIO
 * ================================ */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "E-mail e senha são obrigatórios." });

    // Autentica usando REST API do Firebase Auth
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("Erro no login Firebase REST:", data.error.message);
      return res.status(401).json({ message: "E-mail ou senha inválidos." });
    }

    const user = await auth.getUser(data.localId);

    const token = jwt.sign(
      { uid: user.uid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ message: "Falha na autenticação." });
  }
});

export default router;