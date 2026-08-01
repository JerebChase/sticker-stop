import { json } from '@sveltejs/kit';
import { createOrder, getSettings } from '$lib/db';
import { sendOrderEmail } from '$lib/email';

export async function POST({ request, url }) {
  const body = await request.json();
  const { customerName, customerEmail, customerAddress, deliveryMethod, items, subtotal, shipping, total } = body;

  const hasBook = Array.isArray(items) && items.some(i => i.kind === 'book');
  // Sticker books are pickup only — mail isn't an option once one's in the order.
  const method = (deliveryMethod === 'pickup' || hasBook) ? 'pickup' : 'mail';
  if (!customerName || !customerEmail || (!customerAddress && method !== 'pickup') || !items?.length || total == null) {
    return json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const shippingCost = method === 'pickup' ? 0 : (shipping ?? 0);
  const order = {
    customer_name:    customerName.trim(),
    customer_email:   customerEmail ? customerEmail.trim() : '',
    customer_address: method === 'mail' ? (customerAddress ?? '').trim() : '',
    customer_notes:   '',
    delivery_method: method,
    items,
    subtotal: subtotal ?? total,
    shipping: shippingCost,
    total: method === 'pickup' ? (subtotal ?? total) : total,
  };

  let row;
  try {
    row = await createOrder(order);
  } catch (err) {
    console.error('DB error saving order:', err.message);
    return json({ error: 'Could not save order — database not configured.' }, { status: 503 });
  }

  try {
    const settings = await getSettings();
    await sendOrderEmail({ ...order, id: row.id }, settings, url.origin);
  } catch (err) {
    console.error('Email send failed (order still saved):', err.message, err.stack);
  }

  return json({ success: true, orderId: row.id });
}
