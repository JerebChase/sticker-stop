import { getStickerBook } from '$lib/db';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  let book;
  try {
    book = await getStickerBook(params.id);
  } catch {
    book = null;
  }
  if (!book) throw error(404, 'Sticker book not found');
  return { book };
}
