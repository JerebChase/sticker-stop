import { json } from '@sveltejs/kit';
import { listAllStickerSets, upsertStickerSet, updateStickerSetOrder } from '$lib/db';
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

export async function PATCH({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const order = await request.json(); // [{ id, sortOrder }]
    await Promise.all(order.map(({ id, sortOrder }) => updateStickerSetOrder(id, sortOrder)));
    return json({ ok: true });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to reorder.' }, { status: 500 });
  }
}

export async function POST({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const set = await request.json();
    if (!set.name) return json({ error: 'name is required.' }, { status: 400 });
    // Generate a UUID as the ID — never entered by the admin
    const id = crypto.randomUUID();
    const sheets = (set.sheets ?? []).map((s, i) => ({ ...s, id: `${id}-${i + 1}` }));
    await upsertStickerSet({ ...set, id, sheets });
    return json({ ok: true, id });
  } catch (err) {
    return json({ error: err.message ?? 'Failed to save.' }, { status: 500 });
  }
}
