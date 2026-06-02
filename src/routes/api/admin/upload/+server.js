import { json } from '@sveltejs/kit';
import { put } from '@vercel/blob';
import { isAdminAuthed } from '$lib/admin-auth';
import { env } from '$env/dynamic/private';

export async function POST({ request, cookies }) {
  if (!isAdminAuthed({ request, cookies })) return json({ error: 'Unauthorized.' }, { status: 401 });

  const BLOB_READ_WRITE_TOKEN = env.BLOB_READ_WRITE_TOKEN;
  if (!BLOB_READ_WRITE_TOKEN) {
    return json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return json({ error: 'No file provided.' }, { status: 400 });
    }

    // Use set ID prefix if provided, otherwise just timestamp
    const prefix = formData.get('setId') ? `stickers/${formData.get('setId')}` : 'stickers';
    const ext = file.name.split('.').pop();
    const filename = `${prefix}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      token: BLOB_READ_WRITE_TOKEN,
    });

    return json({ url: blob.url });
  } catch (err) {
    return json({ error: err.message ?? 'Upload failed.' }, { status: 500 });
  }
}
