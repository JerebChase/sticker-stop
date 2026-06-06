<script>
  let { data } = $props();
  let { categories } = $derived(data);

  let activeCategory = $state(null);

  let visibleCategories = $derived(
    activeCategory
      ? categories.filter(c => c.id === activeCategory)
      : categories
  );

  const totalImages = $derived(
    categories.reduce((s, c) => s + c.images.length, 0)
  );
</script>

<svelte:head>
  <title>Free Backgrounds — Sticker Stop</title>
</svelte:head>

<div class="page">

  <!-- Hero -->
  <section class="hero max-w">
    <div class="hero-pill">Free Downloads • No Strings Attached</div>
    <h1 class="hero-heading">
      <span class="word w1">Free</span>
      <span class="word w2 pink">Backgrounds</span>
    </h1>
    <p class="hero-sub">Print 'em out, stick your stickers on top, and go wild ✨</p>
  </section>

  <!-- Category filter tabs -->
  <div class="filter-bar max-w">
    <button
      class="filter-btn"
      class:active={activeCategory === null}
      onclick={() => activeCategory = null}
    >
      All
      {#if totalImages > 0}
        <span class="filter-count">{totalImages}</span>
      {/if}
    </button>
    {#each categories as cat}
      <button
        class="filter-btn"
        class:active={activeCategory === cat.id}
        style="--cat-color:{cat.color}"
        onclick={() => activeCategory = activeCategory === cat.id ? null : cat.id}
      >
        {cat.label}
        {#if cat.images.length > 0}
          <span class="filter-count">{cat.images.length}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Category sections -->
  <div class="categories max-w">
    {#each visibleCategories as cat}
      <section class="category-section">

        <!-- Section header -->
        <div class="category-header">
          <div>
            <h2 class="category-name">{cat.label}</h2>
            <p class="category-count">
              {cat.images.length === 0
                ? 'Coming soon'
                : `${cat.images.length} background${cat.images.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {#if cat.images.length === 0}
          <!-- Empty state -->
          <div class="empty-section">
            <div class="empty-tape" style="background:repeating-linear-gradient(45deg,{cat.color},{cat.color} 6px,{cat.color}88 6px,{cat.color}88 12px)"></div>
            <p class="empty-label">More coming soon — check back later!</p>
          </div>
        {:else}
          <!-- Image grid -->
          <div class="image-grid">
            {#each cat.images as img}
              <a href={img.file} download={img.name} target="_blank" rel="noopener noreferrer" class="image-card" title="Download {img.name}">
                <div class="image-preview-wrap">
                  <img src={img.preview || img.file} alt={img.name} class="image-preview" loading="lazy" />
                </div>
                <div class="image-info">
                  <span class="image-name">{img.name}</span>
                  <svg class="download-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                </div>
              </a>
            {/each}
          </div>
        {/if}

      </section>
    {/each}

    <!-- All empty state -->
    {#if totalImages === 0}
      <div class="all-empty">
        <div class="all-empty-emoji">🖼️</div>
        <p class="all-empty-heading">Backgrounds are on the way!</p>
        <p class="all-empty-sub">We're putting together the perfect collection — come back soon!</p>
      </div>
    {/if}
  </div>

</div>

<style>
  .page { padding: 48px 0 80px; }

  /* ── Hero ── */
  .hero {
    text-align: center;
    padding-bottom: 40px;
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
    font-size: clamp(48px, 7vw, 86px);
    letter-spacing: -1.5px;
    line-height: 1.05;
    margin-bottom: 14px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 14px;
  }

  .word      { display: inline-block; }
  .w1        { transform: rotate(-2deg); }
  .w2        { transform: rotate(1.5deg); }
  .pink      { color: var(--pink); }

  .hero-sub {
    font-family: 'Caveat', 'Comic Sans MS', 'Comic Sans', cursive;
    font-size: clamp(18px, 3vw, 26px);
    color: var(--ink);
    opacity: 0.75;
  }

  /* ── Filter bar ── */
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 40px;
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    font-weight: 600;
    padding: 8px 18px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 3px 0 var(--ink);
    transition: transform 0.1s, box-shadow 0.1s, background 0.1s;
  }

  .filter-btn:hover {
    background: var(--cat-color, var(--yellow));
  }

  .filter-btn.active {
    background: var(--cat-color, var(--ink));
    color: var(--cat-color, white) == var(--ink) ? white : var(--ink);
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--ink);
  }

  .filter-btn.active:not([style]) {
    background: var(--ink);
    color: var(--paper);
  }

  .filter-btn.active[style] {
    background: var(--cat-color);
    color: var(--ink);
  }

  .filter-count {
    background: var(--ink);
    color: var(--paper);
    font-size: 11px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 999px;
    line-height: 1.5;
  }

  .filter-btn.active .filter-count {
    background: white;
    color: var(--ink);
  }

  /* ── Category sections ── */
  .categories {
    display: flex;
    flex-direction: column;
    gap: 52px;
  }

  .category-section {}

  .category-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
  }

  .category-name {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 28px;
    letter-spacing: -0.5px;
    color: var(--ink);
    margin: 0 0 2px;
  }

  .category-count {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    opacity: 0.5;
    margin: 0;
  }

  /* ── Empty section ── */
  .empty-section {
    background: white;
    border-radius: 18px;
    border: 2.5px dashed rgba(42,34,56,0.2);
    padding: 36px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    position: relative;
    overflow: hidden;
  }

  .empty-tape {
    width: 80px;
    height: 20px;
    border-radius: 3px;
    opacity: 0.75;
    border: 1.5px solid rgba(42,34,56,0.15);
  }

  .empty-label {
    font-family: 'Caveat', 'Comic Sans MS', 'Comic Sans', cursive;
    font-size: 20px;
    color: var(--ink);
    opacity: 0.5;
    margin: 0;
  }

  /* ── All empty ── */
  .all-empty {
    text-align: center;
    padding: 64px 24px;
  }

  .all-empty-emoji {
    font-size: 64px;
    line-height: 1;
    margin-bottom: 16px;
  }

  .all-empty-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 32px;
    color: var(--ink);
    margin: 0 0 8px;
  }

  .all-empty-sub {
    font-family: 'Caveat', 'Comic Sans MS', 'Comic Sans', cursive;
    font-size: 22px;
    color: var(--ink);
    opacity: 0.65;
    margin: 0;
  }

  /* ── Image grid ── */
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }

  .image-card {
    display: block;
    text-decoration: none;
    color: inherit;
    background: white;
    border-radius: 16px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 5px 0 var(--ink);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
  }

  .image-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 9px 0 var(--ink);
  }

  .image-preview-wrap {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: var(--paper);
  }

  .image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.25s;
  }

  .image-card:hover .image-preview {
    transform: scale(1.04);
  }

  .image-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    gap: 8px;
  }

  .image-name {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .download-icon {
    flex-shrink: 0;
    color: var(--ink);
    opacity: 0.4;
    transition: opacity 0.15s;
  }

  .image-card:hover .download-icon {
    opacity: 1;
  }

  @media (max-width: 600px) {
    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 14px;
    }
  }
</style>
