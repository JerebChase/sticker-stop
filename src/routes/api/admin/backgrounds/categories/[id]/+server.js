import { json } from '@sveltejs/kit';
import { updateBackgroundCategory, deleteBackgroundCategory } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function PUT({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json();
  await updateBackgroundCategory(params.id, body);
  return json({ success: true });
}

export async function DELETE({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  await deleteBackgroundCategory(params.id);
  return json({ success: true });
}
