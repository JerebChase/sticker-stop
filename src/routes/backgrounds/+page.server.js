import { listBackgroundImages, listStickerSets } from '$lib/db';

export async function load() {
  try {
    const [images, sets] = await Promise.all([
      listBackgroundImages(),
      listStickerSets(),
    ]);

    // Map every known set id / sheet id to its owning set (and sheet, if applicable)
    const ownerLookup = new Map();
    for (const set of sets) {
      ownerLookup.set(set.id, { set, sheet: null });
      for (const sheet of set.sheets ?? []) {
        ownerLookup.set(sheet.id, { set, sheet });
      }
    }

    const imagesByCategory = new Map();
    for (const img of images) {
      if (!imagesByCategory.has(img.category_id)) imagesByCategory.set(img.category_id, []);
      imagesByCategory.get(img.category_id).push(img);
    }

    const categories = [];
    const usedCategoryIds = new Set();

    // One section per known set, combining its set-level images with each
    // sheet's images as labeled subgroups, so a set's backgrounds live
    // together instead of splintering into one section per sheet.
    for (const set of sets) {
      const subgroups = [];

      const general = imagesByCategory.get(set.id);
      if (general?.length) {
        subgroups.push({ id: set.id, label: null, images: general });
        usedCategoryIds.add(set.id);
      }

      for (const sheet of set.sheets ?? []) {
        const sheetImages = imagesByCategory.get(sheet.id);
        if (sheetImages?.length) {
          subgroups.push({ id: sheet.id, label: sheet.name, images: sheetImages });
          usedCategoryIds.add(sheet.id);
        }
      }

      if (subgroups.length) {
        categories.push({
          id: set.id,
          label: set.name,
          color: set.color,
          subgroups,
          images: subgroups.flatMap(sg => sg.images),
        });
      }
    }

    // Any remaining categories (uploaded under a set/sheet id that no
    // longer exists) still get their own standalone section, as before.
    for (const [categoryId, catImages] of imagesByCategory) {
      if (usedCategoryIds.has(categoryId)) continue;
      const label = catImages[0]?.category_label || categoryId;
      categories.push({
        id: categoryId,
        label,
        color: '#6ddc8a',
        subgroups: [{ id: categoryId, label: null, images: catImages }],
        images: catImages,
      });
    }

    return { categories };
  } catch {
    return { categories: [] };
  }
}
