import { json } from '@sveltejs/kit';
import { updateOrder, getOrder } from '$lib/db';
import { sendFulfillmentEmail, sendCancellationEmail } from '$lib/email';
import { isAdminAuthed } from '$lib/admin-auth';

export async function PATCH({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json();
  await updateOrder(parseInt(params.id), body);

  const { status } = body;
  let emailSent = false;
  if (status === 'ready' || status === 'shipped' || status === 'canceled') {
    try {
      const order  = await getOrder(parseInt(params.id));
      const origin = new URL(request.url).origin;
      if (order?.customer_email) {
        if (status === 'canceled') {
          await sendCancellationEmail(order, origin);
        } else {
          await sendFulfillmentEmail(order, origin);
        }
        emailSent = true;
      }
    } catch (err) {
      console.error('Status email failed:', err.message);
    }
  }

  return json({ success: true, emailSent });
}
