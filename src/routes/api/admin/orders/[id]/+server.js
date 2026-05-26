import { json } from '@sveltejs/kit';
import { updateOrder } from '$lib/db';
import { ADMIN_PASSWORD } from '$env/static/private';

function auth(request) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD;
}

export async function PATCH({ request, params }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json();
  await updateOrder(parseInt(params.id), body);
  return json({ success: true });
}
