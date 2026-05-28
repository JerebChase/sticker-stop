import { json } from '@sveltejs/kit';
import { listFeedback } from '$lib/db';
import { ADMIN_PASSWORD } from '$env/static/private';

function auth(request) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD;
}

export async function GET({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const rows = await listFeedback();
    return json(rows);
  } catch (err) {
    return json({ error: 'Database not configured.' }, { status: 503 });
  }
}
