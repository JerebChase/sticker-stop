import { json } from '@sveltejs/kit';
import { getSettings, updateSettings } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function GET({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    return json(await getSettings());
  } catch {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}

export async function PUT({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const body = await request.json();
    await updateSettings(body);
    return json({ success: true });
  } catch {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}
