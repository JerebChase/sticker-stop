import { listBackgroundCategories, listBackgroundImages } from '$lib/db';

export async function load() {
  try {
    const [cats, images] = await Promise.all([
      listBackgroundCategories(),
      listBackgroundImages(),
    ]);
    const categories = cats.map(c => ({
      ...c,
      images: images.filter(img => img.category_id === c.id),
    }));
    return { categories };
  } catch {
    return { categories: [] };
  }
}
