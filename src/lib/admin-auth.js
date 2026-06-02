import { ADMIN_PASSWORD } from '$env/static/private';

export function isAdminAuthed({ request, cookies }) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD || cookies.get('admin_auth') === ADMIN_PASSWORD;
}

export const ADMIN_COOKIE_OPTS = {
  path:     '/',
  httpOnly: true,
  sameSite: 'strict',
  maxAge:   60 * 60 * 24 * 30,
};
