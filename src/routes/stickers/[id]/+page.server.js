import { getStickerSet } from '$lib/db';
import { getSet } from '$lib/data';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  let set;
  try {
    set = await getStickerSet(params.id);
  } catch {
    // DB not configured — fall back to static data
    set = getSet(params.id);
  }
  if (!set) throw error(404, 'Sticker set not found');
  return { set };
}
