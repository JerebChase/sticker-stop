# Handoff: Sticker Stop — E-commerce Site

## Overview
Sticker Stop is a small, child-friendly e-commerce site for selling sticker sheets. Customers browse 5 themed sticker sets (each with 2 sheets), open a product detail page to pick what they want, add items to a cart, and place an order (no online payment — the order is just saved/sent to the shop owner).

Three primary screens:
1. **Listing page** — all 5 sticker sets in a grid
2. **Product detail page** — pick Sheet A, Sheet B, or both, choose quantity, add to cart
3. **Cart page** — review items, fill out an order form, place order (success state with confetti)

## About the Design Files
The files in this bundle are **design references created in HTML/React** — interactive prototypes showing intended look and behavior, **not production code to copy directly**.

Your task is to **recreate these designs in the target codebase's existing environment** (React/Next.js, Vue, SvelteKit, Shopify theme, Rails+Hotwire, native iOS/Android, etc.) using its established patterns, component libraries, routing, and state management. If the project doesn't have an established frontend stack yet, choose the most appropriate framework for an e-commerce site (Next.js + Tailwind is a sensible default) and implement the designs there.

A real backend will be needed for order persistence and notifications (see "State Management" and "Order submission" below). The prototype only uses `localStorage`.

## Fidelity
**High-fidelity (hifi).** The mocks are final-design — final colors, typography, spacing, interactions, and copy. Recreate pixel-perfectly using your codebase's component primitives and patterns. The chunky offset-shadow buttons, tilted "sticker" cards with washi tape, hand-drawn doodle background, and pop-in animations are part of the brand identity and should be preserved.

---

## Brand & Voice
- **Name:** Sticker Stop
- **Tagline:** "stick 'em everywhere ✨"
- **Voice:** quirky, playful, child-friendly, casual. Short sentences, exclamation marks, lowercase asides ("psst — the pair saves you a buck!"). Avoid corporate language.
- **Logo:** circular blue badge with "S!" in Bagel Fat One, tilted ~-8°, with the wordmark "Sticker Stop" beside it and the tagline in Caveat below.

## Design Tokens

### Colors
| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#fff7e3` | Page background |
| `--paper-2` | `#fff1cf` | Card image backdrop, secondary surfaces |
| `--ink` | `#2a2238` | Text, borders, hard shadows |
| `--pink` | `#ff4d8d` | Primary CTA, accents |
| `--yellow` | `#ffd23f` | Price tag, "cart" button, accents |
| `--blue` | `#4ec3ff` | Logo, secondary CTA, accents |
| `--mint` | `#6ddc8a` | Success state, accents |
| `--orange` | `#ff8a3d` | Doodle accent |
| `--purple` | `#8b5cf6` | Doodle accent, "Blast Off" set color |
| `--line` | `#f0c97a` | Optional rule lines |

The page background is a subtle dotted grid: `radial-gradient(circle at 1px 1px, rgba(42,34,56,0.08) 1px, transparent 1px)` on a 22×22px tile, on top of `--paper`.

### Typography
Load from Google Fonts:
- **Bagel Fat One** — headings, logo, prices. Display weight only.
- **Fredoka** (400/500/600/700) — UI labels, buttons, form labels.
- **Nunito** (400/600/700/800) — body copy.
- **Caveat** (400/700) — playful hand-written taglines and asides.

| Role | Font | Size | Weight |
|---|---|---|---|
| Page hero | Bagel Fat One | `clamp(48px, 7vw, 96px)` | – |
| Page H1 (detail/cart) | Bagel Fat One | `clamp(40px, 5vw, 64px)` | – |
| Section H2 | Bagel Fat One | 24–28px | – |
| Card title | Bagel Fat One | 19–26px | – |
| Body | Nunito | 14–15px | 400/600 |
| Tagline / aside | Caveat | 20–26px | 400 |
| Button | Fredoka | 17–20px | 700 |
| Pill / chip | Fredoka | 11–13px | 600/700 |

Letter-spacing on Bagel Fat One headings is `-0.5` to `-1.5px` for large sizes.

### Spacing & Radius
- Card radius: **18px** (sticker cards), **22px** (large panels/checkout box)
- Button radius: **999px** (fully rounded pills)
- Image area radius: **12–14px**
- Page max width: **1180px**, with **32px** horizontal padding
- Grid gaps: **26–32px** between cards

