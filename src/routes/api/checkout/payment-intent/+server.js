import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';

export async function POST({ request }) {
  const { amount } = await request.json();
  if (!amount || amount < 50) {
    return json({ error: 'Invalid amount.' }, { status: 400 });
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  try {
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });
    return json({ clientSecret: intent.client_secret });
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}
