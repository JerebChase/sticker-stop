import { listStickerBooks } from '$lib/db';

export async function load() {
  try {
    const books = await listStickerBooks();
    return { books };
  } catch {
    // DB not configured
    return { books: [] };
  }
}
