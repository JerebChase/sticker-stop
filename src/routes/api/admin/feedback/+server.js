import { json } from '@sveltejs/kit';
import { listFeedback } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function GET({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const rows = await listFeedback();
    return json(rows);
  } catch (err) {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}
