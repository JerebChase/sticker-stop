import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM } from '$env/static/private';
import { getSettings } from '$lib/db';

function buildCustomRequestHtml(data) {
  const { name, email, purpose, theme, description, styles, qty, deadline, budget, fileNames } = data;
  const stylesText = styles?.length ? styles.join(', ') : '(none selected)';
  const filesText = fileNames?.length ? fileNames.join(', ') : '(none)';
  const qtyLabels = { '10': '10 sheets — $45', '25': '25 sheets — $95', '50': '50+ sheets — Quote' };
  const qtyText = qtyLabels[qty] || qty;
  const now = new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>New Custom Sticker Request from ${name}</title>
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
    <td style="background:#8b5cf6;border-bottom:3px solid #2a2238;padding:20px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">
                  <div style="width:52px;height:52px;border-radius:50%;
                    background:#ff4d8d;border:3.5px solid white;
                    text-align:center;line-height:48px;display:inline-block;
                    box-shadow:0 3px 0 rgba(0,0,0,0.18);">
                    <span style="font-family:'Bagel Fat One',cursive;
                      color:white;font-size:26px;line-height:1;vertical-align:middle;">S!</span>
                  </div>
                </td>
                <td valign="middle">
                  <div style="font-family:'Bagel Fat One',cursive;color:white;font-size:26px;
                    line-height:1;text-shadow:0 2px 0 rgba(42,34,56,0.35);letter-spacing:-0.4px;">
                    Sticker Stop</div>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" valign="middle">
            <div style="display:inline-block;background:white;color:#2a2238;
              border:3px solid #2a2238;border-radius:999px;padding:6px 14px;
              font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
              box-shadow:0 3px 0 rgba(42,34,56,0.85);">Custom Request</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Hero -->
  <tr>
    <td style="padding:36px 28px 8px;text-align:center;">
      <div style="display:inline-block;background:#2a2238;color:white;
        font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:11px;
        letter-spacing:1.5px;padding:5px 12px;border-radius:999px;
        text-transform:uppercase;margin-bottom:14px;">
        New request &middot; ${now}
      </div>
      <h1 style="font-family:'Bagel Fat One',cursive;font-size:40px;
        margin:0 0 8px;line-height:1.05;letter-spacing:-1px;color:#2a2238;">
        Custom request from <span style="color:#8b5cf6;">${name}</span>!
      </h1>
      <p style="font-family:'Caveat',cursive;font-size:22px;color:#2a2238;opacity:0.85;margin:0;">
        <a href="mailto:${email}" style="color:#2a2238;">${email}</a>
      </p>
    </td>
  </tr>

  <!-- Details -->
  <tr>
    <td style="padding:28px 28px 4px;">
      <div style="display:inline-block;background:#8b5cf6;color:white;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Request Details</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:18px 22px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${[
                ['Purpose', purpose || '—'],
                ['Theme', theme || '—'],
                ['Art Styles', stylesText],
                ['Quantity', qtyText],
                ['Budget', budget || '—'],
                ['Deadline', deadline || '—'],
                ['Reference Files', filesText],
              ].map(([label, value], i, arr) => `
              <tr>
                <td style="padding:10px 0;${i < arr.length - 1 ? 'border-bottom:2px dashed rgba(42,34,56,0.18);' : ''}">
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:12px;
                    text-transform:uppercase;letter-spacing:1px;color:#2a2238;opacity:0.5;margin-bottom:3px;">${label}</div>
                  <div style="font-family:'Fredoka',Arial,sans-serif;font-weight:600;font-size:16px;color:#2a2238;">
                    ${value}</div>
                </td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Description -->
  <tr>
    <td style="padding:6px 28px 4px;">
      <div style="display:inline-block;background:#ffd23f;
        border:2.5px solid #2a2238;padding:4px 14px;border-radius:999px;
        font-family:'Fredoka',Arial,sans-serif;font-weight:700;font-size:13px;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;
        box-shadow:0 3px 0 rgba(42,34,56,0.85);">Their vision</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:white;border:3px solid #2a2238;border-radius:18px;
          box-shadow:0 6px 0 rgba(42,34,56,0.85);">
        <tr>
          <td style="padding:18px 22px;">
            <div style="font-family:'Caveat',cursive;font-size:20px;color:#2a2238;line-height:1.6;">
              ${description.replace(/\n/g, '<br/>')}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr><td style="padding:18px 0 0;"></td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#fff1cf;border-top:3px dashed #2a2238;
      padding:22px 28px 24px;text-align:center;">
      <p style="font-family:'Caveat',cursive;font-size:22px;color:#2a2238;margin:0 0 4px;">
        time to make some magic! &#10024;
      </p>
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
  const { name, email, description } = body;

  if (!name?.trim() || !email?.trim() || !description?.trim()) {
    return json({ error: 'Name, email, and description are required.' }, { status: 400 });
  }

  let settings = { notification_emails: '' };
  try { settings = await getSettings(); } catch {}

  const recipients = (settings.notification_emails || '')
    .split(',').map(e => e.trim()).filter(Boolean);

  if (recipients.length && RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY);
    const from = EMAIL_FROM || 'Sticker Stop <orders@stickerstop.com>';
    const html = buildCustomRequestHtml(body);
    await resend.emails.send({
      from,
      to: recipients,
      subject: `New Custom Sticker Request from ${name}`,
      html,
    });
  }

  return json({ success: true });
}
