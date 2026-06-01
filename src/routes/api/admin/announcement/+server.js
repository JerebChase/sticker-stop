import { json } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';
import { sendAnnouncementEmail } from '$lib/email';

function auth(request) {
  const pw = request.headers.get('x-admin-password');
  return pw === ADMIN_PASSWORD;
}

export async function POST({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });

  const { subject, body, imageUrl, recipients } = await request.json();

  if (!subject?.trim()) return json({ error: 'Subject is required.' }, { status: 400 });
  if (!body?.trim())    return json({ error: 'Body is required.' },    { status: 400 });
  if (!recipients?.length) return json({ error: 'No recipients.' },    { status: 400 });

  try {
    const results = await sendAnnouncementEmail({ subject, body, imageUrl }, recipients);
    return json(results);
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}
