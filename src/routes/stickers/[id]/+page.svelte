<script>
  import { cart } from '$lib/stores/cart';

  let { data } = $props();
  let set = $derived(data.set);
  let sheets = $derived(set.sheets ?? []);

  let isPyo = $derived(set.setType === 'pyo');

  // ── Standard set state ──────────────────────────────────────────
  // choice: 'set' | number (index into sheets[])
  let choice = $state(sheets.length > 1 ? 'set' : 0);

  let isSet      = $derived(!isPyo && choice === 'set');
  let price      = $derived(isSet ? set.priceSet : set.priceSheet);
  let lineTotal  = $derived(price * qty);

  let choiceLabel = $derived(
    isSet
      ? `Full set · ${sheets.length} sheet${sheets.length !== 1 ? 's' : ''}`
      : sheets[choice]?.name ?? ''
  );

  let setDiscount = $derived(
    sheets.length > 1
      ? Math.max(0, set.priceSheet * sheets.length - set.priceSet)
      : 0
  );

  let gridCols = $derived(
    sheets.length <= 1
      ? '1fr'
      : sheets.map(() => '1fr').join(' ') + ' 2fr'
  );

  // ── Pick Your Own state ─────────────────────────────────────────
  let sheetCounts   = $state(sheets.map(() => 0));
  let totalPicks    = $derived(sheetCounts.reduce((s, c) => s + c, 0));
  let pyoCycleSize  = $derived((set.pyoPickCount ?? 3) + (set.pyoFreeCount ?? 1));
  let pyoCalcFree   = $derived(
    Math.floor(totalPicks / pyoCycleSize) * (set.pyoFreeCount ?? 1) +
    Math.max(0, totalPicks % pyoCycleSize - (set.pyoPickCount ?? 3))
  );
  let pyoCalcPaid   = $derived(totalPicks - pyoCalcFree);
  let pyoLineTotal  = $derived(pyoCalcPaid * (set.pyoPrice ?? 0) * qty);
  let pyoNextFreeIn = $derived.by(() => {
    if (totalPicks === 0) return 0;
    const pos = totalPicks % pyoCycleSize;
    return pos === 0 ? (set.pyoPickCount ?? 3) : (pyoCycleSize - pos);
  });

  function addPick(i)    { sheetCounts[i]++; }
  function removePick(i) { if (sheetCounts[i] > 0) sheetCounts[i]--; }

  let qty = $state(1);
  let added = $state(false);

  function addToCart() {
    if (isPyo) {
      if (totalPicks < 1) return;
      const selectedSheets = sheets
        .map((s, i) => ({ id: s.id, name: s.name, image: s.image, qty: sheetCounts[i] }))
        .filter(s => s.qty > 0);
      const flat = selectedSheets.flatMap(s => Array(s.qty).fill(s));
      cart.add({
        kind:           'pyo',
        setId:          set.id,
        sheetId:        `${set.id}-pyo-${sheetCounts.join('-')}`,
        name:           `${set.name} — Pick Your Own`,
        selectedSheets,
        paidCount:      pyoCalcPaid,
        freeCount:      pyoCalcFree,
        image:          flat[0]?.image || '',
        image2:         flat[1]?.image || '',
        image3:         flat[2]?.image || '',
        price:          pyoCalcPaid * (set.pyoPrice ?? 0),
        sheetCount:     totalPicks,
      }, qty);
      added = true;
      setTimeout(() => { added = false; }, 1500);
      return;
    }

    if (isSet) {
      cart.add({
        kind:       'set',
        setId:      set.id,
        sheetId:    `${set.id}-set`,
        name:       `${set.name} — Full set`,
        image:      sheets[0]?.image || '',
        image2:     sheets[1]?.image || '',
        image3:     sheets[2]?.image || '',
        side:       'full',
        price:      set.priceSet,
        sheetCount: sheets.length,
      }, qty);
    } else {
      const sheet = sheets[choice];
      const hasOwnImage = !!sheet.image;
      const side = hasOwnImage
        ? 'full'
        : (sheets.length === 2 ? (choice === 0 ? 'left' : 'right') : 'full');
      cart.add({
        kind:       'sheet',
        setId:      set.id,
        sheetId:    sheet.id,
        name:       `${set.name} — ${sheet.name}`,
        image:      sheet.image || set.image,
        side,
        price:      set.priceSheet,
        sheetCount: 1,
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
      <div class="pill-row">
        <div class="set-pill" style="background:{set.color}">STICKER SET</div>
        {#if set.status === 'retiring_soon'}
          <div class="retiring-pill">⏳ Retiring Soon</div>
        {/if}
      </div>
      <h1 class="set-name">{set.name}</h1>
      <p class="set-tagline">{set.tagline}</p>
    </div>
  </div>

  <!-- Choices -->
  <div class="choices-wrap">

    {#if isPyo}
      <!-- ── Pick Your Own UI ── -->
      <div class="pyo-header">
        <h2 class="choose-heading">Pick your sheets</h2>
        <div class="pyo-deal-tag">Buy {set.pyoPickCount}, get {set.pyoFreeCount} free · ${(set.pyoPrice ?? 0).toFixed(2)}/sheet</div>
      </div>

      {#if totalPicks > 0}
        <div class="pyo-progress">
          <span class="pyo-stat">{totalPicks} picked</span>
          {#if pyoCalcFree > 0}
            <span class="pyo-free-pill">{pyoCalcFree} free!</span>
          {/if}
          {#if pyoNextFreeIn > 0}
            <span class="pyo-until-free">{pyoNextFreeIn} more for {pyoCalcFree > 0 ? 'another' : 'a'} free pick</span>
          {/if}
        </div>
      {/if}

      <div class="pyo-grid">
        {#each sheets as sheet, i}
          <div class="pyo-card sticker" class:selected={sheetCounts[i] > 0} style="--accent:{set.color}">
            {#if sheetCounts[i] > 0}
              <div class="pyo-count-badge" style="background:{set.color}">{sheetCounts[i]}</div>
            {/if}
            <div class="sc-img-wrap">
              {#if sheet.image}
                <img src={sheet.image} alt={sheet.name} class="sc-img-direct" />
              {:else}
                <img src={set.image} alt={sheet.name} class="sc-img" style="left:0" />
              {/if}
            </div>
            <div class="sc-body">
              <div class="sc-name">{sheet.name}</div>
              <p class="sc-blurb">{sheet.blurb}</p>
            </div>
            <div class="pyo-card-controls">
              <button class="pyo-ctrl-btn" onclick={() => removePick(i)} disabled={sheetCounts[i] <= 0}>−</button>
              <span class="pyo-ctrl-count">{sheetCounts[i]}</span>
              <button class="pyo-ctrl-btn pyo-ctrl-add" style="background:{set.color}" onclick={() => addPick(i)}>+</button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Add to cart row -->
      <div class="atc-panel" class:atc-panel-dim={totalPicks < 1}>
        <div class="atc-left">
          <div class="stepper">
            <button class="step-btn" disabled={qty <= 1} onclick={() => qty = Math.max(1, qty - 1)}>−</button>
            <span class="step-val">{qty}</span>
            <button class="step-btn" disabled={qty >= 99} onclick={() => qty = Math.min(99, qty + 1)}>+</button>
          </div>
          <div class="atc-info">
            <div class="atc-label">
              {#if totalPicks > 0}
                {totalPicks} sheet{totalPicks !== 1 ? 's' : ''}{pyoCalcFree > 0 ? ` · ${pyoCalcFree} free` : ''}
              {:else}
                Pick some sheets above
              {/if}
            </div>
            <div class="atc-total">${pyoLineTotal.toFixed(2)}</div>
          </div>
        </div>
        <button class="atc-btn" class:added disabled={totalPicks < 1} onclick={addToCart}>
          {added ? 'Added! ✓' : totalPicks > 0 ? 'Add to cart' : 'Pick some sheets'}
        </button>
      </div>

    {:else}
      <!-- ── Standard set UI ── -->
      <h2 class="choose-heading">What do you want?</h2>

      <div class="options-grid" style="grid-template-columns:{gridCols}">
        <!-- Individual sheet cards -->
        {#each sheets as sheet, i}
          <button
            class="sheet-choice sticker"
            class:selected={choice === i}
            style="--accent:{set.color}"
            onclick={() => choice = i}
          >
            {#if choice === i}
              <div class="check-badge" style="background:{set.color}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l5 5L20 7"/>
                </svg>
              </div>
            {/if}
            <div class="sc-img-wrap">
              {#if sheet.image}
                <img src={sheet.image} alt={sheet.name} class="sc-img-direct" />
              {:else}
                <img
                  src={set.image}
                  alt={sheet.name}
                  class="sc-img"
                  style="left:{sheets.length === 2 ? (i === 0 ? '0' : '-100%') : '0'}"
                />
              {/if}
            </div>
            <div class="sc-body">
              <div class="sc-name">{sheet.name}</div>
              <p class="sc-blurb">{sheet.blurb}</p>
              <div class="card-price-tag">
                <span class="tag-hole"></span>
                <span class="tag-val">${set.priceSheet}</span>
                <span class="tag-label">per sheet</span>
              </div>
            </div>
          </button>
        {/each}

        <!-- Full set card (only shown when 2+ sheets) -->
        {#if sheets.length > 1}
          <button
            class="pair-choice sticker"
            class:selected={choice === 'set'}
            style="--accent:{set.color}"
            onclick={() => choice = 'set'}
          >
            {#if choice === 'set'}
              <div class="check-badge" style="background:{set.color}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l5 5L20 7"/>
                </svg>
              </div>
            {/if}
            <div class="ribbon">BEST DEAL!</div>
            <div class="pair-img-wrap">
              {#each sheets.filter(s => s.image) as sheet}
                <img src={sheet.image} alt={sheet.name} class="pair-half" />
              {/each}
            </div>
            <div class="pair-body">
              <div class="pair-title">Get the full set · {sheets.length} sheets</div>
              <p class="pair-blurb">Why pick? Stick 'em all. The full set for less than buying separately.</p>
              <div class="card-price-tag tag-set">
                <span class="tag-hole"></span>
                <span class="tag-val">${set.priceSet}</span>
                {#if setDiscount > 0}
                  <span class="tag-save">save ${setDiscount % 1 === 0 ? setDiscount : setDiscount.toFixed(2)}</span>
                {:else}
                  <span class="tag-label">full set</span>
                {/if}
              </div>
            </div>
          </button>
        {/if}
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

      {#if setDiscount > 0}
        <p class="psst">Psst — the full set saves you ${setDiscount.toFixed(2)}!</p>
      {/if}
    {/if}

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

  .pill-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

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

  .retiring-pill {
    display: inline-block;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 2px solid var(--ink);
    background: var(--orange);
    color: var(--ink);
    width: fit-content;
    transform: rotate(1.5deg);
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
  /* grid-template-columns is set dynamically via inline style */
  .options-grid {
    display: grid;
    grid-template-rows: auto auto;
    column-gap: 14px;
    row-gap: 0;
  }

  /* Stack everything on small screens */
  @media (max-width: 720px) {
    .options-grid {
      grid-template-columns: 1fr !important;
      grid-template-rows: auto;
      row-gap: 14px;
    }
    .sheet-choice,
    .pair-choice {
      grid-row: auto !important;
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
    grid-row: span 2;
    display: grid;
    grid-template-rows: subgrid;
    gap: 0;
    color: var(--ink);
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
  }

  .sc-img {
    position: absolute;
    top: 0;
    height: 100%;
    width: 200%;
    max-width: none;
    object-fit: cover;
    display: block;
  }

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

  .sc-blurb { font-size: 13.5px; line-height: 1.4; opacity: 0.75; margin: 0 0 10px; }

  /* ── Full set choice ── */
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
    grid-row: span 2;
    display: grid;
    grid-template-rows: subgrid;
    gap: 0;
    color: var(--ink);
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
    background: white;
    aspect-ratio: 1197 / 884;
    display: flex;
    gap: 3px;
  }

  .pair-half {
    flex: 1;
    min-width: 0;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 8px;
  }

  .pair-body { padding: 12px 4px 4px; }

  .pair-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    line-height: 1.05;
    margin-bottom: 6px;
  }

  .pair-blurb { font-size: 13.5px; line-height: 1.4; opacity: 0.75; margin: 0 0 10px; }

  /* ── Price tags on cards ── */
  .card-price-tag {
    display: inline-flex;
    align-items: center;
    border: 2.5px solid var(--ink);
    border-radius: 6px 20px 20px 6px;
    box-shadow: 0 3px 0 rgba(42,34,56,0.85);
    font-family: 'Bagel Fat One', sans-serif;
    background: white;
  }

  .card-price-tag.tag-set { background: var(--yellow); }

  .tag-hole {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    margin: 4px 3px 4px 7px;
    flex-shrink: 0;
  }

  .tag-val { font-size: 22px; padding: 4px 6px 4px 4px; }

  .tag-label {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 11px;
    padding-right: 12px;
    opacity: 0.7;
  }

  .tag-save {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 11px;
    padding-right: 12px;
    color: #1a7a42;
  }

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
  }

  .atc-left { display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1; }

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
    background: var(--yellow);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 6px 0 rgba(42,34,56,0.85);
    transition: transform 0.08s, box-shadow 0.08s, background 0.2s;
    letter-spacing: 0.2px;
    white-space: nowrap;
  }
  .atc-btn:hover { transform: translateY(-2px); }
  .atc-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(42,34,56,0.85); }
  .atc-btn.added { background: var(--mint); }

  @media (max-width: 480px) {
    .atc-panel { padding: 14px; gap: 10px; }
    .atc-total { font-size: 24px; }
    .atc-btn { font-size: 16px; padding: 12px 16px; }
  }

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

  /* ── Pick Your Own ── */
  .pyo-header {
    display: flex;
    align-items: baseline;
    gap: 14px;
    flex-wrap: wrap;
  }

  .pyo-deal-tag {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    background: var(--mint);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 4px 12px;
    box-shadow: 0 2px 0 rgba(42,34,56,0.7);
  }

  .pyo-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    flex-wrap: wrap;
  }

  .pyo-stat { font-weight: 700; }

  .pyo-free-pill {
    background: var(--mint);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 13px;
    font-weight: 700;
    color: #1a7a42;
    box-shadow: 0 2px 0 rgba(42,34,56,0.5);
    animation: pop 0.25s;
  }

  .pyo-until-free { font-size: 13px; opacity: 0.55; }

  .pyo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 14px;
  }

  .pyo-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background: white;
    padding: 14px;
    border-radius: 18px;
    text-align: left;
    outline: 4px solid transparent;
    outline-offset: -2px;
    transition: outline 0.15s, transform 0.2s;
    color: var(--ink);
  }

  .pyo-card.selected {
    outline-color: var(--accent);
    transform: translateY(-4px);
  }

  .pyo-count-badge {
    position: absolute;
    top: -12px;
    right: -12px;
    min-width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 3px solid var(--ink);
    display: grid;
    place-items: center;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 15px;
    color: white;
    box-shadow: 0 3px 0 rgba(42,34,56,0.85);
    transform: rotate(8deg);
    animation: pop 0.25s;
    z-index: 2;
    padding: 0 6px;
  }

  .pyo-card-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1.5px solid var(--line);
  }

  .pyo-ctrl-btn {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--paper);
    font-family: 'Fredoka', sans-serif;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: var(--ink);
    transition: background 0.1s, transform 0.08s;
    box-shadow: 0 2px 0 rgba(42,34,56,0.7);
    line-height: 1;
  }

  .pyo-ctrl-btn:hover:not(:disabled) { transform: scale(1.1); }
  .pyo-ctrl-btn:disabled { opacity: 0.3; cursor: default; box-shadow: none; }

  .pyo-ctrl-add { color: white; }

  .pyo-ctrl-count {
    flex: 1;
    text-align: center;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 18px;
  }

  .atc-panel-dim { opacity: 0.7; }
  .atc-btn:disabled { opacity: 0.5; cursor: default; transform: none; box-shadow: 0 6px 0 rgba(42,34,56,0.85); }

  @keyframes pop {
    0%   { transform: rotate(8deg) scale(0.4); }
    70%  { transform: rotate(8deg) scale(1.2); }
    100% { transform: rotate(8deg) scale(1); }
  }
</style>
