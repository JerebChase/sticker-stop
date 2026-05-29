import { json } from '@sveltejs/kit';
import { saveFeedback, getSettings } from '$lib/db';
import { sendFeedbackEmail } from '$lib/email';

export async function POST({ request }) {
  const body = await request.json();
  const { mood, moodLabel, topics, name, email, message, anonymous } = body;

  if (!message?.trim()) {
    return json({ error: 'Message is required.' }, { status: 400 });
  }

  try {
    await saveFeedback({ mood, mood_label: moodLabel, topics, name, email, message, anonymous });
  } catch (err) {
    console.error('Failed to save feedback to DB:', err.message);
  }

  let recipients = [];
  try {
    const settings = await getSettings();
    recipients = (settings.notification_emails || '').split(',').map(e => e.trim()).filter(Boolean);
  } catch { /* no recipients configured */ }

  await sendFeedbackEmail({ mood, moodLabel, topics, name, email, message, anonymous }, recipients);

  return json({ success: true });
}
