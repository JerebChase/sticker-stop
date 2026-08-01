<script>
  const ROTS = [-2, 1.5, -1, 2.5, -1.5, -3, 1, 2, -1.5, 2.5];

  let { data } = $props();
  let sets = $derived(data.sets);
</script>

<svelte:head>
  <title>Sticker Stop — Stick 'em Everywhere!</title>
</svelte:head>

<div class="page">
  <!-- Hero -->
  <section class="hero max-w">
    <div class="hero-pill">Hand-Crafted • Specialty Sheets</div>
    <h1 class="hero-heading">
      <span class="word w1">Stickers</span>
      <span class="word w2 pink">that</span>
      <span class="word w3">stick</span>
      <span class="word w4 blue">!</span>
    </h1>
    <p class="hero-sub">$2 a sheet • Save on sets • stick them on EVERYTHING</p>
  </section>

  <!-- Card grid -->
  <section class="grid-section max-w">
    {#if sets.length === 0}
      <div class="empty-state">
        <div class="empty-emoji">🌟</div>
        <p class="empty-heading">No stickers right now</p>
        <p class="empty-sub">Check back soon — new sheets are on the way!</p>
      </div>
    {:else}
      <div class="card-grid">
        {#each sets as set, i}
          {@const rot = ROTS[i % ROTS.length]}
          {@const isComingSoon = set.status === 'coming_soon'}
          {@const isRetiring = set.status === 'retiring_soon'}
          <a
            href={isComingSoon ? undefined : `/stickers/${set.id}`}
            class="set-card"
            class:coming-soon={isComingSoon}
            aria-disabled={isComingSoon}
            style="--rot:{rot}deg; --accent:{set.color}"
          >
            <!-- Washi tape -->
            <div class="washi" style="background:repeating-linear-gradient(45deg, {set.color}, {set.color} 6px, {set.color}88 6px, {set.color}88 12px)"></div>

            {#if isComingSoon}
              <div class="status-flag flag-coming-soon">Coming Soon</div>
            {:else if isRetiring}
              <div class="status-flag flag-retiring-soon">⏳ Retiring Soon</div>
            {/if}

            <!-- Image area -->
            <div class="card-img-wrap">
              {#each (set.sheets ?? []).filter(s => s.image) as sheet}
                <img src={sheet.image} alt={sheet.name} class="card-img" />
              {/each}
            </div>

            <!-- Price tags — positioned relative to card so they sit on top -->
            <div class="price-tags">
              {#if set.setType === 'pyo'}
                <div class="price-tag yellow" style="--tag-rot:8deg">${set.pyoPrice}/sheet</div>
              {:else}
                {#if set.sheets && set.sheets.length > 1}
                  <div class="price-tag yellow" style="--tag-rot:8deg">${set.priceSet} set</div>
                {/if}
                <div class="price-tag white" style="--tag-rot:-4deg">${set.priceSheet} sheet</div>
              {/if}
            </div>

            <!-- Card body -->
            <div class="card-body">
              <div class="card-title-row">
                <span class="card-name">{set.name}</span>
                {#if set.setType === 'pyo'}
                  <span class="chip chip-pyo" style="border-color:{set.color}">buy {set.pyoPickCount} get {set.pyoFreeCount} free</span>
                {:else}
                  <span class="chip" style="background:{set.color};border-color:{set.color}">{set.sheets?.length ?? 2} sheets</span>
                {/if}
              </div>
              <p class="card-tagline">{set.tagline}</p>
              <div class="card-footer">
                {#if set.setType === 'pyo'}
                  <span class="deal-text">Pick {set.pyoPickCount}, get {set.pyoFreeCount} free!</span>
                {:else if set.sheets && set.sheets.length > 1}
                  {@const savings = set.priceSheet * set.sheets.length - set.priceSet}
                  {#if savings > 0}
                    <span class="deal-text">Set deal · save ${savings % 1 === 0 ? savings : savings.toFixed(2)}</span>
                  {/if}
                {/if}
                {#if isComingSoon}
                  <span class="see-btn coming-soon-btn">Coming soon</span>
                {:else}
                  <span class="see-btn">See sheets →</span>
                {/if}
              </div>
            </div>
          </a>
        {/each}

        <!-- Coming soon card -->
        <div class="set-card coming-soon-card" style="--rot:{ROTS[sets.length % ROTS.length]}deg">
          <div class="washi" style="background:repeating-linear-gradient(45deg,#ffd23f,#ffd23f 6px,#ffd23f88 6px,#ffd23f88 12px)"></div>
          <div class="cs-body">
            <div class="cs-emoji">✨</div>
            <p class="cs-heading">More coming soon!</p>
            <p class="cs-sub">Keep an eye out for new sticker sheets dropping soon</p>
          </div>
        </div>
      </div>
    {/if}
  </section>

  <!-- Sticker books promo -->
  <section class="books-promo max-w">
    <a href="/books" class="books-promo-card">
      <span class="books-promo-emoji">📚</span>
      <span class="books-promo-text">
        <span class="books-promo-title">New! Sticker Books</span>
        <span class="books-promo-sub">A whole book of sticker pages, just $10</span>
      </span>
      <span class="books-promo-btn">Take a look →</span>
    </a>
  </section>

  <!-- How it works -->
  <section class="hiw-section max-w">
    <div class="hiw-panel">
      {#each [
        { n: '1', color: 'var(--pink)',   label: 'Pick your sheets', sub: 'Browse them all' },
        { n: '2', color: 'var(--yellow)', label: 'Add to cart',      sub: 'Save on sets' },
        { n: '3', color: 'var(--blue)',   label: 'Place your order', sub: 'Apple Pay or cash' },
        { n: '4', color: 'var(--mint)',   label: 'Stickers ship out', sub: 'Stick everywhere 🎉' },
      ] as step}
        <div class="hiw-step">
          <div class="hiw-num" style="background:{step.color}">{step.n}</div>
          <span class="hiw-label">{step.label}</span>
          <span class="hiw-sub">{step.sub}</span>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .page { padding: 48px 0 0; }

  /* ── Hero ── */
  .hero {
    text-align: center;
    padding-bottom: 48px;
  }

  .hero-pill {
    display: inline-block;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    background: var(--ink);
    color: var(--paper);
    padding: 6px 16px;
    border-radius: 999px;
    margin-bottom: 20px;
    transform: rotate(-1.5deg);
  }

  .hero-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: clamp(52px, 8vw, 96px);
    letter-spacing: -1.5px;
    line-height: 1.05;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 12px;
  }

  .word { display: inline-block; }
  .w1 { transform: rotate(-2deg); }
  .w2 { transform: rotate(2deg); }
  .w3 { transform: rotate(-1deg); }
  .w4 { transform: rotate(3deg) translateY(6px); font-size: 0.85em; }
  .pink { color: var(--pink); }
  .blue { color: var(--blue); }

  .hero-sub {
    font-family: 'Caveat', cursive;
    font-size: clamp(20px, 3vw, 28px);
    color: var(--ink);
    opacity: 0.75;
  }

  /* ── Card grid ── */
  .grid-section { padding-bottom: 64px; }

  .empty-state {
    text-align: center;
    padding: 64px 24px;
  }

  .empty-emoji {
    font-size: 64px;
    line-height: 1;
    margin-bottom: 16px;
  }

  .empty-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 32px;
    color: var(--ink);
    margin: 0 0 8px;
  }

  .empty-sub {
    font-family: 'Caveat', cursive;
    font-size: 22px;
    color: var(--ink);
    opacity: 0.65;
    margin: 0;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 32px 26px;
  }

  /* Coming soon card */
  .coming-soon-card {
    cursor: default;
    pointer-events: none;
    background: var(--paper-2, #efe7d0);
    border-style: dashed;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 260px;
    grid-column: 1 / -1;
    max-width: 360px;
    width: 100%;
    margin: 0 auto;
  }

  .coming-soon-card:hover {
    transform: rotate(var(--rot, 0deg));
    box-shadow: 0 1px 0 rgba(0,0,0,.05), 0 6px 0 rgba(0,0,0,.04), 0 18px 28px -10px rgba(42,34,56,0.18);
  }

  .cs-body {
    padding: 32px 24px;
    text-align: center;
  }

  .cs-emoji {
    font-size: 52px;
    line-height: 1;
    margin-bottom: 14px;
  }

  .cs-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 24px;
    color: var(--ink);
    margin: 0 0 8px;
  }

  .cs-sub {
    font-family: 'Caveat', cursive;
    font-size: 18px;
    color: var(--ink);
    opacity: 0.65;
    margin: 0;
    line-height: 1.4;
  }

  .set-card {
    position: relative;
    background: white;
    border-radius: 18px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 1px 0 rgba(0,0,0,.05), 0 6px 0 rgba(0,0,0,.04), 0 18px 28px -10px rgba(42,34,56,0.18);
    transform: rotate(var(--rot, 0deg));
    transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s;
    text-decoration: none;
    color: var(--ink);
    overflow: visible;
    display: block;
    padding-top: 10px;
  }

  .set-card:hover {
    transform: rotate(0deg) translateY(-8px);
    box-shadow: 0 4px 0 rgba(0,0,0,.08), 0 24px 40px -8px rgba(42,34,56,0.22);
  }

  .set-card.coming-soon {
    cursor: default;
  }

  .set-card.coming-soon:hover {
    transform: rotate(var(--rot, 0deg));
    box-shadow: 0 1px 0 rgba(0,0,0,.05), 0 6px 0 rgba(0,0,0,.04), 0 18px 28px -10px rgba(42,34,56,0.18);
  }

  .set-card.coming-soon .card-img-wrap { opacity: 0.55; }

  .status-flag {
    position: absolute;
    top: 22px;
    left: 14px;
    z-index: 3;
    font-family: 'Fredoka', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 4px 11px;
    border-radius: 999px;
    border: 2px solid var(--ink);
  }

  .flag-coming-soon { background: var(--blue); }
  .flag-retiring-soon { background: var(--orange); }

  .coming-soon-btn {
    background: var(--paper-2, #efe7d0);
    color: var(--ink);
    opacity: 0.7;
  }

  .washi {
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%) rotate(-1.5deg);
    width: 90px;
    height: 22px;
    border-radius: 3px;
    opacity: 0.85;
    border: 1.5px solid rgba(42,34,56,0.15);
  }

  .card-img-wrap {
    display: flex;
    gap: 3px;
    margin: 14px 14px 0;
    border-radius: 14px;
    overflow: hidden;
    background: white;
    aspect-ratio: 16 / 12;
  }

  .card-img {
    flex: 1;
    min-width: 0;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 10px;
  }

  .price-tags {
    position: absolute;
    top: 20px;
    right: -10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
    z-index: 2;
  }

  .price-tag {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 13px;
    padding: 5px 12px 5px 14px;
    border-radius: 8px 28px 28px 8px;
    border: 2px solid var(--ink);
    box-shadow: 0 3px 0 var(--ink);
    position: relative;
    white-space: nowrap;
  }

  .price-tag::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--paper-2);
    border: 1.5px solid var(--ink);
  }

  .price-tag.yellow {
    background: var(--yellow);
    transform: rotate(8deg);
  }

  .price-tag.white {
    background: white;
    transform: rotate(-4deg);
  }

  .card-body {
    padding: 14px 16px 16px;
  }

  .card-title-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .card-name {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    letter-spacing: -0.5px;
  }

  .chip {
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    border: 2px solid var(--ink);
    color: var(--ink);
    white-space: nowrap;
  }

  .chip-pyo { background: white; font-size: 11px; }

  .card-tagline {
    font-size: 14px;
    color: var(--ink);
    opacity: 0.7;
    margin-bottom: 12px;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .deal-text {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--ink);
    opacity: 0.65;
  }

  .see-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    background: var(--ink);
    color: var(--paper);
    padding: 6px 14px;
    border-radius: 999px;
  }

  /* ── Sticker books promo ── */
  .books-promo { padding-bottom: 48px; }

  .books-promo-card {
    display: flex;
    align-items: center;
    gap: 18px;
    background: var(--blue);
    border: 2.5px solid var(--ink);
    border-radius: 22px;
    box-shadow: 0 6px 0 var(--ink);
    padding: 22px 26px;
    text-decoration: none;
    color: var(--ink);
    transition: transform 0.15s, box-shadow 0.15s;
    flex-wrap: wrap;
  }

  .books-promo-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 9px 0 var(--ink);
  }

  .books-promo-emoji { font-size: 40px; line-height: 1; }

  .books-promo-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 200px;
  }

  .books-promo-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 24px;
    letter-spacing: -0.5px;
  }

  .books-promo-sub {
    font-family: 'Caveat', cursive;
    font-size: 18px;
    opacity: 0.8;
  }

  .books-promo-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    background: var(--ink);
    color: var(--paper);
    padding: 8px 16px;
    border-radius: 999px;
    white-space: nowrap;
  }

  /* ── How it works ── */
  .hiw-section { padding-bottom: 64px; }

  .hiw-panel {
    background: white;
    border-radius: 22px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 8px 0 var(--ink);
    padding: 32px 24px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  @media (max-width: 700px) {
    .hiw-panel { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 400px) {
    .hiw-panel { grid-template-columns: 1fr; }
  }

  .hiw-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .hiw-num {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2.5px solid var(--ink);
    box-shadow: 0 3px 0 var(--ink);
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink);
  }

  .hiw-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 700;
  }

  .hiw-sub {
    font-size: 13px;
    color: var(--ink);
    opacity: 0.6;
  }
</style>
