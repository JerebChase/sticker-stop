import { json } from '@sveltejs/kit';
import { listAllStickerBooks, upsertStickerBook, updateStickerBookOrder } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function GET({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const books = await listAllStickerBooks();
    return json(books);
  } catch (err) {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}

export async function PATCH({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const order = await request.json(); // [{ id, sortOrder }]
    await Promise.all(order.map(({ id, sortOrder }) => updateStickerBookOrder(id, sortOrder)));
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to reorder.' }, { status: 500 });
  }
}

export async function POST({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const book = await request.json();
    if (!book.title) return json({ error: 'title is required.' }, { status: 400 });
    // Generate a UUID as the ID — never entered by the admin
    const id = crypto.randomUUID();
    await upsertStickerBook({ ...book, id });
    return json({ ok: true, id });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to save.' }, { status: 500 });
  }
}
