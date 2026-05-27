import { json } from '@sveltejs/kit';
import { getSettings } from '$lib/db';
import { ADMIN_PASSWORD } from '$env/static/private';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

function auth(request) {
  const pw = request.headers.get('x-admin-password') ?? new URL(request.url).searchParams.get('password');
  return pw === ADMIN_PASSWORD;
}

export async function POST({ request }) {
  if (!auth(request)) return json({ error: 'Unauthorized.' }, { status: 401 });

  let settings;
  try {
    settings = await getSettings();
  } catch (err) {
    return json({ error: `Database error: ${err.message}` }, { status: 503 });
  }

  const to = (settings.notification_emails || '').split(',')[0]?.trim() || settings.smtp_user;
  const from = settings.smtp_from || settings.smtp_user;

  // ── Resend path ──
  if (settings.resend_api_key) {
    if (!from) {
      return json({ error: 'Set a "From address" in settings (e.g. "Sticker Stop <hello@yourdomain.com>").' }, { status: 400 });
    }
    if (!to) {
      return json({ error: 'Add at least one notification email so the test has somewhere to send.' }, { status: 400 });
    }
    try {
      const resend = new Resend(settings.resend_api_key);
      const result = await resend.emails.send({
        from,
        to,
        subject: '✅ Sticker Stop — email test',
        text: 'This is a test email from Sticker Stop. If you got this, Resend is configured correctly!',
      });
      if (result.error) throw new Error(result.error.message);
      return json({ ok: true, to });
    } catch (err) {
      return json({ error: err.message }, { status: 400 });
    }
  }

  // ── SMTP fallback path ──
  if (!settings.smtp_host) {
    return json({ error: 'No Resend API key or SMTP host configured. Add your Resend API key in settings.' }, { status: 400 });
  }
  if (!settings.smtp_pass) {
    return json({ error: 'SMTP password not saved yet. Enter it and save settings first.' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host:   settings.smtp_host,
    port:   parseInt(settings.smtp_port || '587', 10),
    secure: parseInt(settings.smtp_port || '587', 10) === 465,
    auth: { user: settings.smtp_user, pass: settings.smtp_pass },
  });

  try {
    await transporter.verify();
  } catch (err) {
    return json({ error: `SMTP connection failed: ${err.message}` }, { status: 400 });
  }

  try {
    await transporter.sendMail({
      from: from || settings.smtp_user,
      to:   to   || settings.smtp_user,
      subject: '✅ Sticker Stop — email test',
      text: 'This is a test email from Sticker Stop. If you got this, your SMTP settings are working!',
    });
    return json({ ok: true, to });
  } catch (err) {
    return json({ error: `Send failed: ${err.message}` }, { status: 500 });
  }
}