### Shadows
Brand uses **chunky offset shadows in ink**, not blurry shadows:
- Buttons (resting): `0 6px 0 rgba(42,34,56,0.85)`
- Buttons (pressed): `0 2px 0 rgba(42,34,56,0.85)` with `translateY(4px)`
- Cards (sticker peel): `0 1px 0 rgba(0,0,0,0.05), 0 6px 0 rgba(0,0,0,0.04), 0 18px 28px -10px rgba(42,34,56,0.18)`
- Panels: `0 8px 0 rgba(42,34,56,0.85)`
- Small pills: `0 3–4px 0 rgba(42,34,56,0.85)`

Borders on interactive elements are **2.5–3px solid `--ink`** for a sticker outline look.

### Animations
- `bob` — doodles drift up/down 6px on a 6s loop, staggered
- `pop` — selection checkmark and success card scale-in (0.7→1.08→1, 0.3–0.4s)
- `wiggle` — optional 2° rotation oscillation
- `confetti-fall` — 50 colored shapes fall from top with rotation, on order success
- Card hover: `transform: rotate(0deg) translateY(-8px)` (un-rotates the tilt, lifts up). Transition `0.25s cubic-bezier(.34,1.56,.64,1)`.
- Selection: 4px colored outline + 4px upward translate, 0.2s

---

## Catalog Data
5 sticker sets, each with **Sheet A** (left half of source image) and **Sheet B** (right half). Pricing is global:
- **$2** per single sheet
- **$3** for the pair (both sheets of one set) — saves $1

| Set ID | Name | Tagline | Color | Sheet A | Sheet B |
|---|---|---|---|---|---|
| `critters` | Cuddly Critters | "Tiny clay friends from forest & shore." | `#6ddc8a` | Forest Friends | Beach Buddies |
| `treats` | Snack Pack | "Hungry critters, cookies & cupcakes galore." | `#ffb84e` | Cookie Crew | Tea Party |
| `castle` | Castle Quest | "Heroes vs. villains — pick your side." | `#4ec3ff` | Royal Heroes | Wicked Crew |
| `farm` | Sheep vs. Aliens | "The most absurd farm war you'll ever stick." | `#ff4d8d` | Pasture Patrol | Alien Invasion |
| `space` | Blast Off | "From Apollo to today — explore the stars." | `#8b5cf6` | Apollo Era | Modern Missions |

Each sheet has a `blurb` (short paragraph) and `highlights` (4–6 short chips like "Snow leopard cub", "Red panda"). See `data.jsx` for the exact strings.

---

## Screens

### 1. Listing Page (`/` or `/stickers`)

**Purpose:** Browse all 5 sticker sets, click into one to see details.

**Layout (top to bottom):**
1. **Header** (shared on all pages, see "Shared Components") — logo left, nav right ("All Stickers" + "Cart" with badge).
2. **Hero** — centered. A small dark pill ("FRESH BATCH · HAND-PICKED SHEETS", tilted -1.5°). Below it, a giant 3-word headline where each word is independently rotated and the punctuation is a different accent color:
   - "Stickers" (rotated -2°)
   - "that" (rotated 2°, pink)
   - "stick" (rotated -1°)
   - "!" (rotated 3°, blue, translated y+6px)
   - Below: Caveat tagline "$2 a sheet · $3 for the pair · stick them on EVERYTHING"
3. **Card grid** — `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`, gaps `32px 26px`. Each card is a "sticker":
   - Subtle resting rotation (alternating ±1–2.5°). On hover, rotation goes to 0 and the card lifts -8px.
   - White background, 18px radius, sticker-peel shadow.
   - **Washi tape strip** at top center: 90×22px, diagonal stripes in the set's accent color, slightly tilted.
   - **Image** (16:12 aspect, the full pair image as cover), inside a `--paper-2` panel with 14px radius.
   - **Two price tags** stacked in the top-right corner of the image (overlapping out): `$3 pair` (yellow, rot +8°) above `$2 sheet` (white, rot -4°). Price tag style: rounded-left, scalloped-right with a hole punch on the left for the "string".
   - Below image: set name (Bagel Fat One 26px) + a "2 sheets" chip in the set's color + tagline (Nunito 15px) + a footer row with "Pair deal · save $1" on the left and a dark "See sheets →" pill on the right.
4. **How-it-works strip** — single white panel with chunky shadow, 4 equal columns. Each: numbered colored circle (pink/yellow/blue/mint) + label + sub-label.
   1. Pick your sheets — Browse 5 sets
   2. Add to cart — Single or pair
   3. Place your order — No payment online
   4. Stickers ship out — Stick everywhere 🎉
