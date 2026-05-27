<script>
  import { cart } from '$lib/stores/cart';
  import { PRICE_SHEET, PRICE_PAIR } from '$lib/data';

  let { data } = $props();
  let set = $derived(data.set);

  let choice = $state('pair'); // 'a' | 'b' | 'pair'
  let qty = $state(1);
  let added = $state(false);

  let price = $derived(choice === 'pair' ? PRICE_PAIR : PRICE_SHEET);
  let lineTotal = $derived(price * qty);

  let choiceLabel = $derived(
    choice === 'pair'
      ? 'Pair · 2 sheets'
      : choice === 'a'
        ? set.sheetA.name
        : set.sheetB.name
  );

  function addToCart() {
    if (choice === 'pair') {
      cart.add({
        kind: 'pair',
        setId: set.id,
        sheetId: `${set.id}-pair`,
        name: `${set.name} — Both sheets`,
        image: set.image,
        side: 'full',
        price: PRICE_PAIR,
      }, qty);
    } else {
      const sheet = choice === 'a' ? set.sheetA : set.sheetB;
      cart.add({
        kind: 'sheet',
        setId: set.id,
        sheetId: sheet.id,
        name: `${set.name} — ${sheet.name}`,
        image: set.image,
        side: choice === 'a' ? 'left' : 'right',
        price: PRICE_SHEET,
      }, qty);
    }
    added = true;
    setTimeout(() => { added = false; }, 1500);
  }
</script>

<svelte:head>
  <title>{set.name} — Sticker Stop</title>
</svelte:head>

