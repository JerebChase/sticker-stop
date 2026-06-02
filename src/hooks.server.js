import { ensureSchema, getSettings } from '$lib/db';
import { redirect } from '@sveltejs/kit';

try {
  await ensureSchema();
} catch (err) {
  console.warn('DB schema setup skipped (DATABASE_URL not configured):', err.message);
}

// Cache site_password briefly so we don't hit the DB on every request
let _cache = { password: null, at: 0 };

async function getSitePassword() {
  if (Date.now() - _cache.at < 30_000) return _cache.password;
  try {
    const s = await getSettings();
    _cache = { password: s.site_password || '', at: Date.now() };
  } catch {
    // DB unavailable — fall back to cached value
  }
  return _cache.password;
}

export async function handle({ event, resolve }) {
  const { pathname } = event.url;

  // Never gate the admin panel, any API route, or the unlock page itself
  const isExempt =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/unlock');

  if (!isExempt) {
    const sitePassword = await getSitePassword();
    if (sitePassword) {
      const cookie = event.cookies.get('site_auth');
      if (cookie !== sitePassword) {
        const dest = pathname === '/' ? '/unlock' : `/unlock?r=${encodeURIComponent(pathname)}`;
        throw redirect(303, dest);
      }
    }
  }

  return resolve(event);
}
