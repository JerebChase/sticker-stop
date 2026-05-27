import { json } from '@sveltejs/kit';
import { getCheckoutSession, completeCheckoutSession } from '$lib/db';

export async function GET({ params }) {
  const session = await getCheckoutSession(params.token).catch(() => null);
  if (!session) return json({ error: 'Session not found or expired.' }, { status: 404 });
  return json(session);
}

export async function PATCH({ params, request }) {
  const { orderId } = await request.json();
  if (!orderId) return json({ error: 'orderId required.' }, { status: 400 });
  try {
    await completeCheckoutSession(params.token, orderId);
  } catch (err) {
    console.error('Failed to complete checkout session:', err.message);
    return json({ error: 'Could not update session.' }, { status: 503 });
  }
  return json({ success: true });
}
