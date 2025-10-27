import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createStripeCustomer(email, name) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      plan: "basic_trial",
      source: "linqchat",
    },
  });
}