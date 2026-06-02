import { json } from '@sveltejs/kit';
import { updateOrder, getOrder } from '$lib/db';
import { sendFulfillmentEmail } from '$lib/email';
import { isAdminAuthed } from '$lib/admin-auth';

export async function PATCH({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
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
