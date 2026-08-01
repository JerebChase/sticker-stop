<script>
  import { cart } from '$lib/stores/cart';
  import BookCarousel from '$lib/components/BookCarousel.svelte';

  let { data } = $props();
  let book = $derived(data.book);

  let qty = $state(1);
  let added = $state(false);
  let lineTotal = $derived(book.price * qty);

  function addToCart() {
    cart.add({
      kind:       'book',
      bookId:     book.id,
      sheetId:    `book-${book.id}`,
      name:       book.title,
      image:      book.images?.[0]?.url || '',
      side:       'full',
      price:      book.price,
      sheetCount: 4,
    }, qty);
    added = true;
    setTimeout(() => { added = false; }, 1500);
  }
</script>

<svelte:head>
  <title>{book.title} — Sticker Stop</title>
</svelte:head>

<div class="page max-w">
  <a href="/books" class="back-link">← Back to all books</a>

  <div class="book-layout">
    <div class="carousel-col">
      <BookCarousel images={book.images} alt={book.title} />
    </div>

    <div class="info-col">
      <div class="pill-row">
        <div class="book-pill">STICKER BOOK</div>
        {#if book.status === 'retiring_soon'}
          <div class="retiring-pill">⏳ Retiring Soon</div>
        {/if}
      </div>
      <h1 class="book-title">{book.title}</h1>
      {#if book.tagline}
        <p class="book-tagline">{book.tagline}</p>
      {/if}
      {#if book.description}
        <p class="book-desc">{book.description}</p>
      {/if}

      <div class="atc-panel">
        <div class="atc-left">
          <div class="stepper">
            <button class="step-btn" disabled={qty <= 1} onclick={() => qty = Math.max(1, qty - 1)}>−</button>
            <span class="step-val">{qty}</span>
            <button class="step-btn" disabled={qty >= 99} onclick={() => qty = Math.min(99, qty + 1)}>+</button>
          </div>
          <div class="atc-info">
            <div class="atc-label">${Number(book.price).toFixed(2)} each</div>
            <div class="atc-total">${lineTotal.toFixed(2)}</div>
          </div>
        </div>
        <button class="atc-btn" class:added onclick={addToCart}>
          {added ? 'Added! ✓' : 'Add to cart'}
        </button>
      </div>
    </div>
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

  .book-layout {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 48px;
    align-items: start;
  }

  @media (max-width: 780px) {
    .book-layout { grid-template-columns: 1fr; gap: 28px; }
  }

  .carousel-col { min-width: 0; }

  .pill-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .book-pill {
    display: inline-block;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 999px;
    border: 2px solid var(--ink);
    background: var(--blue);
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

  .book-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: clamp(36px, 4.5vw, 56px);
    letter-spacing: -1px;
    line-height: 1;
    margin: 4px 0 8px;
  }

  .book-tagline {
    font-family: 'Caveat', cursive;
    font-size: 24px;
    opacity: 0.85;
    margin: 0 0 14px;
  }

  .book-desc {
    font-size: 15.5px;
    line-height: 1.6;
    opacity: 0.8;
    margin: 0 0 24px;
  }

  .atc-panel {
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
</style>
