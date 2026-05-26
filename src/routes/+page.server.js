import { listStickerSets } from '$lib/db';
import { STICKER_SETS } from '$lib/data';

export async function load() {
  try {
    const sets = await listStickerSets();
    return { sets };
  } catch {
    // DB not configured — fall back to static data
    return { sets: STICKER_SETS };
  }
}
