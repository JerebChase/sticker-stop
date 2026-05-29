import { json } from '@sveltejs/kit';
import { updateOrder, getOrder } from '$lib/db';
import { sendFulfillmentEmail } from '$lib/email';
import { ADMIN_PASSWORD } from '$env/static/private';

function auth(request) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD;
}

export async function PATCH({ request, params }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json();
  await updateOrder(parseInt(params.id), body);

  const { status } = body;
  let emailSent = false;
  if (status === 'ready' || status === 'shipped') {
    try {
      const order = await getOrder(parseInt(params.id));
      if (order?.customer_email) {
        const origin = new URL(request.url).origin;
        await sendFulfillmentEmail(order, origin);
        emailSent = true;
      }
    } catch (err) {
      console.error('Fulfillment email failed:', err.message);
    }
  }

  return json({ success: true, emailSent });
}
