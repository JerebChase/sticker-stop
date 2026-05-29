import { json } from '@sveltejs/kit';
import { getSettings } from '$lib/db';
import { sendCustomRequestEmail } from '$lib/email';

export async function POST({ request }) {
  const body = await request.json();
  const { name, email, description } = body;

  if (!name?.trim() || !email?.trim() || !description?.trim()) {
    return json({ error: 'Name, email, and description are required.' }, { status: 400 });
  }

  let recipients = [];
  try {
    const settings = await getSettings();
    recipients = (settings.notification_emails || '').split(',').map(e => e.trim()).filter(Boolean);
  } catch { /* no recipients configured */ }

  await sendCustomRequestEmail(body, recipients);

  return json({ success: true });
}
