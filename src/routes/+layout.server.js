import { ADMIN_PASSWORD } from '$env/static/private';

export async function load({ cookies }) {
  return { adminAuthed: cookies.get('admin_auth') === ADMIN_PASSWORD };
}
