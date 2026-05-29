import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';
import { saveFeedback, getSettings } from '$lib/db';

function buildFeedbackHtml(data) {
  const { mood, moodLabel, topics, name, email, message, anonymous } = data;
  const fromLabel = anonymous ? 'Anonymous' : (name || 'Someone');
  const topicsText = topics?.length ? topics.join(', ') : 'General';
  const moodColors = { '😖': '#ff8a3d', '🤔': '#ffd23f', '😊': '#6ddc8a', '🤩': '#4ec3ff', '🥳': '#ff4d8d' };
  const moodBg = moodColors[mood] || '#fff7e3';
  const now = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Feedback — Sticker Stop</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Bagel+Fat+One&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=Caveat:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  body { margin:0; padding:0; background:#efe7d0; }
  a    { color:#2a2238; }
</style>
</head>
<body style="margin:0;padding:0;background:#efe7d0;font-family:'Nunito',Arial,sans-serif;">

<table cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background:#efe7d0;padding:36px 16px 60px;">
<tr><td align="center">

<table cellpadding="0" cellspacing="0" border="0" width="600"
  style="max-width:600px;background:#fff7e3;
    border:3px solid #2a2238;border-radius:26px;overflow:hidden;
    box-shadow:0 10px 0 rgba(42,34,56,0.85);">

  <!-- Banner -->
  <tr>
    <td style="background:${moodBg};border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#2a2238;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One',cursive;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One',cursive;color:#2a2238;font-size:26px;
                    line-height:1;letter-spacing:-0.4px;">Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">New Feedback</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Mood hero -->
  <tr>
    <td style="padding:32px 28px 8px;text-align:center;">
      <div style="font-size:64px;line-height:1;margin-bottom:10px;">${mood || '💬'}</div>
      <div style="display:inline-block;background:#2a2238;color:white;
        font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:11px;
        letter-spacing:1.5px;padding:5px 12px;border-radius:999px;
        text-transform:uppercase;margin-bottom:14px;">
        ${now}
      </div>
      <h1 style="font-family:'Bagel Fat One',cursive;font-size:36px;
        margin:0 0 6px;line-height:1.05;letter-spacing:-1px;color:#2a2238;">
        Feedback from <span style="color:#ff4d8d;">${fromLabel}</span>
      </h1>
      ${!anonymous && email ? `<p style="font-family:'Caveat',cursive;font-size:20px;color:#2a2238;opacity:0.8;margin:0;">
        <a href="mailto:${email}" style="color:#2a2238;">${email}</a>
      </p>` : ''}
    </td>
  </tr>

  <!-- Details row -->
  <tr>
    <td style="padding:16px 28px 4px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:16px 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:8px 0;border-bottom:2px dashed rgba(42,34,56,0.18);width:50%">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:11px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">Mood</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:17px;color:#2a2238;">
                    ${mood} ${moodLabel || ''}</div>
                </td>
                <td style="padding:8px 0 8px 16px;border-bottom:2px dashed rgba(42,34,56,0.18);">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:11px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">Topics</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:15px;color:#2a2238;">
                    ${topicsText}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Message -->
  <tr>
    <td style="padding:8px 28px 4px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">What they said</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:20px 22px;">
            <div style="font-family:'Caveat',cursive;font-size:22px;color:#2a2238;line-height:1.6;">
              ${message.replace(/\n/g, '<br/>')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr><td style="padding:14px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;
        font-size:11px;color:#2a2238;opacity:0.6;
        text-transform:uppercase;letter-spacing:1.2px;margin:10px 0 0;">
        Sticker Stop &middot; Admin Notification
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function POST({ request }) {
  const body = await request.json();
  const { mood, moodLabel, topics, name, email, message, anonymous, notificationEmails } = body;

  if (!message?.trim()) {
    return json({ error: 'Message is required.' }, { status: 400 });
  }

  // Save to DB (best-effort — don't fail the request if DB is down)
  try {
    await saveFeedback({ mood, mood_label: moodLabel, topics, name, email, message, anonymous });
  } catch (err) {
    console.error('Failed to save feedback to DB:', err.message);
  }

  // Send email
  let recipientList = (notificationEmails || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  if (!recipientList.length) {
    let settings = { notification_emails: '' };
    try { settings = await getSettings(); } catch {}
    recipientList = (settings.notification_emails || '')
      .split(',').map(e => e.trim()).filter(Boolean);
  }

  if (recipientList.length && RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY);
    const from = EMAIL_FROM || 'Sticker Stop <feedback@sticker-stop.com>';
    const fromLabel = anonymous ? 'Anonymous' : (name || 'Someone');
    try {
      await resend.emails.send({
        from,
        ...((!anonymous && email) ? { replyTo: email } : {}),
        to: recipientList,
        subject: `${mood || '💬'} Feedback from ${fromLabel} — Sticker Stop`,
        html: buildFeedbackHtml({ mood, moodLabel, topics, name, email, message, anonymous }),
        text: `Feedback from ${fromLabel}\nMood: ${moodLabel || mood}\nTopics: ${topics?.join(', ') || 'General'}\n\n${message}`,
      });
    } catch (err) {
      console.error('Feedback email failed:', err.message);
    }
  }

  return json({ success: true });
}
