import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import { STICKER_SETS } from './data.js';

function sql() {
  return neon(DATABASE_URL);
}

export async function ensureSchema() {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS orders (
      id               SERIAL PRIMARY KEY,
      customer_name    TEXT NOT NULL,
      customer_email   TEXT DEFAULT '',
      customer_address TEXT NOT NULL,
      customer_notes   TEXT DEFAULT '',
      items            JSONB NOT NULL,
      subtotal         NUMERIC(10,2),
      shipping         NUMERIC(10,2),
      total            NUMERIC(10,2) NOT NULL,
      status           TEXT DEFAULT 'new',
      notes            TEXT DEFAULT '',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS sticker_sets (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      tagline       TEXT    DEFAULT '',
      color         TEXT    DEFAULT '#6ddc8a',
      image         TEXT    DEFAULT '',
      sheet_a_id    TEXT    DEFAULT '',
      sheet_a_name  TEXT    DEFAULT '',
      sheet_a_blurb TEXT    DEFAULT '',
      sheet_b_id    TEXT    DEFAULT '',
      sheet_b_name  TEXT    DEFAULT '',
      sheet_b_blurb TEXT    DEFAULT '',
      sort_order    INTEGER DEFAULT 0,
      active        BOOLEAN DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Add per-sheet image columns if they don't exist yet (migration)
  await db`ALTER TABLE sticker_sets ADD COLUMN IF NOT EXISTS sheet_a_image TEXT DEFAULT ''`;
  await db`ALTER TABLE sticker_sets ADD COLUMN IF NOT EXISTS sheet_b_image TEXT DEFAULT ''`;
  // Add delivery method column if it doesn't exist yet (migration)
  await db`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'mail'`;
  // Add flexible sheets + per-set pricing columns (migration)
  await db`ALTER TABLE sticker_sets ADD COLUMN IF NOT EXISTS sheets JSONB DEFAULT '[]'`;
  await db`ALTER TABLE sticker_sets ADD COLUMN IF NOT EXISTS price_sheet NUMERIC(10,2) DEFAULT 2.00`;
  await db`ALTER TABLE sticker_sets ADD COLUMN IF NOT EXISTS price_set   NUMERIC(10,2) DEFAULT 3.00`;

  await db`
    CREATE TABLE IF NOT EXISTS feedback (
      id         SERIAL PRIMARY KEY,
      mood       TEXT DEFAULT '',
      mood_label TEXT DEFAULT '',
      topics     JSONB DEFAULT '[]',
      name       TEXT DEFAULT '',
      email      TEXT DEFAULT '',
      message    TEXT NOT NULL,
      anonymous  BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed with static data if the table is empty
  const [{ count }] = await db`SELECT COUNT(*) FROM sticker_sets`;
  if (parseInt(count) === 0) {
    for (let i = 0; i < STICKER_SETS.length; i++) {
      const s = STICKER_SETS[i];
      await db`
        INSERT INTO sticker_sets
          (id, name, tagline, color, image,
           sheet_a_id, sheet_a_name, sheet_a_blurb,
           sheet_b_id, sheet_b_name, sheet_b_blurb,
           sort_order, active)
        VALUES
          (${s.id}, ${s.name}, ${s.tagline}, ${s.color}, ${s.image},
           ${s.sheetA.id}, ${s.sheetA.name}, ${s.sheetA.blurb},
           ${s.sheetB.id}, ${s.sheetB.name}, ${s.sheetB.blurb},
           ${i}, true)
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }
}

export async function getSettings() {
  const db = sql();
  const rows = await db`SELECT key, value FROM settings`;
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    notification_emails: map.notification_emails ?? '',
  };
}

