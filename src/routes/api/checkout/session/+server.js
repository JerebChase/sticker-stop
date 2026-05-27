import { json } from '@sveltejs/kit';
import { createCheckoutSession } from '$lib/db';
import { randomUUID } from 'crypto';

export async function POST({ request }) {
  const { cart, formData } = await request.json();
  if (!Array.isArray(cart) || !cart.length) {
    return json({ error: 'Cart is empty.' }, { status: 400 });
  }

  const id = randomUUID();
  try {
    await createCheckoutSession(id, cart, formData ?? {});
  } catch (err) {
    console.error('Failed to create checkout session:', err.message);
    return json({ error: 'Could not create session.' }, { status: 503 });
  }

  return json({ id });
}
