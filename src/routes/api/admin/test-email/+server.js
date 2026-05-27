import { json } from '@sveltejs/kit';
import { getSettings } from '$lib/db';
import { ADMIN_PASSWORD } from '$env/static/private';
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

  if (!settings.smtp_host) {
    return json({ error: 'SMTP host is not configured. Fill in SMTP settings and save first.' }, { status: 400 });
  }
  if (!settings.smtp_user) {
    return json({ error: 'SMTP user is not configured.' }, { status: 400 });
  }
  if (!settings.smtp_pass) {
    return json({ error: 'SMTP password is not saved. Enter it in the password field and save settings first.' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const to = body.to || settings.notification_emails?.split(',')[0]?.trim() || settings.smtp_user;

  const transporter = nodemailer.createTransport({
    host:   settings.smtp_host,
    port:   parseInt(settings.smtp_port || '587', 10),
    secure: parseInt(settings.smtp_port || '587', 10) === 465,
    auth: { user: settings.smtp_user, pass: settings.smtp_pass },
  });

  try {
    await transporter.verify();
  } catch (err) {
    return json({
      error: `SMTP connection failed: ${err.message}`,
      hint: getHint(err.message, settings),
    }, { status: 400 });
  }

  try {
    await transporter.sendMail({
      from:    settings.smtp_from || settings.smtp_user,
      to,
      subject: '✅ Sticker Stop — email test',
      text:    'This is a test email from Sticker Stop. If you got this, your SMTP settings are working!',
    });
    return json({ ok: true, to });
  } catch (err) {
    return json({ error: `Send failed: ${err.message}` }, { status: 500 });
  }
}

function getHint(msg, settings) {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('username and password') || m.includes('535')) {
    if (settings.smtp_host?.includes('gmail')) {
      return 'Gmail requires an App Password (not your regular password). Go to myaccount.google.com → Security → 2-Step Verification → App passwords.';
    }
    return 'Check your username and password. Many providers require an app-specific password.';
  }
  if (m.includes('self signed') || m.includes('certificate')) {
    return 'TLS certificate error. Try port 587 instead of 465, or contact your email provider.';
  }
  if (m.includes('connect') || m.includes('econnrefused') || m.includes('timeout')) {
    return `Can't reach ${settings.smtp_host}:${settings.smtp_port}. Check the host and port. Common ports: 587 (TLS), 465 (SSL), 25 (plain).`;
  }
  return null;
}
