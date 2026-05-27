<script>
  import { onMount } from 'svelte';

  let { data } = $props();

  const stripePublicKey = data.stripePublicKey || '';
  const cart = data.cart || [];
  const formData = data.formData || {};
  const token = data.token || '';

  // Pre-fill from saved form data
  let name = $state(formData.name || '');
  let email = $state(formData.email || '');
  let address = $state(formData.address || '');
  let notes = $state(formData.notes || '');
  let deliveryMethod = $state(formData.deliveryMethod || 'mail');

  let subtotal = $derived(cart.reduce((s, i) => s + i.price * i.qty, 0));
  let shipping = $derived(cart.length > 0 && deliveryMethod === 'mail' ? 1 : 0);
  let total = $derived(subtotal + shipping);

  let prButtonEl = $state(null);
  let applePayAvailable = $state(false);
  let paymentRequest = $state(null);
  let submitting = $state(false);
  let success = $state(null);
  let stripeError = $state('');

  onMount(async () => {
    if (!stripePublicKey) return;
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(stripePublicKey);
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { label: 'Sticker Stop', amount: Math.round(total * 100) },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.on('paymentmethod', async (ev) => {
      submitting = true;
      stripeError = '';
      try {
        const res = await fetch('/api/checkout/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Math.round(total * 100) }),
        });
        const { clientSecret, error: piError } = await res.json();
        if (piError) { ev.complete('fail'); submitting = false; stripeError = piError; return; }

        const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
        );

        if (confirmError) {
          ev.complete('fail');
          stripeError = confirmError.message;
          submitting = false;
          return;
        }

        ev.complete('success');

        if (paymentIntent.status === 'requires_action') {
          const { error: actionErr } = await stripe.confirmCardPayment(clientSecret);
          if (actionErr) {
            stripeError = actionErr.message;
            submitting = false;
            return;
          }
        }

        await placeOrder({ stripePaymentIntentId: paymentIntent.id });
      } catch (err) {
        ev.complete('fail');
        stripeError = err.message;
        submitting = false;
      }
    });

    const canMake = await pr.canMakePayment();
    if (canMake?.applePay && prButtonEl) {
      const elements = stripe.elements();
      const prButton = elements.create('paymentRequestButton', {
        paymentRequest: pr,
        style: { paymentRequestButton: { theme: 'dark', height: '56px' } },
      });
      prButton.mount(prButtonEl);
      paymentRequest = pr;
      applePayAvailable = true;
    }
  });

  $effect(() => {
    if (paymentRequest) {
      paymentRequest.update({
        total: { label: 'Sticker Stop', amount: Math.round(total * 100) },
      });
    }
  });

  async function placeOrder(paymentInfo = {}) {
    submitting = true;
    stripeError = '';
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:    name.trim(),
          customerEmail:   email.trim(),
          customerAddress: deliveryMethod === 'mail' ? address.trim() : '',
          customerNotes:   notes.trim(),
          deliveryMethod,
          items: cart,
          subtotal,
          shipping,
          total,
          ...paymentInfo,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Order failed');

      // Mark the session as complete so the desktop page can detect it
      await fetch(`/api/checkout/session/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: resData.orderId }),
      });

      success = {
        orderId: resData.orderId,
        total,
        paid: !!paymentInfo.stripePaymentIntentId,
      };
    } catch (err) {
      stripeError = err.message;
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Checkout — Sticker Stop</title>
</svelte:head>

{#if data.alreadyComplete}
  <div class="page">
    <div class="done-card">
      <div class="done-icon">✓</div>
      <h1 class="done-title">Already paid!</h1>
      <p class="done-sub">This order has already been completed. Check your desktop for the confirmation.</p>
      <a href="/" class="btn pink-btn">Browse stickers</a>
    </div>
  </div>

{:else if success}
  <div class="page">
    <div class="done-card">
      <div class="done-icon">✓</div>
      <h1 class="done-title">Payment received!</h1>
      <p class="done-sub">
        {success.paid
          ? 'Your order is confirmed and your desktop should update momentarily.'
          : 'Order placed! Your desktop page will update shortly.'}
      </p>
      <div class="order-pill">Order #{success.orderId} · ${success.total.toFixed(2)}</div>
    </div>
  </div>

{:else}
  <div class="page">
    <div class="brand">
      <a href="/" class="brand-link">
        <img src="/favicon.svg" alt="Sticker Stop" class="brand-logo" />
        <span class="brand-name">Sticker Stop</span>
      </a>
    </div>

    <div class="checkout-card">
      <h1 class="heading">Pay with Apple Pay</h1>
      <p class="sub">Confirm your details, then tap the button to pay.</p>

      <!-- Cart summary -->
      <div class="cart-summary">
        {#each cart as item}
          <div class="cart-row">
            <span class="cart-name">{item.qty}× {item.name}</span>
            <span class="cart-price">${(item.price * item.qty).toFixed(2)}</span>
          </div>
        {/each}
        {#if deliveryMethod === 'mail'}
          <div class="cart-row muted">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free!' : `$${shipping.toFixed(2)}`}</span>
          </div>
        {/if}
        <div class="cart-row total-row">
          <span>Total</span>
          <span class="total-amt">${total.toFixed(2)}</span>
        </div>
      </div>

      <!-- Delivery method -->
      <div class="section">
        <label class="section-label">Delivery</label>
        <div class="delivery-choice">
          <button
            class="delivery-btn"
            class:active={deliveryMethod === 'mail'}
            onclick={() => deliveryMethod = 'mail'}
            type="button"
          >📬 Ship it</button>
          <button
            class="delivery-btn"
            class:active={deliveryMethod === 'pickup'}
            onclick={() => deliveryMethod = 'pickup'}
            type="button"
          >🏃 Pickup</button>
        </div>
      </div>

      <!-- Form fields -->
      <div class="fields">
        <label class="field">
          <span>Name <span class="req">*</span></span>
          <input type="text" bind:value={name} placeholder="Your name" autocomplete="name" />
        </label>
        <label class="field">
          <span>Email <span class="req">*</span></span>
          <input type="email" bind:value={email} placeholder="you@example.com" autocomplete="email" />
        </label>
        {#if deliveryMethod === 'mail'}
          <label class="field">
            <span>Address <span class="req">*</span></span>
            <textarea bind:value={address} placeholder="123 Sticker Lane…" rows="3" autocomplete="street-address"></textarea>
          </label>
        {/if}
        <label class="field">
          <span>Notes <span class="opt">(optional)</span></span>
          <textarea bind:value={notes} placeholder="Gift wrap? A drawing?" rows="2"></textarea>
        </label>
      </div>

      {#if stripeError}
        <p class="error-msg">{stripeError}</p>
      {/if}

      <!-- Apple Pay button -->
      {#if applePayAvailable}
        <div bind:this={prButtonEl} class="apple-pay-wrap"></div>
      {:else}
        <div bind:this={prButtonEl} style="display:none"></div>
        <div class="no-apple-pay">
          <p>Apple Pay isn't available on this device or browser.</p>
          <p class="no-apple-pay-hint">Please open this link in Safari on iPhone or iPad.</p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  :global(body) { background: var(--paper, #fffdf6); }

  .page {
    min-height: 100vh;
    padding: 24px 20px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .brand {
    width: 100%;
    max-width: 480px;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }

  .brand-logo {
    width: 36px;
    height: 36px;
  }

  .brand-name {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    color: var(--ink, #2a2238);
  }

  .checkout-card {
    background: white;
    border-radius: 22px;
    border: 2.5px solid var(--ink, #2a2238);
    box-shadow: 0 8px 0 var(--ink, #2a2238);
    padding: 28px 24px;
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 28px;
    letter-spacing: -0.5px;
    margin: 0;
  }

  .sub {
    font-family: 'Caveat', cursive;
    font-size: 18px;
    opacity: 0.65;
    margin: -10px 0 0;
  }

  /* Cart summary */
  .cart-summary {
    background: var(--paper-2, #f5f0e8);
    border-radius: 14px;
    border: 1.5px solid var(--line, #d8cfc0);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cart-row {
    display: flex;
    justify-content: space-between;
    font-size: 15px;
  }

  .cart-row.muted { opacity: 0.65; }

  .cart-row.total-row {
    border-top: 1.5px solid var(--line, #d8cfc0);
    padding-top: 8px;
    margin-top: 2px;
    font-weight: 700;
  }

  .cart-name { flex: 1; margin-right: 8px; }
  .total-amt { font-family: 'Bagel Fat One', sans-serif; font-size: 20px; }

  /* Delivery */
  .section { display: flex; flex-direction: column; gap: 8px; }

  .section-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
  }

  .delivery-choice {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .delivery-btn {
    padding: 12px;
    border-radius: 12px;
    border: 2px solid var(--line, #d8cfc0);
    background: var(--paper, #fffdf6);
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }

  .delivery-btn.active {
    border-color: var(--blue, #4fc3f7);
    background: #e8f7ff;
    box-shadow: 0 3px 0 var(--blue, #4fc3f7);
  }

  /* Fields */
  .fields { display: flex; flex-direction: column; gap: 12px; }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
  }

  .req { color: var(--pink, #ff6b9d); }
  .opt { font-weight: 400; opacity: 0.6; font-size: 12px; }

  .field input,
  .field textarea {
    border: 2px solid var(--ink, #2a2238);
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 16px; /* 16px prevents iOS zoom */
    background: var(--paper, #fffdf6);
    outline: none;
    resize: vertical;
    font-family: inherit;
    transition: border-color 0.15s;
  }

  .field input:focus,
  .field textarea:focus { border-color: var(--blue, #4fc3f7); }

  /* Apple Pay */
  .apple-pay-wrap { border-radius: 10px; overflow: hidden; }

  .no-apple-pay {
    background: var(--paper-2, #f5f0e8);
    border-radius: 14px;
    border: 2px dashed var(--line, #d8cfc0);
    padding: 24px;
    text-align: center;
  }

  .no-apple-pay p {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 6px;
  }

  .no-apple-pay-hint {
    font-family: 'Caveat', cursive !important;
    font-size: 15px !important;
    font-weight: 400 !important;
    opacity: 0.7;
  }

  .error-msg {
    background: #ffe4e4;
    border: 1.5px solid #ff6b6b;
    border-radius: 10px;
    padding: 10px 14px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    color: #c0392b;
  }

  /* Done / already-complete card */
  .done-card {
    background: white;
    border-radius: 22px;
    border: 2.5px solid var(--ink, #2a2238);
    box-shadow: 0 8px 0 var(--ink, #2a2238);
    padding: 48px 32px;
    max-width: 480px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .done-icon {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--mint, #6ddc8a);
    border: 3px solid var(--ink, #2a2238);
    box-shadow: 0 4px 0 var(--ink, #2a2238);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 700;
  }

  .done-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 36px;
    margin: 0;
  }

  .done-sub {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    opacity: 0.7;
    margin: 0;
  }

  .order-pill {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 700;
    background: var(--paper-2, #f5f0e8);
    border: 2px solid var(--line, #d8cfc0);
    border-radius: 999px;
    padding: 6px 20px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Fredoka', sans-serif;
    font-size: 17px;
    font-weight: 700;
    padding: 12px 28px;
    border-radius: 999px;
    border: 2.5px solid var(--ink, #2a2238);
    box-shadow: 0 5px 0 var(--ink, #2a2238);
    cursor: pointer;
    text-decoration: none;
    width: 100%;
    text-align: center;
  }

  .pink-btn { background: var(--pink, #ff6b9d); color: white; }
</style>
