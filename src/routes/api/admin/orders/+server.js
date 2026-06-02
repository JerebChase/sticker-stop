import { json } from '@sveltejs/kit';
import { listOrders } from '$lib/db';
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
