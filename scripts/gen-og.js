/**
 * Generates static/og.png — the Open Graph share image.
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

const bagelFont  = opentype.parse(fs.readFileSync(path.join(root, 'BagelFatOne.ttf')).buffer);
const caveatFont = opentype.parse(fs.readFileSync(path.join(root, 'Caveat-Regular.ttf')).buffer);

function pathSvg(font, text, x, y, size, fill) {
  const p = font.getPath(text, x, y, size);
  p.fill = fill;
  return p.toSVG(2);
}

// Place text so its visual bounding-box centre sits at (cx, cy)
function centredPath(font, text, cx, cy, size, fill) {
  const bb = font.getPath(text, 0, 0, size).getBoundingBox();
  return pathSvg(font, text, cx - (bb.x1 + bb.x2) / 2, cy - (bb.y1 + bb.y2) / 2, size, fill);
}

// ── Colours ──────────────────────────────────────────────────────────────────
const paper     = '#fff7e3';
const ink       = '#2a2238';
const blue      = '#4ec3ff';
const yellow    = '#ffd23f';
// ink at ~65% opacity on paper background
const inkMuted  = '#756d74';

const W = 1200, H = 630;

// ── Layout ────────────────────────────────────────────────────────────────────
const badgeCx = 248, badgeCy = H / 2, badgeR = 155;
const textX   = 448;

const TITLE_SIZE   = 112;
const TAGLINE_SIZE = 62;

const titleBB   = bagelFont.getPath('Sticker Stop', 0, 0, TITLE_SIZE).getBoundingBox();
const taglineBB = caveatFont.getPath("stick 'em everywhere", 0, 0, TAGLINE_SIZE).getBoundingBox();

// Vertically centre the two-line text block against the badge centre
const lineGap   = 68;
const blockH    = (titleBB.y2 - titleBB.y1) + lineGap + (taglineBB.y2 - taglineBB.y1);
const titleY    = badgeCy - blockH / 2 - titleBB.y1;
const taglineY  = titleY + (titleBB.y2 - titleBB.y1) + lineGap - taglineBB.y1;

// X position of tagline right edge (for placing sparkles)
const taglineW  = taglineBB.x2 - taglineBB.x1;
const sparkleX  = textX + taglineW + 24;
const sparkleY  = taglineY + (taglineBB.y1 + taglineBB.y2) / 2; // vertically centred on tagline

// ── 4-pointed sparkle star ────────────────────────────────────────────────────
// r = outer radius, ri = inner waist (small = spiky)
function sparkle(cx, cy, r, color) {
  const ri = r * 0.18;
  const d = `M0,${-r} C${ri},${-ri} ${ri},${-ri} ${ri},0 C${ri},${ri} ${ri},${ri} 0,${r} C${-ri},${ri} ${-ri},${ri} ${-ri},0 C${-ri},${-ri} ${-ri},${-ri} 0,${-r}Z`;
  return `<path d="${d}" fill="${color}" transform="translate(${cx},${cy})"/>`;
}

// ── Polka dots (very subtle) ──────────────────────────────────────────────────
function dots() {
  let d = '';
  for (let x = 11; x < W; x += 22)
    for (let y = 11; y < H; y += 22)
      d += `<circle cx="${x}" cy="${y}" r="1.3" fill="${ink}" opacity="0.055"/>`;
  return d;
}

// ── SVG ───────────────────────────────────────────────────────────────────────
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">

  <rect width="${W}" height="${H}" fill="${paper}"/>
  ${dots()}

  <!-- Badge drop shadow -->
  <circle cx="${badgeCx + 7}" cy="${badgeCy + 12}" r="${badgeR}" fill="${ink}" opacity="0.12"/>

  <!-- Badge -->
  <g transform="rotate(-8 ${badgeCx} ${badgeCy})">
    <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="${blue}" stroke="${ink}" stroke-width="7.5"/>
    ${centredPath(bagelFont, 'S!', badgeCx, badgeCy, 142, ink)}
  </g>

  <!-- Wordmark -->
  ${pathSvg(bagelFont, 'Sticker Stop', textX, titleY, TITLE_SIZE, ink)}

  <!-- Tagline -->
  ${pathSvg(caveatFont, "stick 'em everywhere", textX, taglineY, TAGLINE_SIZE, inkMuted)}

  <!-- Sparkle stars -->
  ${sparkle(sparkleX + 10,  sparkleY - 10, 26, yellow)}
  ${sparkle(sparkleX + 54,  sparkleY + 8,  17, yellow)}
</svg>`;

const out = path.join(root, 'static', 'og.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('✓ Generated', out);
