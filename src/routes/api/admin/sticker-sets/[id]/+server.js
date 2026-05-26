import { json } from '@sveltejs/kit';
import { upsertStickerSet, deleteStickerSet } from '$lib/db';
import { ADMIN_PASSWORD } from '$env/static/private';

function auth(request) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD;
}

export async function PUT({ request, params }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const set = await request.json();
    await upsertStickerSet({ ...set, id: params.id });
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to update.' }, { status: 500 });
  }
}

export async function DELETE({ request, params }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    await deleteStickerSet(params.id);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to delete.' }, { status: 500 });
  }
}
