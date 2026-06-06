import { json } from '@sveltejs/kit';
import { deleteBackgroundImage, updateBackgroundImageName } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function DELETE({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  await deleteBackgroundImage(params.id);
  return json({ success: true });
}

export async function PATCH({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const { name } = await request.json();
  if (!name?.trim()) return json({ error: 'name is required.' }, { status: 400 });
  await updateBackgroundImageName(params.id, name.trim());
  return json({ success: true });
}
