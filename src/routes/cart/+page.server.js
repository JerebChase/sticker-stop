import { getSettings } from '$lib/db';

export async function load() {
  let paymentContact = '';
  try {
    const settings = await getSettings();
    paymentContact = settings.apple_pay_contact || '';
  } catch { /* DB not configured */ }
  return { paymentContact };
}
