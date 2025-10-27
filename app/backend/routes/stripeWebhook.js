import { Router } from "express";
import Stripe from "stripe";
import { db } from "../services/firebaseAdmin.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/stripe/webhook
 * Rota para lidar com notificações enviadas pelo Stripe.
 * O corpo é tratado como raw JSON no server.js.
 */
router.post("/webhook", (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erro ao validar assinatura do Stripe:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Processamento do evento recebido
  switch (event.type) {
    case "checkout.session.completed":
      handleCheckoutCompleted(event.data.object);
      break;
    case "invoice.payment_failed":
      handlePaymentFailed(event.data.object);
      break;
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  try {
    await db.collection("payments").add({
      event: "checkout.session.completed",
      data: session,
      receivedAt: new Date(),
    });
  } catch (e) {
    console.error("Erro ao salvar pagamento:", e);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    await db.collection("payments").add({
      event: "invoice.payment_failed",
      data: invoice,
      receivedAt: new Date(),
    });
  } catch (e) {
    console.error("Erro ao registrar falha de pagamento:", e);
  }
}

export default router;