<div class="page max-w">
  <a href="/" class="back-link">← Back to all stickers</a>

  <!-- Title row -->
  <div class="title-row">
    <div class="title-left">
      <div class="set-pill" style="background:{set.color}">STICKER SET</div>
      <h1 class="set-name">{set.name}</h1>
      <p class="set-tagline">{set.tagline}</p>
    </div>
    <div class="title-prices">
      <div class="price-tag white" style="transform:rotate(-4deg)">
        <span class="hole"></span><span class="price-val">${PRICE_SHEET}</span>
      </div>
      <div class="price-tag yellow" style="transform:rotate(6deg)">
        <span class="hole"></span><span class="price-val">${PRICE_PAIR}</span>
      </div>
    </div>
  </div>

  <!-- Choices -->
  <div class="choices-wrap">
    <h2 class="choose-heading">What do you want?</h2>

    <div class="options-grid">
      <!-- Sheet A & B -->
      {#each [
        { key: 'a', sheet: set.sheetA, side: 'left' },
        { key: 'b', sheet: set.sheetB, side: 'right' },
      ] as sc}
        <button
          class="sheet-choice sticker"
          class:selected={choice === sc.key}
          style="--accent:{set.color}"
          onclick={() => choice = sc.key}
        >
          {#if choice === sc.key}
            <div class="check-badge" style="background:{set.color}">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </div>
          {/if}
          <div class="sc-img-wrap">
            {#if sc.sheet.image}
              <img src={sc.sheet.image} alt={sc.sheet.name} class="sc-img-direct" />
            {:else}
              <img
                src={set.image}
                alt={sc.sheet.name}
                class="sc-img"
                style="left:{sc.side === 'left' ? '0' : '-100%'}"
              />
            {/if}
          </div>
          <div class="sc-body">
            <div class="sc-name">{sc.sheet.name}</div>
            <div class="sc-price">${PRICE_SHEET} · one sheet</div>
            <p class="sc-blurb">{sc.sheet.blurb}</p>
          </div>
        </button>
      {/each}

      <!-- Pair choice -->
      <button
        class="pair-choice sticker"
      class:selected={choice === 'pair'}
      style="--accent:{set.color}"
      onclick={() => choice = 'pair'}
    >
      {#if choice === 'pair'}
        <div class="check-badge" style="background:{set.color}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12l5 5L20 7"/>
          </svg>
        </div>
      {/if}
      <div class="ribbon">BEST DEAL!</div>
      <div class="pair-img-wrap">
        {#if set.sheetA.image && set.sheetB.image}
          <img src={set.sheetA.image} alt="{set.sheetA.name}" class="pair-half" />
          <img src={set.sheetB.image} alt="{set.sheetB.name}" class="pair-half" />
        {:else}
          <img src={set.image} alt="{set.name} pair" class="pair-img" />
        {/if}
      </div>
      <div class="pair-body">
        <div class="pair-title">Get the pair · both sheets</div>
        <div class="pair-pricing">
          <span class="strikethrough">${PRICE_SHEET * 2}</span>
          ${PRICE_PAIR} · saves you $1
        </div>
        <p class="pair-blurb">Why pick? Stick 'em all. Both sheets for less than buying separately.</p>
      </div>
    </button>
    </div><!-- end options-grid -->

    <!-- Add to cart row -->
    <div class="atc-panel">
      <div class="atc-left">
        <div class="stepper">
          <button class="step-btn" disabled={qty <= 1} onclick={() => qty = Math.max(1, qty - 1)}>−</button>
          <span class="step-val">{qty}</span>
          <button class="step-btn" disabled={qty >= 99} onclick={() => qty = Math.min(99, qty + 1)}>+</button>
        </div>
        <div class="atc-info">
          <div class="atc-label">{choiceLabel}</div>
          <div class="atc-total">${lineTotal}</div>
        </div>
      </div>
      <button class="atc-btn" class:added onclick={addToCart}>
        {added ? 'Added! ✓' : 'Add to cart'}
      </button>
    </div>

    <p class="psst">Psst — the pair saves you a buck!</p>
  </div>
</div>

<style>
  .page { padding: 8px 0 80px; position: relative; z-index: 2; }

  @media (max-width: 600px) {
    .page { padding-inline: 20px; }
  }

  .back-link {
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    opacity: 0.7;
    display: inline-block;
    padding: 4px 0 18px;
    transition: opacity 0.15s;
  }
  .back-link:hover { opacity: 1; }

  /* ── Title row ── */
  .title-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 28px;
  }

  .title-left { display: flex; flex-direction: column; gap: 4px; }

  .set-pill {
    display: inline-block;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 999px;
    border: 2px solid var(--ink);
    color: var(--ink);
    width: fit-content;
    transform: rotate(-2deg);
  }

  .set-name {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: clamp(40px, 5vw, 64px);
    letter-spacing: -1px;
    line-height: 0.95;
    margin: 8px 0 6px;
  }

  .set-tagline {
    font-family: 'Caveat', cursive;
    font-size: 24px;
    opacity: 0.85;
  }

  .title-prices {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-bottom: 8px;
    flex-shrink: 0;
  }

  .price-tag {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: 3px solid var(--ink);
    border-radius: 8px 28px 28px 8px;
    box-shadow: 0 4px 0 rgba(42,34,56,0.85);
    font-family: 'Bagel Fat One', sans-serif;
    line-height: 1;
  }
  .price-tag.white  { background: white; }
  .price-tag.yellow { background: var(--yellow); }

  .hole {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--paper);
    border: 2px solid var(--ink);
    margin: 6px 4px 6px 8px;
    flex-shrink: 0;
  }

  .price-val { font-size: 30px; padding: 8px 18px 8px 6px; }

  /* ── Choices container ── */
  .choices-wrap {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .choose-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 28px;
  }

  /* ── Options grid ── */
  /* Two-row subgrid: row 1 = images (height driven by pair), row 2 = text */
  .options-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    grid-template-rows: auto auto;
    column-gap: 14px;
    row-gap: 0;
  }

  /* Small: all three cards stacked in a single column */
  @media (max-width: 720px) {
    .options-grid {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
      row-gap: 14px;
    }
    .sheet-choice {
      grid-row: auto !important;
      display: flex !important;
      flex-direction: column;
    }
    .pair-choice {
      grid-row: auto !important;
      grid-column: auto;
      display: flex !important;
      flex-direction: column;
    }
    .sc-img-wrap  { aspect-ratio: 1197 / 1768; }
    .pair-img-wrap { aspect-ratio: 1197 / 884; }
  }

  .sheet-choice {
    position: relative;
    background: white;
    padding: 14px;
    border-radius: 18px;
    cursor: pointer;
    text-align: left;
    outline: 4px solid transparent;
    outline-offset: -2px;
    transform: translateY(0);
    transition: outline 0.15s, transform 0.2s;
    width: 100%;
    overflow: visible;
    /* Subgrid: span both rows, children align to parent grid rows */
    grid-row: span 2;
    display: grid;
    grid-template-rows: subgrid;
    gap: 0;
  }

  .sheet-choice.selected {
    outline-color: var(--accent);
    transform: translateY(-4px);
  }

  .check-badge {
    position: absolute;
    top: -14px;
    right: -14px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid var(--ink);
    display: grid;
    place-items: center;
    box-shadow: 0 4px 0 rgba(42,34,56,0.85);
    transform: rotate(8deg);
    animation: pop 0.3s;
    color: white;
    z-index: 2;
  }

  .sc-img-wrap {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: var(--paper-2);
    /* Height is set by the subgrid image row — no aspect-ratio needed */
  }

  /* Half-crop fallback (when only a combined image exists) */
  .sc-img {
    position: absolute;
    top: 0;
    height: 100%;
    width: 200%;
    max-width: none;
    object-fit: cover;
    display: block;
  }

  /* Direct image (when each sheet has its own image) */
  .sc-img-direct {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .sc-body { padding: 12px 4px 4px; }

  .sc-name {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 20px;
    line-height: 1.05;
    margin-bottom: 6px;
  }

  .sc-price {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 14px;
    opacity: 0.85;
    margin-bottom: 8px;
  }

  .sc-blurb { font-size: 13.5px; line-height: 1.4; opacity: 0.75; margin: 0; }

  /* ── Pair choice ── */
  .pair-choice {
    position: relative;
    background: white;
    padding: 14px;
    border-radius: 18px;
    cursor: pointer;
    text-align: left;
    outline: 4px solid transparent;
    outline-offset: -2px;
    transform: translateY(0);
    transition: outline 0.15s, transform 0.2s;
    width: 100%;
    overflow: visible;
    /* Subgrid: span both rows, children align to parent grid rows */
    grid-row: span 2;
    display: grid;
    grid-template-rows: subgrid;
    gap: 0;
  }

  .pair-choice.selected {
    outline-color: var(--accent);
    transform: translateY(-4px);
  }

  .ribbon {
    position: absolute;
    top: 16px;
    left: -14px;
    background: var(--pink);
    color: white;
    border: 3px solid var(--ink);
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 13px;
    padding: 5px 12px;
    transform: rotate(-8deg);
    border-radius: 6px;
    box-shadow: 0 3px 0 rgba(42,34,56,0.85);
    z-index: 2;
    white-space: nowrap;
  }

  .pair-img-wrap {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: var(--paper-2);
    aspect-ratio: 1197 / 884; /* Drives the image row height for the whole grid */
  }

  /* Fallback: single combined image */
  .pair-img { width: 100%; height: 100%; object-fit: cover; }

  /* Side-by-side when individual sheet images exist */
  .pair-img-wrap { display: flex; }
  .pair-half {
    flex: 1;
    min-width: 0;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pair-body { padding: 12px 4px 4px; }

  .pair-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    line-height: 1.05;
    margin-bottom: 6px;
  }

  .pair-pricing {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 14px;
    opacity: 0.85;
    margin-bottom: 8px;
  }

  .strikethrough { text-decoration: line-through; opacity: 0.5; margin-right: 8px; }

  .pair-blurb { font-size: 13.5px; line-height: 1.4; opacity: 0.75; margin: 0; }

  /* ── Add to cart panel ── */
  .atc-panel {
    margin-top: 8px;
    padding: 18px;
    background: white;
    border: 3px solid var(--ink);
    border-radius: 18px;
    box-shadow: 0 6px 0 rgba(42,34,56,0.85);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }

  .atc-left { display: flex; align-items: center; gap: 14px; }

  .stepper {
    display: inline-flex;
    align-items: center;
    border: 3px solid var(--ink);
    border-radius: 999px;
    background: white;
    overflow: hidden;
    box-shadow: 0 3px 0 rgba(42,34,56,0.85);
  }

  .step-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 22px;
    width: 38px;
    height: 38px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--ink);
  }
  .step-btn:disabled { opacity: 0.35; cursor: default; }

  .step-val {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 18px;
    min-width: 32px;
    text-align: center;
  }

  .atc-info { display: flex; flex-direction: column; gap: 2px; }

  .atc-label {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 13px;
    opacity: 0.7;
  }

  .atc-total {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 30px;
    line-height: 1;
  }

  .atc-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 19px;
    padding: 14px 28px;
    border-radius: 999px;
    border: 3px solid var(--ink);
    background: var(--pink);
    color: white;
    cursor: pointer;
    box-shadow: 0 6px 0 rgba(42,34,56,0.85);
    transition: transform 0.08s, box-shadow 0.08s, background 0.2s;
    letter-spacing: 0.2px;
    white-space: nowrap;
  }
  .atc-btn:hover { transform: translateY(-2px); }
  .atc-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(42,34,56,0.85); }
  .atc-btn.added { background: var(--mint); }

  .psst {
    font-family: 'Caveat', cursive;
    font-size: 22px;
    opacity: 0.7;
    text-align: center;
    margin: 2px 0 0;
  }

  .sticker {
    border-radius: 18px;
    border: 3px solid var(--ink);
    box-shadow: 0 1px 0 rgba(0,0,0,.05), 0 6px 0 rgba(0,0,0,.04), 0 18px 28px -10px rgba(42,34,56,0.18);
  }
</style>
