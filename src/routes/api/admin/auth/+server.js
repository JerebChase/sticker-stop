import { json } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';
import { ADMIN_COOKIE_OPTS } from '$lib/admin-auth';

export async function GET({ cookies }) {
  const ok = cookies.get('admin_auth') === ADMIN_PASSWORD;
  return json({ ok });
}

export async function POST({ request, cookies }) {
  const { password } = await request.json();
  const ok = password === ADMIN_PASSWORD;
  if (ok) {
    cookies.set('admin_auth', ADMIN_PASSWORD, ADMIN_COOKIE_OPTS);
  }
  return json({ ok });
}
