import { json } from '@sveltejs/kit';
import { listBackgroundImages, createBackgroundImage } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function GET({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const imgs = await listBackgroundImages();
  return json(imgs);
}

export async function POST({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json();
  const { category_id, category_label, name, file, preview } = body;
  if (!category_id || !name?.trim() || !file) return json({ error: 'category_id, name, and file are required.' }, { status: 400 });
  const id = `bg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await createBackgroundImage({ id, category_id, category_label: category_label ?? '', name: name.trim(), file, preview });
  return json({ success: true, id });
}