5. **Footer** — centered Caveat text "Made with stickers, by stickers, for stickers." + tiny copyright.

**Click target:** anywhere on a card → navigate to detail page for that set.

### 2. Product Detail Page (`/stickers/:setId`)

**Purpose:** See close-up of both sheets in a set; pick what to buy (Sheet A, Sheet B, or the pair); set quantity; add to cart.

**Layout:**
1. Header (shared).
2. **"← Back to all stickers"** ghost link.
3. **Title row** (flex, wrap):
   - Left: an uppercase pill in the set's accent color ("STICKER SET"), the set name in giant Bagel Fat One, and the Caveat tagline.
   - Right: two price tags — `$2` (white, rot -4°) and `$3` (yellow, rot +6°, size `lg`).
4. **Main grid** — `grid-template-columns: 1.1fr 1fr`, gap 36px:
   - **Left panel:** large "sticker" card tilted -0.8°. Inside: the full pair image, with a "2 sheets" chip overlaid top-left. Below the image: two thumbnails (Sheet A and Sheet B) cropped from the source via `object-position` / negative-left trick, each with the sheet name and 4 highlight chips (`--paper-2` pill backgrounds, dashed border).
   - **Right panel:** "What do you want?" H2, then choices:
     - Two **SheetChoice** cards side-by-side (Sheet A, Sheet B). Each shows just that half of the image, sheet name, "$2 · one sheet", blurb. Selected state: 4px solid outline in set color, 4px lift, animated checkmark badge top-right (colored circle with ink border, "pop" animation).
     - One **PairChoice** card below (full-width). Shows full image, "BEST DEAL!" diagonal ribbon top-left in pink, "Get the pair · both sheets", strikethrough $4 / $3, "saves you $1" copy, blurb.
   - **Add-to-cart row** at the bottom of the right panel: white panel with chunky shadow, holds a quantity stepper, a small label/price summary (which choice + total), and a chunky pink "Add to cart" button. Button briefly turns mint and reads "Added! ✓" for 1.5s after a click.
   - Below: a small Caveat reminder "Psst — the pair saves you a buck!"

**Default selection:** `pair`.

### 3. Cart Page (`/cart`)

**Purpose:** Review items, edit quantities, fill out an order form, place an order.

**Layout:**
1. Header.
2. "← Keep shopping" ghost link.
3. **Title** "Your sticker stash" + Caveat sub ("3 items ready to ship" or "It's a little empty in here…" when empty).
4. **Empty state:** centered white panel, big 🤷, "No stickers yet!" headline, Caveat sub, blue "Browse stickers" button.
5. **Full state:** `grid-template-columns: 1.4fr 1fr`, gap 32px:
   - **Items column:** stack of cart-item cards (white "sticker" cards). Each card is a 3-column grid: 80×80 thumbnail (cropped to the chosen sheet via the same image-crop technique) | name + "Pair · 2 sheets" or "Single sheet" sub + stepper + remove link | line total in Bagel Fat One.
   - **Checkout column** (sticky `top: 20`): white panel with chunky shadow. "Place your order" H2. Form fields (top to bottom):
     - Your name * (text, required)
     - Email (optional)
     - Mailing address * (textarea, required)
     - Anything else? (textarea, optional — "Gift wrap? A drawing?")
   - Below form: dashed rule, then rows for **Stickers** / **Shipping** ($1 flat when cart not empty) / **Total** (Bagel Fat One 22px). Then a big pink "Place order →" button (disabled until name + address filled). A small "No payment now! We'll get back to you to arrange it." reassurance below.

**Form validation:**
- Place Order button enabled only when `cart.length > 0 && name.trim() && address.trim()`.
- Email is optional and not validated beyond the browser's `type="email"`.

