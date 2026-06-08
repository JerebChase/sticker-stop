import { json } from '@sveltejs/kit';
import { listOrders, createOrder } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function GET({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const orders = await listOrders();
    return json(orders);
  } catch (err) {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}

export async function POST({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json();
  const name  = body.customer_name?.trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name) return json({ error: 'Customer name is required.' }, { status: 400 });
  if (!items.length) return json({ error: 'At least one item is required.' }, { status: 400 });

  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);

  try {
    const row = await createOrder({
      customer_name:    name,
      customer_email:   body.customer_email?.trim() ?? '',
      customer_address: '',
      customer_notes:   'Walk-in order — created by admin',
      items,
      subtotal,
      shipping: 0,
      total: subtotal,
      delivery_method: 'in_person',
      status: 'fulfilled',
      paid: body.paid ?? true,
      apple_pay: body.apple_pay ?? false,
    });
    return json({ success: true, id: row.id, created_at: row.created_at });
  } catch (err) {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}
