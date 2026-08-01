<script>
  let { images = [], alt = '' } = $props();

  let index = $state(0);
  let trackEl = $state(null);
  let dragging = $state(false);
  let deltaX = $state(0);
  let startX = 0;
  let widthPx = 1;

  function clamp(i) {
    return Math.max(0, Math.min(images.length - 1, i));
  }

  function goTo(i) { index = clamp(i); }
  function next()  { goTo(index + 1); }
  function prev()  { goTo(index - 1); }

  function onPointerDown(e) {
    if (images.length <= 1) return;
    dragging = true;
    startX = e.clientX;
    deltaX = 0;
    widthPx = trackEl?.clientWidth || 1;
    trackEl?.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    deltaX = e.clientX - startX;
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    const threshold = widthPx * 0.16;
    if (deltaX < -threshold) next();
    else if (deltaX > threshold) prev();
    deltaX = 0;
  }

  let dragPercent = $derived(widthPx ? (deltaX / widthPx) * 100 : 0);
  let trackStyle = $derived(
    `transform: translateX(calc(${-index * 100}% + ${dragging ? dragPercent : 0}%)); ` +
    `transition: ${dragging ? 'none' : 'transform 0.4s cubic-bezier(.22,1,.36,1)'};`
  );

  function onKeydown(e) {
    if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="carousel" role="group" aria-roledescription="carousel" aria-label={alt} tabindex="0" onkeydown={onKeydown}>
  <div class="carousel-viewport">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="carousel-track"
      bind:this={trackEl}
      style={trackStyle}
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={endDrag}
      onpointercancel={endDrag}
      onpointerleave={endDrag}
    >
      {#each images as img, i (img.id ?? i)}
        <div class="carousel-slide">
          <img src={img.url} alt={alt ? `${alt} — page ${i + 1}` : `Page ${i + 1}`} draggable="false" />
        </div>
      {/each}
    </div>
  </div>

  {#if images.length > 1}
    <button type="button" class="carousel-arrow arrow-prev" onclick={prev} disabled={index === 0} aria-label="Previous image">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <button type="button" class="carousel-arrow arrow-next" onclick={next} disabled={index === images.length - 1} aria-label="Next image">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
    </button>

    <div class="carousel-dots">
      {#each images as _, i}
        <button type="button" class="carousel-dot" class:active={i === index} onclick={() => goTo(i)} aria-label={`Go to image ${i + 1}`}></button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .carousel {
    position: relative;
    outline: none;
  }

  .carousel-viewport {
    border-radius: 18px;
    border: 3px solid var(--ink);
    box-shadow: 0 1px 0 rgba(0,0,0,.05), 0 6px 0 rgba(0,0,0,.04), 0 18px 28px -10px rgba(42,34,56,0.18);
    overflow: hidden;
    background: white;
    aspect-ratio: 4 / 3;
  }

  .carousel-track {
    display: flex;
    height: 100%;
    touch-action: pan-y;
    cursor: grab;
  }

  .carousel-slide {
    flex: 0 0 100%;
    height: 100%;
  }

  .carousel-slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    -webkit-user-drag: none;
    user-select: none;
  }

  .carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2.5px solid var(--ink);
    background: white;
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--ink);
    transition: transform 0.1s, box-shadow 0.1s, opacity 0.15s;
  }

  .carousel-arrow:hover:not(:disabled) { transform: translateY(-52%); }
  .carousel-arrow:active:not(:disabled) { transform: translateY(-48%); box-shadow: 0 1px 0 var(--ink); }
  .carousel-arrow:disabled { opacity: 0.35; cursor: default; }

  .arrow-prev { left: -18px; }
  .arrow-next { right: -18px; }

  @media (max-width: 560px) {
    .arrow-prev { left: 8px; }
    .arrow-next { right: 8px; }
  }

  .carousel-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 14px;
  }

  .carousel-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    background: white;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s, transform 0.15s;
  }

  .carousel-dot.active {
    background: var(--pink);
    transform: scale(1.2);
  }
</style>
