import { getSettings } from '$lib/db';

export async function load() {
  let notificationEmails = '';
  try { const s = await getSettings(); notificationEmails = s.notification_emails || ''; } catch {}
  return { notificationEmails };
}
