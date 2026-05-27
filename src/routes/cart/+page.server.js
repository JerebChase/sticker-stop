import { getSettings } from '$lib/db';
import { STRIPE_PUBLIC_KEY } from '$env/static/private';

export async function load() {
  let applePayContact = '';
  try {
    const settings = await getSettings();
    applePayContact = settings.apple_pay_contact || '';
  } catch { /* DB not configured */ }
  return { applePayContact, stripePublicKey: STRIPE_PUBLIC_KEY || '' };
}