**On submit:**
1. Build an order object (see "Order submission" below).
2. Send to backend (in the prototype, it's logged to console and stored in localStorage).
3. Clear the cart.
4. Show the Success state.

### 4. Order Success State

Rendered in place of CartPage after a successful submission. Includes a one-shot **confetti** animation (50 colored shapes falling for ~3.5s).

**Layout:** centered 720px max card, white, chunky shadow, "pop" entry animation. Mint circle with checkmark icon at top (rotated -6°). "Yay! Order placed!" headline. Caveat sub "We've saved your order. Stickers are on their way to you soon!" An order receipt panel in `--paper-2`: order ID + total at top, list of items (qty × name = $total), shipping line with name + address. Pink "Back to stickers" button.

**Order ID format:** `SS-{last 6 digits of Date.now()}` (replace with server-issued ID in production).

---

## Interactions & Behavior

- **Routing:** prototype uses a `page` state object (`{name: 'list' | 'detail' | 'cart', id?}`). In your codebase, use real routes.
- **Scroll-to-top** on page change (`window.scrollTo({top: 0, behavior: 'instant'})`).
- **Card hover:** un-rotate + translate-Y-8px, transitions 0.25s `cubic-bezier(.34,1.56,.64,1)`.
- **Button press:** translate-Y +4px, shadow shrinks from 6px to 2px offset. On `mouseup`/`mouseleave` reverts.
- **Add-to-cart success flash:** button color flips to `--mint`, label to "Added! ✓", reverts after 1500ms.
- **Selection checkmark:** circular badge in set's accent color, animated with "pop" keyframe (0.3s).
- **Stepper:** minus button disabled at min (defaults 1), plus disabled at max (99).
- **Doodle layer:** absolutely-positioned SVG stars, squiggles, and dotted circles in fixed positions, each animated with `bob` (6s loop, staggered by index × 0.4s). Pointer-events: none.

## State Management
Prototype uses React `useState`. In production, map these to your store / server state.

- `cart: Array<CartItem>` — persisted to localStorage, synced after every change
- `orders: Array<Order>` — persisted to localStorage
- `page: {name, id?}` — replace with real routes

```ts
type CartItem = {
  kind: 'sheet' | 'pair';
  setId: string;        // e.g. 'critters'
  sheetId: string;      // e.g. 'critters-a', 'critters-b', 'critters-pair' — used as cart line key
  name: string;         // display name e.g. "Cuddly Critters — Forest Friends"
  image: string;        // path to the full pair image
  side: 'left' | 'right' | 'full';  // which half to render
  price: number;        // 2 or 3
  qty: number;
};

type Order = {
  id: string;
  placedAt: string;     // ISO timestamp
  items: CartItem[];
  customer: { name: string; email: string; address: string; notes: string };
  subtotal: number;
  shipping: number;
  total: number;
};
```

**Cart merging rule:** when adding an item whose `sheetId` already exists in the cart, increment its `qty` instead of pushing a new line.

## Order submission
Replace `placeOrder` with a real backend POST. The shop owner needs to receive the order somehow — typical options:
- POST to `/api/orders` → email the owner via Resend/SendGrid/Postmark
- Stripe Payment Link in the confirmation email (since the site doesn't take payment at checkout)
- Save to a database (Postgres, Supabase, Firestore) for an admin order list

The prototype only logs to console and persists to `localStorage.sticker-stop-orders`. **Do not ship that to production.**

## Image-cropping technique
Each "set" has one image showing both sheets side-by-side. To render only Sheet A or B as a thumbnail/product image, the source image is rendered at `width: 200%` inside a container, with `left: 0` (Sheet A) or `left: -100%` (Sheet B). This avoids needing separate cropped assets. For higher visual fidelity in production, consider exporting individual sheet images and using `<picture>` with proper `srcset`.

## Assets
- `assets/set-critters.png` — Cuddly Critters (forest + beach)
- `assets/set-treats.png` — Snack Pack (cookies + tea)
- `assets/set-castle.png` — Castle Quest (heroes + villains)
- `assets/set-farm.png` — Sheep vs. Aliens (pasture + invasion)
- `assets/set-space.png` — Blast Off (Apollo + modern)

These are the shop owner's actual sticker sheet photos. They contain both sheets of a set on one image, on a graph-paper or sticker-book background. Treat them as content; you may want to re-photograph or color-balance them for production.

No icon library used — all icons (cart, checkmark, doodles) are inline SVG. The "🤷" and "🎉" emoji are content, not icons.

## Files in this handoff

- `README.md` — this document
- `Sticker Stop.html` — main HTML entry point (loads the JSX files)
- `data.jsx` — catalog data (5 sets, prices)
- `components.jsx` — shared UI primitives (Logo, Header, SetCard, SheetChoice, PairChoice, Stepper, BigButton, PriceTag, Confetti, DoodleLayer)
- `pages.jsx` — page components (ListPage, DetailPage, CartPage, SuccessPage)
- `app.jsx` — root component, state, "routing"
- `assets/` — the 5 sticker pair images

To run the prototype as-is: serve the folder over HTTP (e.g. `npx serve` or `python -m http.server`) and open `Sticker Stop.html`. Don't open it via `file://` — the JSX scripts need same-origin loading.
