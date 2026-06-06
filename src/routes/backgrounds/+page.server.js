import { listBackgroundImages, listStickerSets } from '$lib/db';

export async function load() {
  try {
    const [images, sets] = await Promise.all([
      listBackgroundImages(),
      listStickerSets(),
    ]);

    // Build color lookup from set/sheet ids
    const colorLookup = new Map();
    for (const set of sets) {
      colorLookup.set(set.id, set.color);
      for (const sheet of set.sheets ?? []) {
        colorLookup.set(sheet.id, set.color);
      }
    }

    // Group images by category_id, using stored category_label for display
    const catMap = new Map();
    for (const img of images) {
      const key = img.category_id;
      if (!catMap.has(key)) {
        catMap.set(key, {
          id: img.category_id,
          label: img.category_label || img.category_id,
          color: colorLookup.get(img.category_id) ?? '#6ddc8a',
          images: [],
        });
      }
      catMap.get(key).images.push(img);
    }

    return { categories: [...catMap.values()] };
  } catch {
    return { categories: [] };
  }
}
