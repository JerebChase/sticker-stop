import { json } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';

export async function POST({ request }) {
  const { password } = await request.json();
  return json({ ok: password === ADMIN_PASSWORD });
}
