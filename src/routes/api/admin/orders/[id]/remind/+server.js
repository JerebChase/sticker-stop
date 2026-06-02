import { json } from '@sveltejs/kit';
import { getOrder } from '$lib/db';
import { sendPaymentReminderEmail } from '$lib/email';
import { isAdminAuthed } from '$lib/admin-auth';

export async function POST({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });

  const order = await getOrder(parseInt(params.id));
  if (!order) return json({ error: 'Order not found.' }, { status: 404 });
  if (!order.customer_email) return json({ error: 'Order has no customer email.' }, { status: 400 });

  try {
    const origin = new URL(request.url).origin;
    await sendPaymentReminderEmail(order, origin);
    return json({ success: true });
  } catch (err) {
    console.error('Reminder email failed:', err.message);
    return json({ error: 'Failed to send email.' }, { status: 500 });
  }
}
