import { json } from '@sveltejs/kit';
import { deleteBackgroundImage } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function DELETE({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  await deleteBackgroundImage(params.id);
  return json({ success: true });
}