export async function updateSettings(updates) {
  const db = sql();
  const allowed = ['notification_emails'];
  for (const key of allowed) {
    if (updates[key] !== undefined && updates[key] !== '') {
      await db`
        INSERT INTO settings (key, value) VALUES (${key}, ${updates[key]})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }
  }
}

export async function createOrder(order) {
  const db = sql();
  const [row] = await db`
    INSERT INTO orders
      (customer_name, customer_email, customer_address, customer_notes,
       items, subtotal, shipping, total, delivery_method)
    VALUES
      (${order.customer_name}, ${order.customer_email}, ${order.customer_address},
       ${order.customer_notes}, ${JSON.stringify(order.items)},
       ${order.subtotal}, ${order.shipping}, ${order.total},
       ${order.delivery_method ?? 'mail'})
    RETURNING id, created_at
  `;
  return row;
}

export async function listOrders() {
  const db = sql();
  return db`SELECT * FROM orders ORDER BY created_at DESC`;
}

// ── Sticker Sets ──────────────────────────────────────────────

function rowToSet(row) {
  // Use the flexible sheets array when populated, fall back to legacy sheet_a/b columns
  let sheets;
  if (Array.isArray(row.sheets) && row.sheets.length > 0) {
    sheets = row.sheets;
  } else {
    sheets = [];
    if (row.sheet_a_id) sheets.push({ id: row.sheet_a_id, name: row.sheet_a_name ?? '', blurb: row.sheet_a_blurb ?? '', image: row.sheet_a_image ?? '' });
    if (row.sheet_b_id) sheets.push({ id: row.sheet_b_id, name: row.sheet_b_name ?? '', blurb: row.sheet_b_blurb ?? '', image: row.sheet_b_image ?? '' });
  }
  const defaultSetPrice = sheets.length > 1 ? 2 + (sheets.length - 1) : 2;
  return {
    id:         row.id,
    name:       row.name,
    tagline:    row.tagline  ?? '',
    color:      row.color    ?? '#6ddc8a',
    image:      row.image    ?? '',
    sortOrder:  row.sort_order,
    active:     row.active,
    priceSheet: Number(row.price_sheet ?? 2),
    priceSet:   Number(row.price_set   ?? defaultSetPrice),
    sheets,
  };
}

export async function listStickerSets() {
  const db = sql();
  const rows = await db`
    SELECT * FROM sticker_sets WHERE active = true ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(rowToSet);
}

export async function listAllStickerSets() {
  const db = sql();
  const rows = await db`SELECT * FROM sticker_sets ORDER BY sort_order ASC, created_at ASC`;
  return rows.map(rowToSet);
}

export async function getStickerSet(id) {
  const db = sql();
  const rows = await db`SELECT * FROM sticker_sets WHERE id = ${id} AND active = true`;
  return rows.length ? rowToSet(rows[0]) : null;
}

export async function upsertStickerSet(set) {
  const db = sql();
  // Build the sheets array — accept explicit sheets or fall back to legacy sheetA/sheetB
  let sheets = set.sheets;
  if (!sheets || sheets.length === 0) {
    sheets = [];
    if (set.sheetA?.id) sheets.push({ id: set.sheetA.id, name: set.sheetA.name ?? '', blurb: set.sheetA.blurb ?? '', image: set.sheetA.image ?? '' });
    if (set.sheetB?.id) sheets.push({ id: set.sheetB.id, name: set.sheetB.name ?? '', blurb: set.sheetB.blurb ?? '', image: set.sheetB.image ?? '' });
  }
  // Mirror first two sheets into legacy columns for backward compat
  const s0 = sheets[0] ?? {};
  const s1 = sheets[1] ?? {};
  const defaultSetPrice = sheets.length > 1 ? 2 + (sheets.length - 1) : 2;
  await db`
    INSERT INTO sticker_sets
      (id, name, tagline, color, image,
       sheet_a_id, sheet_a_name, sheet_a_blurb, sheet_a_image,
       sheet_b_id, sheet_b_name, sheet_b_blurb, sheet_b_image,
       sheets, price_sheet, price_set,
       sort_order, active)
    VALUES
      (${set.id}, ${set.name}, ${set.tagline ?? ''}, ${set.color ?? '#6ddc8a'}, ${set.image ?? ''},
       ${s0.id ?? ''}, ${s0.name ?? ''}, ${s0.blurb ?? ''}, ${s0.image ?? ''},
       ${s1.id ?? ''}, ${s1.name ?? ''}, ${s1.blurb ?? ''}, ${s1.image ?? ''},
       ${JSON.stringify(sheets)}, ${set.priceSheet ?? 2}, ${set.priceSet ?? defaultSetPrice},
       ${set.sortOrder ?? 0}, ${set.active ?? true})
    ON CONFLICT (id) DO UPDATE SET
      name           = EXCLUDED.name,
      tagline        = EXCLUDED.tagline,
      color          = EXCLUDED.color,
      image          = EXCLUDED.image,
      sheet_a_id     = EXCLUDED.sheet_a_id,
      sheet_a_name   = EXCLUDED.sheet_a_name,
      sheet_a_blurb  = EXCLUDED.sheet_a_blurb,
      sheet_a_image  = EXCLUDED.sheet_a_image,
      sheet_b_id     = EXCLUDED.sheet_b_id,
      sheet_b_name   = EXCLUDED.sheet_b_name,
      sheet_b_blurb  = EXCLUDED.sheet_b_blurb,
      sheet_b_image  = EXCLUDED.sheet_b_image,
      sheets         = EXCLUDED.sheets,
      price_sheet    = EXCLUDED.price_sheet,
      price_set      = EXCLUDED.price_set,
      sort_order     = EXCLUDED.sort_order,
      active         = EXCLUDED.active
  `;
}

export async function deleteStickerSet(id) {
  const db = sql();
  await db`DELETE FROM sticker_sets WHERE id = ${id}`;
}

// ── Orders ────────────────────────────────────────────────────

export async function updateOrder(id, fields) {
  const db = sql();
  const { status, notes } = fields;
  if (status !== undefined && notes !== undefined) {
    await db`UPDATE orders SET status = ${status}, notes = ${notes} WHERE id = ${id}`;
  } else if (status !== undefined) {
    await db`UPDATE orders SET status = ${status} WHERE id = ${id}`;
  } else if (notes !== undefined) {
    await db`UPDATE orders SET notes = ${notes} WHERE id = ${id}`;
  }
}

export async function saveFeedback(data) {
  const db = sql();
  const [row] = await db`
    INSERT INTO feedback (mood, mood_label, topics, name, email, message, anonymous)
    VALUES (
      ${data.mood ?? ''},
      ${data.mood_label ?? ''},
      ${JSON.stringify(data.topics ?? [])},
      ${data.name ?? ''},
      ${data.email ?? ''},
      ${data.message},
      ${data.anonymous ?? false}
    )
    RETURNING id, created_at
  `;
  return row;
}

export async function listFeedback() {
  const db = sql();
  return db`SELECT * FROM feedback ORDER BY created_at DESC`;
}
