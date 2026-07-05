<script>
  import { cart } from '$lib/stores/cart';

  let { data } = $props();

  let name = $state('');
  let email = $state('');
  let address = $state('');
  let deliveryMethod = $state('mail'); // 'mail' | 'pickup'
  let submitting = $state(false);
  let success = $state(null);

  let items = $derived($cart);
  let subtotal = $derived(items.reduce((s, i) => s + i.price * i.qty, 0));
  let totalSheets = $derived(items.reduce((s, i) => {
    const count = i.sheetCount ?? (i.image3 ? 3 : i.image2 ? 2 : 1);
    return s + count * i.qty;
  }, 0));
  let shipping = $derived(
    items.length === 0 || deliveryMethod !== 'mail' ? 0 :
    totalSheets <= 4  ? 1 :
    totalSheets <= 10 ? 2 :
    2 + Math.ceil((totalSheets - 10) / 5)
  );
  let total = $derived(subtotal + shipping);
  let canSubmit = $derived(
    items.length > 0 &&
    name.trim() &&
    email.trim() &&
    (deliveryMethod === 'pickup' || address.trim())
  );

  let confettiPieces = $derived(
    success
      ? Array.from({ length: 50 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          color: ['var(--pink)', 'var(--yellow)', 'var(--blue)', 'var(--mint)', 'var(--orange)', 'var(--purple)'][i % 6],
          size: 8 + Math.random() * 10,
          delay: Math.random() * 1.5,
          shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'triangle',
        }))
      : []
  );

  async function placeOrder() {
    if (!canSubmit) return;
    submitting = true;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:    name.trim(),
          customerEmail:   email.trim(),
          customerAddress: deliveryMethod === 'mail' ? address.trim() : '',
          deliveryMethod,
          items,
          subtotal,
          shipping,
          total,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Order failed');
      success = {
        orderId: resData.orderId,
        name: name.trim(),
        address: deliveryMethod === 'mail' ? address.trim() : '',
        deliveryMethod,
        items: [...items],
        subtotal,
        shipping,
        total,
      };
      cart.clear();
    } catch (err) {
      alert('Oops — ' + err.message);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Your Cart — Sticker Stop</title>
</svelte:head>

{#if success}
  <!-- ── Success ── -->
  <div class="success-page max-w">
    <!-- Confetti -->
    <div class="confetti-layer" aria-hidden="true">
      {#each confettiPieces as p}
        <div
          class="confetti-piece"
          style="
            left:{p.x}%;
            width:{p.size}px;
            height:{p.size}px;
            background:{p.shape !== 'triangle' ? p.color : 'transparent'};
            border-radius:{p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '0'};
            animation-delay:{p.delay}s;
          "
        ></div>
      {/each}
    </div>

    <div class="success-card">
      <div class="success-check">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path d="M6 16l7 7 13-13" stroke="var(--ink)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="success-title">Yay! Order placed!</h1>
      <p class="success-sub">
        {success.deliveryMethod === 'pickup'
          ? "We've saved your order. We'll be in touch to arrange pickup!"
          : "We've saved your order. Check your email for payment info!"}
      </p>

      <div class="pay-callout">
        <p class="pay-callout-msg">
          Thanks for buying my stickers! 🎉 We accept <strong>Apple Pay or cash</strong> — you can send your payment to my mom or dad. Enjoy!
        </p>
      </div>

      <div class="receipt">
        <div class="receipt-header">
          <span class="receipt-id">Order #{success.orderId}</span>
          <span class="receipt-total">${success.total.toFixed(2)}</span>
        </div>
        <div class="receipt-items">
          {#each success.items as item}
            <div class="receipt-row">
              <span>{item.qty}× {item.name}</span>
              <span>${(item.qty * item.price).toFixed(2)}</span>
            </div>
          {/each}
          {#if success.deliveryMethod !== 'pickup'}
            <div class="receipt-row bonus-row">
              <span>✨ Bonus sticker</span>
              <span>Free!</span>
            </div>
          {/if}
          <div class="receipt-row muted">
            <span>{success.deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}</span>
            <span>{success.shipping === 0 ? 'Free!' : `$${success.shipping.toFixed(2)}`}</span>
          </div>
        </div>
        <div class="receipt-address">
          {#if success.deliveryMethod === 'pickup'}
            <span class="receipt-address-label">Pickup</span>
            <span>We'll reach out to arrange a time!</span>
          {:else}
            <span class="receipt-address-label">Ships to</span>
            <span>{success.name}</span>
            <span>{success.address}</span>
          {/if}
        </div>
      </div>

      <a href="/" class="big-btn blue-btn">← Back to stickers</a>
    </div>
  </div>

{:else}
  <!-- ── Cart ── -->
  <div class="page max-w">
    <a href="/" class="back-link">← Keep shopping</a>

    <h1 class="cart-title">Your sticker stash</h1>
    <p class="cart-sub">
      {#if items.length === 0}
        It's a little empty in here…
      {:else}
        {@const count = items.reduce((s, i) => s + i.qty, 0)}
        {count} item{count !== 1 ? 's' : ''} {deliveryMethod === 'pickup' ? 'to be picked up' : 'ready to ship'}
      {/if}
    </p>

    {#if items.length === 0}
      <!-- Empty state -->
      <div class="empty-panel">
        <div class="empty-emoji">🤷</div>
        <h2 class="empty-title">No stickers yet!</h2>
        <p class="empty-sub">Pick some sheets and stick them everywhere.</p>
        <a href="/" class="big-btn blue-btn">Browse stickers</a>
      </div>
    {:else}
      <!-- Full state -->
      <div class="cart-grid">
        <!-- Items column -->
        <div class="items-col">
          {#each items as item (item.sheetId)}
            <div class="item-card">
              <div class="item-thumb-wrap" class:split={item.image2}>
                {#if item.image2}
                  <img src={item.image}  alt={item.name} class="item-thumb-half" />
                  <img src={item.image2} alt={item.name} class="item-thumb-half" />
                  {#if item.image3}
                    <img src={item.image3} alt={item.name} class="item-thumb-half" />
                  {/if}
                {:else}
                  <img
                    src={item.image}
                    alt={item.name}
                    class="item-thumb"
                    style="left:{item.side === 'left' ? '0' : item.side === 'right' ? '-100%' : '0'}; width:{item.side === 'full' ? '100%' : '200%'}"
                  />
                {/if}
              </div>
              <div class="item-info">
                <span class="item-name">{item.name}</span>
                {#if item.kind === 'pyo'}
                  <span class="item-kind">Pick your own</span>
                  {#if item.pickedSheets?.length || item.freeSheets?.length}
                    <span class="item-pyo-detail">
                      {[...(item.pickedSheets ?? []).map(s => s.name), ...(item.freeSheets ?? []).map(s => `${s.name} (free)`)].join(' · ')}
                    </span>
                  {/if}
                {:else}
                  <span class="item-kind">{item.kind === 'set' || item.kind === 'pair' ? 'Full set' : 'Single sheet'}</span>
                {/if}
                <div class="item-controls">
                  <div class="item-stepper">
                    <button
                      class="step-btn"
                      disabled={item.qty <= 1}
                      onclick={() => cart.setQty(item.sheetId, item.qty - 1)}
                    >−</button>
                    <span class="step-val">{item.qty}</span>
                    <button
                      class="step-btn"
                      disabled={item.qty >= 99}
                      onclick={() => cart.setQty(item.sheetId, item.qty + 1)}
                    >+</button>
                  </div>
                  <button class="remove-btn" onclick={() => cart.remove(item.sheetId)}>remove</button>
                </div>
              </div>
              <span class="item-total">${(item.price * item.qty).toFixed(2)}</span>
            </div>
          {/each}
        </div>

        <!-- Checkout column -->
        <div class="checkout-col">
          <div class="checkout-panel">
            <h2 class="checkout-heading">Place your order</h2>

            <!-- Delivery method -->
            <div class="delivery-section">
              <span class="field-label">How do you want it?</span>
              <div class="delivery-choice">
                <button
                  class="delivery-btn"
                  class:active={deliveryMethod === 'mail'}
                  onclick={() => deliveryMethod = 'mail'}
                  type="button"
                >
                  <span class="delivery-icon">📬</span>
                  <span class="delivery-name">Ship it to me</span>
                  <span class="delivery-sub">from $1 · +bonus sticker!</span>
                </button>
                <button
                  class="delivery-btn"
                  class:active={deliveryMethod === 'pickup'}
                  onclick={() => deliveryMethod = 'pickup'}
                  type="button"
                >
                  <span class="delivery-icon">🏃</span>
                  <span class="delivery-name">I'll pick it up</span>
                  <span class="delivery-sub">No shipping fee</span>
                </button>
              </div>
              {#if deliveryMethod === 'mail'}
                <div class="bonus-notice">✨ A free bonus sticker ships with every mail order!</div>
              {/if}
            </div>

            <div class="form-fields">
              <label class="field">
                <span class="field-label">Your name <span class="req">*</span></span>
                <input type="text" bind:value={name} placeholder="Jane Doe" required />
              </label>
              <label class="field">
                <span class="field-label">Email <span class="req">*</span></span>
                <input type="email" bind:value={email} placeholder="jane@example.com" required />
              </label>
              {#if deliveryMethod === 'mail'}
                <label class="field">
                  <span class="field-label">Mailing address <span class="req">*</span></span>
                  <textarea bind:value={address} placeholder="123 Sticker Lane, Springfield…" rows="3" required></textarea>
                </label>
              {/if}
            </div>

            <div class="order-summary">
              <div class="summary-row">
                <span>Stickers</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {#if deliveryMethod !== 'pickup'}
                <div class="summary-row bonus-summary-row">
                  <span>✨ Bonus sticker</span>
                  <span>Free!</span>
                </div>
              {/if}
              <div class="summary-row">
                <span>{deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}</span>
                <span>{shipping === 0 ? 'Free!' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div class="summary-row total-row">
                <span>Total</span>
                <span class="total-amt">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              class="big-btn place-btn"
              disabled={!canSubmit || submitting}
              onclick={placeOrder}
            >
              {submitting ? 'Placing order…' : 'Place order →'}
            </button>
            <p class="no-payment">We accept Apple Pay or cash</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .page { padding: 32px 0 64px; position: relative; z-index: 1; }

  @media (max-width: 600px) {
    .page { padding-inline: 20px; }
  }

  .back-link {
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    font-weight: 600;
    opacity: 0.6;
    transition: opacity 0.15s;
    display: inline-block;
    margin-bottom: 24px;
  }

  .back-link:hover { opacity: 1; }

  .cart-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: clamp(40px, 5vw, 64px);
    letter-spacing: -1px;
    margin-bottom: 6px;
  }

  .cart-sub {
    font-family: 'Caveat', cursive;
    font-size: 22px;
    opacity: 0.65;
    margin-bottom: 32px;
  }

  /* ── Empty state ── */
  .empty-panel {
    background: white;
    border-radius: 22px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 8px 0 var(--ink);
    padding: 56px 32px;
    text-align: center;
    max-width: 480px;
    margin: 0 auto;
  }

  .empty-emoji { font-size: 64px; margin-bottom: 16px; }
  .empty-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 32px;
    margin-bottom: 10px;
  }
  .empty-sub { font-family: 'Caveat', cursive; font-size: 20px; opacity: 0.65; margin-bottom: 28px; }

  /* ── Cart grid ── */
  .cart-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 32px;
    align-items: start;
  }

  @media (max-width: 820px) {
    .cart-grid { grid-template-columns: 1fr; }
  }

  /* ── Item cards ── */
  .items-col { display: flex; flex-direction: column; gap: 14px; }

  .item-card {
    background: white;
    border-radius: 16px;
    border: 2.5px solid var(--ink);
    display: grid;
    grid-template-columns: 80px 1fr auto;
    align-items: center;
    gap: 14px;
    overflow: hidden;
    padding-left: 12px;
  }

  .item-thumb-wrap {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    background: white;
    border-radius: 10px;
    margin: 10px 0;
  }

  .item-thumb-wrap.split {
    display: flex;
    gap: 2px;
  }

  .item-thumb-half {
    flex: 1;
    min-width: 0;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 6px;
  }

  .item-thumb {
    position: absolute;
    top: 0;
    height: 100%;
    max-width: none;
    object-fit: cover;
  }

  .item-info {
    padding: 12px 0;
    min-width: 0;
  }

  .item-name {
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    font-weight: 700;
    display: block;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-kind {
    font-size: 13px;
    opacity: 0.6;
    display: block;
    margin-bottom: 4px;
  }

  .item-pyo-detail {
    font-size: 12px;
    opacity: 0.6;
    display: block;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .item-controls { display: flex; align-items: center; gap: 10px; }

  .item-stepper {
    display: flex;
    align-items: center;
    border: 2px solid var(--ink);
    border-radius: 999px;
    overflow: hidden;
    background: var(--paper);
  }

  .step-btn {
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    color: var(--ink);
  }

  .step-btn:hover:not(:disabled) { background: var(--paper-2); }
  .step-btn:disabled { opacity: 0.35; cursor: default; }

  .step-val {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 16px;
    min-width: 26px;
    text-align: center;
  }

  .remove-btn {
    background: none;
    border: none;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--pink);
    cursor: pointer;
    text-decoration: underline;
  }

  .item-total {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 20px;
    padding-right: 16px;
  }

  /* ── Checkout panel ── */
  .checkout-col {
    position: sticky;
    top: 90px;
  }

  .checkout-panel {
    background: white;
    border-radius: 22px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 8px 0 var(--ink);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .checkout-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 26px;
    letter-spacing: -0.5px;
  }

  /* ── Delivery method ── */
  .delivery-section { display: flex; flex-direction: column; gap: 10px; }

  .delivery-choice {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .delivery-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 10px;
    border-radius: 14px;
    border: 2px solid var(--line);
    background: var(--paper);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    text-align: center;
  }

  .delivery-btn:hover { border-color: var(--ink); }

  .delivery-btn.active {
    border-color: var(--blue);
    background: #e8f7ff;
    box-shadow: 0 3px 0 var(--blue);
  }

  .delivery-icon { font-size: 28px; line-height: 1; }

  .delivery-name {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
  }

  .delivery-sub {
    font-family: 'Caveat', cursive;
    font-size: 13px;
    color: var(--ink);
    opacity: 0.65;
  }

  .bonus-notice {
    font-family: 'Caveat', cursive;
    font-size: 15px;
    font-weight: 700;
    background: var(--mint);
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    padding: 5px 14px;
    text-align: center;
    color: var(--ink);
  }

  /* ── Form fields ── */
  .form-fields { display: flex; flex-direction: column; gap: 14px; }

  .field { display: flex; flex-direction: column; gap: 5px; }

  .field-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
  }

  .req { color: var(--pink); }
  .opt { font-weight: 400; opacity: 0.6; font-size: 12px; }

  .field input,
  .field textarea {
    border: 2px solid var(--ink);
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 14px;
    background: var(--paper);
    outline: none;
    resize: vertical;
    transition: border-color 0.15s;
  }

  .field input:focus,
  .field textarea:focus { border-color: var(--blue); }

  /* ── Order summary ── */
  .order-summary {
    border-top: 2px dashed var(--line);
    padding-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
  }

  .bonus-summary-row {
    color: #2a9d5c;
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 14px;
  }

  .total-row {
    border-top: 1.5px solid var(--line);
    padding-top: 8px;
    margin-top: 4px;
    font-weight: 700;
  }

  .total-amt {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
  }

  /* ── Shared big buttons ── */
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
    width: 100%;
  }

  .big-btn:hover { transform: translateY(-2px); }

  .big-btn:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 var(--ink);
  }

  .big-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 3px 0 var(--ink);
  }

  .pink-btn { background: var(--pink); color: white; }
  .blue-btn { background: var(--blue); color: var(--ink); }

  .place-btn { font-size: 20px; padding: 14px 28px; background: var(--blue); color: var(--ink); }

  .no-payment {
    font-family: 'Caveat', cursive;
    font-size: 15px;
    opacity: 0.6;
    text-align: center;
    margin-top: -8px;
  }

  /* ── Success ── */
  .success-page {
    padding: 64px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  @media (max-width: 600px) {
    .success-page { padding-inline: 20px; }
  }

  .confetti-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 200;
    overflow: hidden;
  }

  .confetti-piece {
    position: absolute;
    top: -20px;
    animation: confetti-fall 3.5s ease-in forwards;
  }

  .success-card {
    background: white;
    border-radius: 22px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 8px 0 var(--ink);
    padding: 40px 36px;
    max-width: 640px;
    width: 100%;
    text-align: center;
    animation: spin-in 0.4s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .success-check {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--mint);
    border: 3px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-6deg);
    animation: pop 0.35s ease;
  }

  .success-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: clamp(32px, 5vw, 48px);
    letter-spacing: -1px;
  }

  .success-sub {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    opacity: 0.7;
  }

  .receipt {
    background: var(--paper-2);
    border-radius: 14px;
    border: 2px solid var(--line);
    padding: 16px;
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .receipt-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .receipt-id {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    opacity: 0.6;
  }

  .receipt-total {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
  }

  .receipt-items { display: flex; flex-direction: column; gap: 6px; }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }

  .receipt-row.muted { opacity: 0.6; }

  .receipt-row.bonus-row {
    color: #2a9d5c;
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
  }

  .receipt-address {
    border-top: 1px dashed var(--line);
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    opacity: 0.7;
  }

  .receipt-address-label {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 1;
    margin-bottom: 2px;
  }

  /* ── Payment callout on success screen ── */
  .pay-callout {
    background: var(--yellow);
    border: 2.5px solid var(--ink);
    border-radius: 18px;
    box-shadow: 0 5px 0 var(--ink);
    padding: 20px 22px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pay-callout-msg {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    color: var(--ink);
  }

  .pay-callout-contact {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    color: var(--ink);
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    padding: 4px 20px;
    display: inline-block;
    margin: 4px auto;
  }

  .pay-callout-note {
    font-family: 'Caveat', cursive;
    font-size: 15px;
    opacity: 0.75;
    margin: 0;
  }
</style>
