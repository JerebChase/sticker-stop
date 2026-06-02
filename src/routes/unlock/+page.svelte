<script>
  import { page } from '$app/stores';

  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  let redirect = $derived($page.url.searchParams.get('r') || '/');

  async function unlock() {
    error = '';
    submitting = true;
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, redirect }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.redirect;
      } else {
        error = data.error ?? 'Wrong password.';
      }
    } catch {
      error = 'Could not reach server.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Sticker Stop</title>
</svelte:head>

<div class="page">
  <div class="card">
    <div class="badge">S!</div>
    <h1 class="title">Sticker Stop</h1>
    <p class="sub">Enter the password to continue</p>

    <form onsubmit={(e) => { e.preventDefault(); unlock(); }} class="form">
      <input
        type="password"
        bind:value={password}
        placeholder="Password"
        class="input"
        class:error={!!error}
        autofocus
      />
      {#if error}
        <p class="error-msg">{error}</p>
      {/if}
      <button type="submit" class="btn" disabled={submitting || !password}>
        {submitting ? 'Checking…' : 'Enter →'}
      </button>
    </form>
  </div>
</div>

<style>
  .page {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--paper);
  }

  .card {
    width: 100%;
    max-width: 380px;
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 24px;
    box-shadow: 0 8px 0 var(--ink);
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
  }

  @media (max-width: 600px) {
    .page { padding: 16px; }
    .card { padding: 24px 20px; gap: 6px; border-radius: 18px; }
    .badge { width: 48px; height: 48px; font-size: 22px; margin-bottom: 0; }
    .title { font-size: 26px; }
    .sub { font-size: 17px; margin-bottom: 0; }
    .input { padding: 10px 14px; }
    .btn { padding: 10px 24px; font-size: 16px; margin-top: 0; }
  }

  @media (max-height: 600px) {
    .page { padding: 8px 16px; }
    .card { padding: 16px 18px; gap: 4px; border-radius: 16px; }
    .badge { width: 40px; height: 40px; font-size: 18px; margin-bottom: 0; }
    .title { font-size: 22px; }
    .sub { font-size: 15px; margin-bottom: 0; }
    .input { padding: 8px 12px; }
    .btn { padding: 8px 20px; font-size: 15px; margin-top: 0; }
  }

  .badge {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--blue);
    border: 2.5px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 28px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-8deg);
    margin-bottom: 4px;
  }

  .title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 32px;
    letter-spacing: -0.5px;
    margin: 0;
  }

  .sub {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    opacity: 0.7;
    margin: 0 0 8px;
  }

  .form {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input {
    width: 100%;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    padding: 13px 16px;
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    background: var(--paper);
    outline: none;
    color: var(--ink);
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .input:focus { border-color: var(--blue); }
  .input.error { border-color: var(--pink); }

  .error-msg {
    font-family: 'Caveat', cursive;
    font-size: 17px;
    color: var(--pink);
    margin: 0;
    text-align: center;
  }

  .btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 18px;
    padding: 13px 28px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--yellow);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 5px 0 var(--ink);
    transition: transform 0.08s, box-shadow 0.08s;
    margin-top: 4px;
  }
  .btn:hover:not(:disabled) { transform: translateY(-2px); }
  .btn:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 2px 0 var(--ink); }
  .btn:disabled { opacity: 0.4; cursor: default; }
</style>
