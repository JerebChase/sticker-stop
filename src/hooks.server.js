import { ensureSchema } from '$lib/db';

try {
  await ensureSchema();
} catch (err) {
  console.warn('DB schema setup skipped (DATABASE_URL not configured):', err.message);
}
