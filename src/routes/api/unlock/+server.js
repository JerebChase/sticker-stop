import { json } from '@sveltejs/kit';
import { getSettings } from '$lib/db';

export async function POST({ request, cookies }) {
  const { password, redirect } = await request.json();

  let sitePassword = '';
  try {
    const s = await getSettings();
    sitePassword = s.site_password || '';
  } catch {
    return json({ error: 'Could not reach server.' }, { status: 503 });
  }

  if (!sitePassword || password !== sitePassword) {
    return json({ error: 'Wrong password.' }, { status: 401 });
  }

  cookies.set('site_auth', sitePassword, {
    path:     '/',
    httpOnly: true,
    sameSite: 'strict',
    maxAge:   60 * 60 * 24 * 30, // 30 days
  });

  return json({ ok: true, redirect: redirect || '/' });
}
