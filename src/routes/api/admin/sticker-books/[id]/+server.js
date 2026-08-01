import { json } from '@sveltejs/kit';
import { upsertStickerBook, deleteStickerBook } from '$lib/db';
import { isAdminAuthed } from '$lib/admin-auth';

export async function PUT({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const book = await request.json();
    await upsertStickerBook({ ...book, id: params.id });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to update.' }, { status: 500 });
  }
}

export async function DELETE({ request, cookies, params }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    await deleteStickerBook(params.id);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to delete.' }, { status: 500 });
  }
}
