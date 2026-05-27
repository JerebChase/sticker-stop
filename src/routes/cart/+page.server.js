import { getSettings } from '$lib/db';

export async function load() {
  try {
    const settings = await getSettings();
    return { applePayContact: settings.apple_pay_contact || '' };
  } catch {
    return { applePayContact: '' };
  }
}
