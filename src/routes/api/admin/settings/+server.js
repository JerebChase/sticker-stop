import { json } from '@sveltejs/kit';
import { getSettings, updateSettings } from '$lib/db';
import { ADMIN_PASSWORD } from '$env/static/private';

function auth(request) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD;
}

export async function GET({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const s = await getSettings();
    const { smtp_pass: _, ...safe } = s;
    return json(safe);
  } catch {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}

export async function PUT({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const body = await request.json();
    await updateSettings(body);
    return json({ success: true });
  } catch {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}
