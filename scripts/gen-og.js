/**
 * Generates static/og.png — the Open Graph share image (1200×630).
 * Run: node scripts/gen-og.js
 * Requires BagelFatOne.ttf and Caveat-Regular.ttf in the project root.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Embed font bytes as base64 data URIs so librsvg can render them
const bagelB64  = fs.readFileSync(path.join(root, 'BagelFatOne.ttf')).toString('base64');
const caveatB64 = fs.readFileSync(path.join(root, 'Caveat-Regular.ttf')).toString('base64');

// ── Design tokens ─────────────────────────────────────────────────────────────
const paper    = '#fff7e3';
const ink      = '#2a2238';
const blue     = '#4ec3ff';
const yellow   = '#ffd23f';
const pink     = '#ff4d8d';
const inkMuted = '#756d74'; // ink at ~65% opacity on paper

const W = 1200, H = 630;
const BAR = 14; // bottom colour-bar height

// ── Layout (matches site navbar proportions, scaled to OG size) ───────────────
const badgeCx = 250, badgeCy = (H - BAR) / 2 - 10, badgeR = 155;

// ── Polka dots ────────────────────────────────────────────────────────────────
function dots() {
  let d = '';
  for (let x = 11; x < W; x += 22)
    for (let y = 11; y < H - BAR; y += 22)
      d += `<circle cx="${x}" cy="${y}" r="1.3" fill="${ink}" opacity="0.055"/>`;
  return d;
}

// ── 4-pointed sparkle star ────────────────────────────────────────────────────
function sparkle(cx, cy, r, color, rot = 0) {
  const ri = r * 0.18;
  const d = `M0,${-r} C${ri},${-ri} ${ri},${-ri} ${ri},0 C${ri},${ri} ${ri},${ri} 0,${r} C${-ri},${ri} ${-ri},${ri} ${-ri},0 C${-ri},${-ri} ${-ri},${-ri} 0,${-r}Z`;
  return `<path d="${d}" fill="${color}" transform="translate(${cx},${cy}) rotate(${rot})"/>`;
}

// ── Outline star (edge decoration) ───────────────────────────────────────────
const STAR_PTS = 'M0-10 2.9-1.2 11-1.2 4.6 3.1 7 11 0 6.4-7 11-4.6 3.1-11-1.2-2.9-1.2z';
function outlineStar(cx, cy, sz, color, rot = 0) {
  const s = sz / 20;
  return `<g transform="translate(${cx},${cy}) rotate(${rot}) scale(${s})">
    <path d="${STAR_PTS}" fill="none" stroke="${color}" stroke-width="${2.5 / s}" stroke-linejoin="round"/>
  </g>`;
}

// ── SVG ───────────────────────────────────────────────────────────────────────
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>
      @font-face {
        font-family: 'Bagel Fat One';
        src: url('data:font/truetype;base64,${bagelB64}') format('truetype');
      }
      @font-face {
        font-family: 'Caveat';
        src: url('data:font/truetype;base64,${caveatB64}') format('truetype');
      }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${paper}"/>
  ${dots()}

  <!-- Edge decoration stars -->
  ${outlineStar(68,  72,  40, '#ff8a3d', -15)}
  ${outlineStar(1148, 92,  32, pink,       20)}
  ${outlineStar(1112, 510, 40, '#ff8a3d',  -8)}
  ${outlineStar(88,  530, 32, blue,        12)}
  ${outlineStar(345,  52, 24, yellow,       8)}
  ${outlineStar(610, 548, 26, pink,        -5)}

  <!-- Badge drop shadow -->
  <circle cx="${badgeCx + 7}" cy="${badgeCy + 12}" r="${badgeR}" fill="${ink}" opacity="0.12"/>

  <!-- Badge (rotated -8°) -->
  <g transform="rotate(-8 ${badgeCx} ${badgeCy})">
    <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="${blue}" stroke="${ink}" stroke-width="7.5"/>
    <text
      x="${badgeCx}" y="${badgeCy}"
      text-anchor="middle" dominant-baseline="central"
      font-family="'Bagel Fat One', sans-serif"
      font-size="130"
      fill="${ink}">S!</text>
  </g>

  <!-- Wordmark -->
  <text
    x="444" y="${badgeCy - 32}"
    dominant-baseline="auto"
    font-family="'Bagel Fat One', sans-serif"
    font-size="112"
    fill="${ink}">Sticker Stop</text>

  <!-- Tagline -->
  <text
    x="448" y="${badgeCy + 68}"
    dominant-baseline="auto"
    font-family="'Caveat', cursive"
    font-size="64"
    fill="${inkMuted}">stick 'em everywhere</text>

  <!-- Sparkle stars next to tagline -->
  ${sparkle(1010, badgeCy + 50, 26, yellow)}
  ${sparkle(1060, badgeCy + 72, 17, yellow)}

  <!-- Bottom colour bar -->
  <rect y="${H - BAR}" width="${W / 3}"   height="${BAR}" fill="${blue}"/>
  <rect x="${W / 3}"   y="${H - BAR}" width="${W / 3}" height="${BAR}" fill="${yellow}"/>
  <rect x="${2*W/3}"   y="${H - BAR}" width="${W / 3}" height="${BAR}" fill="${pink}"/>
</svg>`;

const out = path.join(root, 'static', 'og.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('✓ Generated', out);
