import { json } from '@sveltejs/kit';
import { listAllStickerSets, upsertStickerSet } from '$lib/db';
import { ADMIN_PASSWORD } from '$env/static/private';

function auth(request) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD;
}

export async function GET({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const sets = await listAllStickerSets();
    return json(sets);
  } catch (err) {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}

export async function POST({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const set = await request.json();
    if (!set.id || !set.name) return json({ error: 'id and name are required.' }, { status: 400 });
    await upsertStickerSet(set);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to save.' }, { status: 500 });
  }
}
