import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';

export async function POST({ request }) {
  const body = await request.json();
  const { mood, moodLabel, topics, name, email, message, anonymous, notificationEmails } = body;

  if (!message) {
    return json({ error: 'Message is required.' }, { status: 400 });
  }

  const resend = new Resend(RESEND_API_KEY);

  const recipients = notificationEmails
    ? notificationEmails.split(',').map(e => e.trim()).filter(Boolean)
    : [];

  if (!recipients.length) {
    return json({ success: true });
  }

  const moodEmoji = mood || '💬';
  const topicsText = topics?.length ? topics.join(', ') : 'General';
  const fromLabel = anonymous ? 'Anonymous' : (name || 'Someone');

  const moodColors = { '😖': '#ff8a3d', '🤔': '#ffd23f', '😊': '#6ddc8a', '🤩': '#4ec3ff', '🥳': '#ff4d8d' };
  const moodBg = moodColors[mood] || '#fff7e3';

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff7e3;color:#2a2238;">
  <div style="background:${moodBg};border:3px solid #2a2238;border-radius:18px;padding:24px;margin-bottom:20px;text-align:center;">
    <div style="font-size:48px;line-height:1;">${moodEmoji}</div>
    <h1 style="margin:8px 0 0;font-size:24px;">New Feedback — ${moodLabel || mood}</h1>
  </div>
  <div style="background:white;border:3px solid #2a2238;border-radius:18px;padding:24px;box-shadow:0 6px 0 #2a2238;margin-bottom:16px;">
    <h2 style="margin:0 0 12px;">From</h2>
    <p><strong>Name:</strong> ${fromLabel}</p>
    ${!anonymous && email ? `<p><strong>Email:</strong> ${email}</p>` : '<p><em>Anonymous — no reply requested</em></p>'}
    <p><strong>Topics:</strong> ${topicsText}</p>
  </div>
  <div style="background:white;border:3px solid #2a2238;border-radius:18px;padding:24px;box-shadow:0 6px 0 #2a2238;margin-bottom:16px;">
    <h2 style="margin:0 0 12px;">Message</h2>
    <p style="background:#fff7e3;padding:16px;border-radius:12px;border:2px dashed #2a2238;font-size:16px;line-height:1.5;">${message}</p>
  </div>
  <p style="text-align:center;font-size:13px;opacity:0.5;">${anonymous ? 'This person requested anonymity — no reply needed.' : `Reply to this email to respond to ${fromLabel}`}</p>
</body></html>`;

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      ...((!anonymous && email) ? { replyTo: email } : {}),
      to: recipients,
      subject: `${moodEmoji} Feedback from ${fromLabel}`,
      html,
      text: `Feedback from ${fromLabel}\nMood: ${moodLabel}\nTopics: ${topicsText}\n\n${message}`,
    });
  } catch (err) {
    console.error('Feedback email failed:', err.message);
  }

  return json({ success: true });
}
