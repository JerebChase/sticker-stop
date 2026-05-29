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
    <div class="card-grid">
      {#each sets as set, i}
        {@const rot = ROTS[i % ROTS.length]}
        <a
          href="/stickers/{set.id}"
          class="set-card"
          style="--rot:{rot}deg; --accent:{set.color}"
        >
          <!-- Washi tape -->
          <div class="washi" style="background:repeating-linear-gradient(45deg, {set.color}, {set.color} 6px, {set.color}88 6px, {set.color}88 12px)"></div>

          <!-- Image area -->
          <div class="card-img-wrap">
            {#each (set.sheets ?? []).slice(0, 2).filter(s => s.image) as sheet}
              <img src={sheet.image} alt={sheet.name} class="card-img" />
            {/each}
          </div>

          <!-- Price tags — positioned relative to card so they sit on top -->
          <div class="price-tags">
            {#if set.sheets && set.sheets.length > 1}
              <div class="price-tag yellow" style="--tag-rot:8deg">${set.priceSet} set</div>
            {/if}
            <div class="price-tag white" style="--tag-rot:-4deg">${set.priceSheet} sheet</div>
          </div>

          <!-- Card body -->
          <div class="card-body">
            <div class="card-title-row">
              <span class="card-name">{set.name}</span>
              <span class="chip" style="background:{set.color};border-color:{set.color}">{set.sheets?.length ?? 2} sheets</span>
            </div>
            <p class="card-tagline">{set.tagline}</p>
            <div class="card-footer">
              {#if set.sheets && set.sheets.length > 1}
                {@const savings = set.priceSheet * set.sheets.length - set.priceSet}
                {#if savings > 0}
                  <span class="deal-text">Set deal · save ${savings % 1 === 0 ? savings : savings.toFixed(2)}</span>
                {/if}
              {/if}
              <span class="see-btn">See sheets →</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
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

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 32px 26px;
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
    background: var(--paper-2);
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
