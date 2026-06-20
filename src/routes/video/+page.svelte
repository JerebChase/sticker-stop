<svelte:head>
  <title>New Sticker Drop! — Sticker Stop</title>
  <script src="https://fast.wistia.com/player.js" async></script>
  <script src="https://fast.wistia.com/embed/7hvswpf1bs.js" async type="module"></script>
  <style>wistia-player[media-id='7hvswpf1bs']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/7hvswpf1bs/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style>
</svelte:head>

<div class="page max-w">
  <div class="hero">
    <div class="stamp">grab some popcorn</div>
    <h1 class="hero-title">New Sticker Drop!</h1>
  </div>

  <div class="video-card">
    <wistia-player media-id="7hvswpf1bs" aspect="1.7777777777777777"></wistia-player>
  </div>

  <div class="back-row">
    <a href="/" class="big-btn pink-btn">← Back to stickers</a>
  </div>
</div>

<style>
  .page {
    padding: 32px 0 64px;
    position: relative;
    z-index: 1;
  }

  @media (max-width: 600px) {
    .page { padding-inline: 20px; }
  }

  .hero {
    text-align: center;
    padding: 40px 0 32px;
  }

  .stamp {
    display: inline-block;
    background: var(--ink);
    color: white;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 5px 16px;
    border-radius: 999px;
    margin-bottom: 16px;
    transform: rotate(-1deg);
  }

  .hero-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: clamp(44px, 6vw, 72px);
    letter-spacing: -1.5px;
    margin-bottom: 0;
    line-height: 1.0;
  }

  .video-card {
    max-width: 720px;
    margin: 0 auto 32px;
    border: 2.5px solid var(--ink);
    border-radius: 22px;
    box-shadow: 0 8px 0 var(--ink);
    overflow: hidden;
  }

  wistia-player {
    display: block;
    width: 100%;
  }

  .back-row {
    display: flex;
    justify-content: center;
  }

  .big-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    padding: 13px 28px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 6px 0 var(--ink);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    text-decoration: none;
  }

  .big-btn:hover { transform: translateY(-2px); }
  .big-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--ink); }
  .pink-btn { background: var(--pink); color: white; }
</style>
