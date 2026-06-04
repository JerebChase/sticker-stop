<svelte:head>
  <meta property="og:type"         content="website" />
  <meta property="og:url"          content="https://www.sticker-stop.com" />
  <meta property="og:title"        content="Sticker Stop" />
  <meta property="og:description"  content="Hand-crafted specialty sticker sheets" />
  <meta property="og:image"        content="https://www.sticker-stop.com/og.png?v=3" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:image"       content="https://www.sticker-stop.com/og.png?v=3" />
</svelte:head>

<script>
  import '../app.css';
  import { cart } from '$lib/stores/cart';
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';

  let { children, data } = $props();

  let menuOpen = $state(false);

  afterNavigate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    menuOpen = false;
  });

  let cartCount = $derived($cart.reduce((s, i) => s + i.qty, 0));
  let currentPath = $derived(page.url.pathname);
  let adminAuthed = $derived(data.adminAuthed);
</script>

<div class="site-wrap">
  <header>
    <div class="max-w header-inner">
      <a href="/" class="logo">
        <div class="logo-badge">S!</div>
        <div class="logo-text">
          <span class="logo-name">Sticker Stop</span>
          <span class="logo-tag">stick 'em everywhere ✨</span>
        </div>
      </a>
      <nav class="nav-desktop">
        <a href="/" class="nav-btn" class:active={currentPath === '/'}>All Stickers</a>
        {#if adminAuthed}
          <a href="/admin" class="nav-btn admin-btn" class:active={currentPath === '/admin'}>Admin</a>
        {/if}
        <a href="/cart" class="nav-btn cart-btn" class:active={currentPath === '/cart'}>
          🛒 Cart
          {#if cartCount > 0}
            <span class="cart-badge">{cartCount}</span>
          {/if}
        </a>
      </nav>

      <button
        class="hamburger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onclick={() => menuOpen = !menuOpen}
      >
        {#if menuOpen}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        {:else}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        {/if}
        {#if cartCount > 0 && !menuOpen}
          <span class="hamburger-cart-dot"></span>
        {/if}
      </button>
    </div>

    {#if menuOpen}
      <div class="mobile-menu">
        <a href="/" class="mobile-nav-btn" class:active={currentPath === '/'}>All Stickers</a>
        {#if adminAuthed}
          <a href="/admin" class="mobile-nav-btn admin-mobile-btn" class:active={currentPath === '/admin'}>Admin</a>
        {/if}
        <a href="/cart" class="mobile-nav-btn cart-mobile-btn" class:active={currentPath === '/cart'}>
          🛒 Cart
          {#if cartCount > 0}
            <span class="cart-badge cart-badge-mobile">{cartCount}</span>
          {/if}
        </a>
      </div>
    {/if}
  </header>

  <!-- backdrop outside header so header z-index keeps menu links above it -->
  {#if menuOpen}
    <button class="menu-backdrop" aria-hidden="true" onclick={() => menuOpen = false} tabindex="-1"></button>
  {/if}

  <main>
    {@render children()}
  </main>

  <footer>
    <div class="max-w footer-inner">
      <span class="footer-text">Happy stickering!</span>
      <span class="footer-copy">© {new Date().getFullYear()} Sticker Stop</span>
    </div>
  </footer>
</div>

{#if currentPath !== '/feedback'}
  <a href="/feedback" class="fab" aria-label="Leave feedback">
    <span class="fab-icon">💬</span>
    <span class="fab-label">Feedback</span>
  </a>
{/if}

<!-- Doodle layer -->
<div class="doodles" aria-hidden="true">
  {#each [
    { x: '4%',  y: '8%',   rot: -15, delay: 0,   shape: 'star' },
    { x: '92%', y: '5%',   rot:  20, delay: 0.8,  shape: 'squiggle' },
    { x: '88%', y: '22%',  rot: -8,  delay: 1.6,  shape: 'dots' },
    { x: '2%',  y: '35%',  rot:  12, delay: 2.4,  shape: 'star' },
    { x: '95%', y: '48%',  rot: -18, delay: 3.2,  shape: 'squiggle' },
    { x: '6%',  y: '62%',  rot:   5, delay: 0.4,  shape: 'dots' },
    { x: '90%', y: '70%',  rot:  22, delay: 1.2,  shape: 'star' },
    { x: '3%',  y: '82%',  rot: -10, delay: 2.0,  shape: 'squiggle' },
    { x: '93%', y: '88%',  rot:  15, delay: 2.8,  shape: 'dots' },
    { x: '8%',  y: '95%',  rot:  -5, delay: 3.6,  shape: 'star' },
  ] as d, i}
    <div
      class="doodle"
      style="left:{d.x}; top:{d.y}; --rot:{d.rot}deg; animation-delay:{d.delay}s"
    >
      {#if d.shape === 'star'}
        <svg width="28" height="28" viewBox="0 0 28 28">
          <path d="M14 2l2.9 8.8H26l-7.5 5.4 2.9 8.8L14 20l-7.4 5 2.9-8.8L2 10.8h9.1z" fill="none" stroke="var(--orange)" stroke-width="2.5"/>
        </svg>
      {:else if d.shape === 'squiggle'}
        <svg width="36" height="20" viewBox="0 0 36 20">
          <path d="M2 10 C6 2,10 18,18 10 S30 2,34 10" fill="none" stroke="var(--pink)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      {:else}
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="5"  cy="5"  r="2.5" fill="var(--blue)" opacity=".7"/>
          <circle cx="19" cy="5"  r="2.5" fill="var(--blue)" opacity=".7"/>
          <circle cx="5"  cy="19" r="2.5" fill="var(--blue)" opacity=".7"/>
          <circle cx="19" cy="19" r="2.5" fill="var(--blue)" opacity=".7"/>
          <circle cx="12" cy="12" r="2.5" fill="var(--blue)" opacity=".7"/>
        </svg>
      {/if}
    </div>
  {/each}
</div>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--paper);
    border-bottom: 2.5px solid var(--ink);
    padding: 12px 0;
    isolation: isolate;
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .logo-badge {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--blue);
    border: 2.5px solid var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 20px;
    color: var(--ink);
    transform: rotate(-8deg);
    box-shadow: 0 3px 0 var(--ink);
    flex-shrink: 0;
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .logo-name {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    color: var(--ink);
    letter-spacing: -0.5px;
  }

  .logo-tag {
    font-family: 'Caveat', cursive;
    font-size: 14px;
    color: var(--ink);
    opacity: 0.65;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 3px 0 var(--ink);
    flex-shrink: 0;
    position: relative;
    transition: background 0.15s;
  }

  .hamburger:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--ink);
  }

  .hamburger-cart-dot {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--pink);
    border: 2px solid var(--ink);
  }

  .mobile-menu {
    display: none;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 16px;
    border-top: 2px solid var(--line);
  }

  .mobile-nav-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 17px;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 3px 0 var(--ink);
    text-decoration: none;
    position: relative;
    text-align: center;
  }

  .mobile-nav-btn.active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--ink);
  }

  .cart-mobile-btn  { background: var(--yellow); }
  .admin-mobile-btn { background: var(--blue); }

  .cart-badge-mobile {
    top: -6px;
    right: 10px;
  }

  .menu-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 90;
    background: transparent;
    border: none;
    cursor: default;
  }

  .nav-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 600;
    padding: 8px 18px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    transition: transform 0.1s, box-shadow 0.1s;
    position: relative;
  }

  .nav-btn:active, .nav-btn.active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--ink);
  }

  .cart-btn  { background: var(--yellow); }
  .admin-btn { background: var(--blue); }

  .cart-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--pink);
    color: white;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--ink);
    animation: pop 0.3s ease;
  }

  .site-wrap {
    min-height: 100svh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  footer {
    border-top: 2px solid var(--line);
    padding: 24px 0;
    margin-top: 64px;
  }

  .footer-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  .footer-text {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    color: var(--ink);
    opacity: 0.75;
  }

  .footer-copy {
    font-family: 'Nunito', sans-serif;
    font-size: 13px;
    color: var(--ink);
    opacity: 0.45;
  }

  .doodles {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
  }

  .doodle {
    position: absolute;
    animation: bob 6s ease-in-out infinite;
    opacity: 0.55;
  }

  .fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 200;
    height: 56px;
    border-radius: 999px;
    background: var(--pink);
    border: 3px solid var(--ink);
    box-shadow: 0 6px 0 var(--ink);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 20px 0 16px;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .fab:hover {
    transform: translateY(-3px);
    box-shadow: 0 9px 0 var(--ink);
  }

  .fab:active {
    transform: translateY(3px);
    box-shadow: 0 3px 0 var(--ink);
  }

  .fab-icon {
    font-size: 22px;
    line-height: 1;
  }

  .fab-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: white;
  }

  @media (max-width: 600px) {
    .fab {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      padding: 0;
      justify-content: center;
    }
    .fab-label { display: none; }

    .nav-desktop  { display: none; }
    .hamburger    { display: flex; }
    .mobile-menu  { display: flex; }
    .menu-backdrop { display: block; }
  }
</style>
