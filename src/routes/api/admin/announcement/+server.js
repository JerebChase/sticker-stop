import { json } from '@sveltejs/kit';
import { isAdminAuthed } from '$lib/admin-auth';
import { sendAnnouncementEmail } from '$lib/email';

export async function POST({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });

  const { subject, body, imageUrl, videoUrl, recipients } = await request.json();

  if (!subject?.trim()) return json({ error: 'Subject is required.' }, { status: 400 });
  if (!body?.trim())    return json({ error: 'Body is required.' },    { status: 400 });
  if (!recipients?.length) return json({ error: 'No recipients.' },    { status: 400 });

  try {
    const results = await sendAnnouncementEmail({ subject, body, imageUrl, videoUrl }, recipients);
    return json(results);
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}
