import { getCheckoutSession } from '$lib/db';
import { STRIPE_PUBLIC_KEY } from '$env/static/private';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  let session;
  try {
    session = await getCheckoutSession(params.token);
  } catch (err) {
    throw error(503, 'Database unavailable');
  }

  if (!session) throw error(404, 'This checkout link has expired or is invalid.');
  if (session.status === 'complete') {
    return { alreadyComplete: true, orderId: session.orderId };
  }

  return {
    token: params.token,
    cart: session.cart,
    formData: session.formData,
    stripePublicKey: STRIPE_PUBLIC_KEY || '',
    alreadyComplete: false,
    orderId: null,
  };
}
