import { json } from '@sveltejs/kit';
import { listBackgroundCategories, createBackgroundCategory } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function GET({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const cats = await listBackgroundCategories();
  return json(cats);
}

export async function POST({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json();
  const { label, emoji, color } = body;
  if (!label?.trim()) return json({ error: 'Label is required.' }, { status: 400 });
  const id = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await createBackgroundCategory({ id, label: label.trim(), emoji, color });
  return json({ success: true, id });
}
