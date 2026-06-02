/**
 * Generates static/og.png — the Open Graph share image (1200×630).
 * Run: node scripts/gen-og.js
 * Requires BagelFatOne.ttf and Caveat-Regular.ttf in the project root.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import opentype from 'opentype.js';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const bagel  = opentype.parse(fs.readFileSync(path.join(root, 'BagelFatOne.ttf')).buffer);
const caveat = opentype.parse(fs.readFileSync(path.join(root, 'Caveat-Regular.ttf')).buffer);

// Returns an SVG <path> element with fill set
function textPath(font, text, x, y, size, fill) {
  const p = font.getPath(text, x, y, size);
  p.fill = fill;
  return p.toSVG(2);
}

// Places text so its visual bounding-box centre sits at (cx, cy)
function centred(font, text, cx, cy, size, fill) {
  const bb = font.getPath(text, 0, 0, size).getBoundingBox();
  return textPath(font, text, cx - (bb.x1 + bb.x2) / 2, cy - (bb.y1 + bb.y2) / 2, size, fill);
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const paper    = '#fff7e3';
const ink      = '#2a2238';
const blue     = '#4ec3ff';
const yellow   = '#ffd23f';
const pink     = '#ff4d8d';
const orange   = '#ff8a3d';
const inkMuted = '#756d74'; // ink at ~65% opacity on paper

const W = 1200, H = 630, BAR = 14;

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeCx = 250, badgeCy = Math.round((H - BAR) / 2) - 5, badgeR = 155;

// ── Text layout — vertically centre the two-line block on the badge ───────────
const TITLE_SZ   = 112;
const TAGLINE_SZ = 64;
const TEXT_X     = 448;

const tBB  = bagel.getPath('Sticker Stop', 0, 0, TITLE_SZ).getBoundingBox();
const gBB  = caveat.getPath("stick 'em everywhere", 0, 0, TAGLINE_SZ).getBoundingBox();

const LINE_GAP   = 66;
const blockH     = (tBB.y2 - tBB.y1) + LINE_GAP + (gBB.y2 - gBB.y1);
const titleY     = badgeCy - blockH / 2 - tBB.y1;
const taglineY   = titleY + (tBB.y2 - tBB.y1) + LINE_GAP - gBB.y1;

// Sparkles sit just right of the tagline, centred on it
const taglineRight = TEXT_X + (gBB.x2 - gBB.x1);
const sparkMidY    = taglineY + (gBB.y1 + gBB.y2) / 2;

// ── 4-pointed sparkle star ────────────────────────────────────────────────────
function sparkle(cx, cy, r, color) {
  const ri = r * 0.18;
  const d = `M0,${-r} C${ri},${-ri} ${ri},${-ri} ${ri},0 C${ri},${ri} ${ri},${ri} 0,${r} C${-ri},${ri} ${-ri},${ri} ${-ri},0 C${-ri},${-ri} ${-ri},${-ri} 0,${-r}Z`;
  return `<path d="${d}" fill="${color}" transform="translate(${cx},${cy})"/>`;
}

// ── Outline star (edge decoration) ───────────────────────────────────────────
const S = 'M0-10 2.9-1.2 11-1.2 4.6 3.1 7 11 0 6.4-7 11-4.6 3.1-11-1.2-2.9-1.2z';
function edgeStar(cx, cy, sz, color, rot = 0) {
  const sc = sz / 20;
  return `<g transform="translate(${cx},${cy}) rotate(${rot}) scale(${sc})">
    <path d="${S}" fill="none" stroke="${color}" stroke-width="${2.5 / sc}" stroke-linejoin="round"/>
  </g>`;
}

// ── Polka dots ────────────────────────────────────────────────────────────────
function dots() {
  let out = '';
  for (let x = 11; x < W; x += 22)
    for (let y = 11; y < H - BAR; y += 22)
      out += `<circle cx="${x}" cy="${y}" r="1.3" fill="${ink}" opacity="0.055"/>`;
  return out;
}

// ── SVG ───────────────────────────────────────────────────────────────────────
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">

  <rect width="${W}" height="${H}" fill="${paper}"/>
  ${dots()}

  <!-- Edge stars -->
  ${edgeStar(68,   72,  40, orange, -15)}
  ${edgeStar(1148, 92,  32, pink,    20)}
  ${edgeStar(1112, 510, 40, orange,  -8)}
  ${edgeStar(88,  530,  32, blue,    12)}
  ${edgeStar(345,  52,  24, yellow,   8)}
  ${edgeStar(610, 548,  26, pink,    -5)}

  <!-- Badge shadow -->
  <circle cx="${badgeCx + 7}" cy="${badgeCy + 12}" r="${badgeR}" fill="${ink}" opacity="0.12"/>

  <!-- Badge (rotated -8°) -->
  <g transform="rotate(-8 ${badgeCx} ${badgeCy})">
    <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="${blue}" stroke="${ink}" stroke-width="7.5"/>
    ${centred(bagel, 'S!', badgeCx, badgeCy, 142, ink)}
  </g>

  <!-- Wordmark -->
  ${textPath(bagel,  'Sticker Stop',          TEXT_X, titleY,   TITLE_SZ,   ink)}

  <!-- Tagline -->
  ${textPath(caveat, "stick 'em everywhere",  TEXT_X, taglineY, TAGLINE_SZ, inkMuted)}

  <!-- Sparkles -->
  ${sparkle(taglineRight + 28, sparkMidY - 12, 26, yellow)}
  ${sparkle(taglineRight + 76, sparkMidY +  8, 17, yellow)}

  <!-- Bottom colour bar -->
  <rect y="${H - BAR}" width="${W / 3}"   height="${BAR}" fill="${blue}"/>
  <rect x="${W / 3}"   y="${H - BAR}" width="${W / 3}" height="${BAR}" fill="${yellow}"/>
  <rect x="${2*W/3}"   y="${H - BAR}" width="${W / 3}" height="${BAR}" fill="${pink}"/>
</svg>`;

const out = path.join(root, 'static', 'og.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('✓ Generated', out);
