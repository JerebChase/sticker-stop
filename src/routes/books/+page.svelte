<script>
  const ROTS = [-2, 1.5, -1, 2.5, -1.5, -3, 1, 2, -1.5, 2.5];

  let { data } = $props();
  let books = $derived(data.books);
</script>

<svelte:head>
  <title>Sticker Books — Sticker Stop</title>
</svelte:head>

<div class="page">
  <!-- Hero -->
  <section class="hero max-w">
    <div class="hero-pill">Fill 'em up • Take 'em anywhere</div>
    <h1 class="hero-heading">
      <span class="word w1">Sticker</span>
      <span class="word w2 blue">Books</span>
    </h1>
    <p class="hero-sub">A whole book of sticker pages to fill up and carry around!</p>
  </section>

  <!-- Card grid -->
  <section class="grid-section max-w">
    {#if books.length === 0}
      <div class="empty-state">
        <div class="empty-emoji">📚</div>
        <p class="empty-heading">No sticker books right now</p>
        <p class="empty-sub">Check back soon — new books are on the way!</p>
      </div>
    {:else}
      <div class="card-grid">
        {#each books as book, i}
          {@const rot = ROTS[i % ROTS.length]}
          {@const isComingSoon = book.status === 'coming_soon'}
          {@const isRetiring = book.status === 'retiring_soon'}
          <a
            href={isComingSoon ? undefined : `/books/${book.id}`}
            class="book-card"
            class:coming-soon={isComingSoon}
            aria-disabled={isComingSoon}
            style="--rot:{rot}deg"
          >
            <div class="washi"></div>

            {#if isComingSoon}
              <div class="status-flag flag-coming-soon">Coming Soon</div>
            {:else if isRetiring}
              <div class="status-flag flag-retiring-soon">⏳ Retiring Soon</div>
            {/if}

            <div class="card-img-wrap">
              {#if book.images?.[0]?.url}
                <img src={book.images[0].url} alt={book.title} class="card-img" />
              {/if}
            </div>

            <div class="price-tags">
              <div class="price-tag yellow">${Number(book.price).toFixed(2)}</div>
            </div>

            <div class="card-body">
              <span class="card-name">{book.title}</span>
              <p class="card-tagline">{book.tagline}</p>
              <div class="card-footer">
                {#if isComingSoon}
                  <span class="see-btn coming-soon-btn">Coming soon</span>
                {:else}
                  <span class="see-btn">Take a look →</span>
                {/if}
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .page { padding: 48px 0 0; }

  .hero { text-align: center; padding-bottom: 48px; }

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
  .blue { color: var(--blue); }

  .hero-sub {
    font-family: 'Caveat', cursive;
    font-size: clamp(20px, 3vw, 28px);
    color: var(--ink);
    opacity: 0.75;
  }

  .grid-section { padding-bottom: 64px; }

  .empty-state { text-align: center; padding: 64px 24px; }
  .empty-emoji { font-size: 64px; line-height: 1; margin-bottom: 16px; }
  .empty-heading { font-family: 'Bagel Fat One', sans-serif; font-size: 32px; color: var(--ink); margin: 0 0 8px; }
  .empty-sub { font-family: 'Caveat', cursive; font-size: 22px; color: var(--ink); opacity: 0.65; margin: 0; }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 32px 26px;
  }

  .book-card {
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

  .book-card:hover {
    transform: rotate(0deg) translateY(-8px);
    box-shadow: 0 4px 0 rgba(0,0,0,.08), 0 24px 40px -8px rgba(42,34,56,0.22);
  }

  .book-card.coming-soon { cursor: default; }
  .book-card.coming-soon:hover {
    transform: rotate(var(--rot, 0deg));
    box-shadow: 0 1px 0 rgba(0,0,0,.05), 0 6px 0 rgba(0,0,0,.04), 0 18px 28px -10px rgba(42,34,56,0.18);
  }
  .book-card.coming-soon .card-img-wrap { opacity: 0.55; }

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

  .coming-soon-btn { background: var(--paper-2, #efe7d0); color: var(--ink); opacity: 0.7; }

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
    background: repeating-linear-gradient(45deg, var(--blue), var(--blue) 6px, #4ec3ff88 6px, #4ec3ff88 12px);
  }

  .card-img-wrap {
    margin: 14px 14px 0;
    border-radius: 14px;
    overflow: hidden;
    background: var(--paper-2);
    aspect-ratio: 4 / 3;
  }

  .card-img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .price-tags {
    position: absolute;
    top: 20px;
    right: -10px;
    z-index: 2;
  }

  .price-tag {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 15px;
    padding: 6px 14px 6px 16px;
    border-radius: 8px 28px 28px 8px;
    border: 2px solid var(--ink);
    box-shadow: 0 3px 0 var(--ink);
    position: relative;
    white-space: nowrap;
    transform: rotate(8deg);
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

  .price-tag.yellow { background: var(--yellow); }

  .card-body { padding: 14px 16px 16px; }

  .card-name {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    letter-spacing: -0.5px;
    display: block;
    margin-bottom: 6px;
  }

  .card-tagline { font-size: 14px; color: var(--ink); opacity: 0.7; margin-bottom: 12px; }

  .card-footer { display: flex; justify-content: flex-end; }

  .see-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    background: var(--ink);
    color: var(--paper);
    padding: 6px 14px;
    border-radius: 999px;
  }
</style>
