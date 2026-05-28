<script>
  let { data } = $props();

  let mood = $state('🥳');
  let topics = $state([]);
  let name = $state('');
  let email = $state('');
  let message = $state('');
  let anonymous = $state(false);
  let submitting = $state(false);
  let submitted = $state(false);

  const moods = [
    { emoji: '😖', label: 'Rough', color: 'var(--orange)' },
    { emoji: '🤔', label: 'Meh', color: 'var(--yellow)' },
    { emoji: '😊', label: 'Good', color: 'var(--mint)' },
    { emoji: '🤩', label: 'Great', color: 'var(--blue)' },
    { emoji: '🥳', label: 'Stuck!', color: 'var(--pink)' },
  ];

  const topicOptions = [
    { id: 'sticker-ideas', label: 'Sticker ideas', emoji: '🎨' },
    { id: 'website', label: 'Website / shopping', emoji: '🛒' },
    { id: 'shipping', label: 'Shipping', emoji: '📦' },
    { id: 'pricing', label: 'Pricing', emoji: '💸' },
    { id: 'hi', label: 'Just saying hi', emoji: '👋' },
    { id: 'bug', label: 'Something broke', emoji: '🐛' },
  ];

let canSubmit = $derived(message.trim().length > 0);

  function toggleTopic(id) {
    if (topics.includes(id)) {
      topics = topics.filter(t => t !== id);
    } else {
      topics = [...topics, id];
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    submitting = true;
    const selectedMood = moods.find(m => m.emoji === mood);
    const topicLabels = topicOptions.filter(t => topics.includes(t.id)).map(t => t.label);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          moodLabel: selectedMood?.label || '',
          topics: topicLabels,
          name, email, message, anonymous,
          notificationEmails: data.notificationEmails,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed');
      submitted = true;
    } catch (err) {
      alert('Something went wrong: ' + err.message);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Feedback — Sticker Stop</title>
</svelte:head>

<div class="page max-w">
  {#if submitted}
    <div class="success-wrap">
      <div class="success-card">
        <div class="success-icon">💌</div>
        <h1 class="success-title">Sent!</h1>
        <p class="success-sub">Your feedback landed safely. A real human will read it — promise.</p>
        <a href="/" class="big-btn pink-btn">← Back to stickers</a>
      </div>
    </div>
  {:else}
    <!-- Hero -->
    <div class="hero">
      <div class="stamp">A little birdie · whispers welcome</div>
      <h1 class="hero-title">Tell us stuff!</h1>
      <p class="hero-sub">Compliments, complaints, weird ideas, sticker requests — we read every word.</p>
    </div>

    <div class="main-grid">
      <!-- Form -->
      <div class="form-col">
        <div class="form-card">
          <div class="washi washi-pink"></div>
          <h2 class="form-heading">Leave your mark</h2>

          <div class="fields">
            <!-- Mood selector -->
            <div class="field">
              <span class="field-label">How was it?</span>
              <div class="mood-row">
                {#each moods as m}
                  <label
                    class="mood-btn"
                    class:selected={mood === m.emoji}
                    style={mood === m.emoji ? `--mood-color: ${m.color}` : ''}
                  >
                    <input type="radio" bind:group={mood} value={m.emoji} />
                    <span class="mood-emoji">{m.emoji}</span>
                    <span class="mood-label">{m.label}</span>
                  </label>
                {/each}
              </div>
            </div>

            <!-- Topic chips -->
            <div class="field">
              <span class="field-label">Topic <span class="opt">(pick as many as you like)</span></span>
              <div class="topic-chips">
                {#each topicOptions as t}
                  <label class="topic-chip" class:checked={topics.includes(t.id)}>
                    <input type="checkbox" checked={topics.includes(t.id)} onchange={() => toggleTopic(t.id)} />
                    {t.emoji} {t.label}
                  </label>
                {/each}
              </div>
            </div>

            <!-- Name + Email row -->
            <div class="field-row">
              <label class="field">
                <span class="field-label">Name <span class="opt">(or a nickname)</span></span>
                <input type="text" bind:value={name} placeholder="Pickle's friend" />
              </label>
              <label class="field">
                <span class="field-label">Email <span class="opt">(if you want a reply)</span></span>
                <input type="email" bind:value={email} placeholder="you@example.com" />
              </label>
            </div>

            <!-- Message -->
            <label class="field">
              <span class="field-label">Message <span class="req">*</span></span>
              <textarea
                bind:value={message}
                rows="5"
                placeholder="Tell us anything! The more the merrier."
                required
              ></textarea>
            </label>

            <!-- Anonymous -->
            <label class="anon-row">
              <input type="checkbox" bind:checked={anonymous} />
              <span>Keep me anonymous — don't send a reply, just listen 🤫</span>
            </label>

            <div class="submit-col">
              <button
                class="big-btn pink-btn"
                disabled={!canSubmit || submitting}
                onclick={handleSubmit}
              >
                {submitting ? 'Sending…' : 'Send it off! 🚀'}
              </button>
              <p class="human-note">A real human reads these. Promise.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-card custom-card">
          <h3 class="sidebar-heading">Got a custom idea?</h3>
          <p class="sidebar-body">Want stickers of your pet, your logo, or something totally unhinged? We do custom sheets!</p>
          <a href="/custom" class="big-btn purple-btn">Request custom stickers →</a>
        </div>

      </div>
    </div>
  {/if}
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

  /* Hero */
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
    margin-bottom: 14px;
    line-height: 1.0;
  }

  .hero-sub {
    font-family: 'Caveat', cursive;
    font-size: 22px;
    opacity: 0.7;
    max-width: 520px;
    margin: 0 auto;
  }

  /* Main grid */
  .main-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 32px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .main-grid { grid-template-columns: 1fr; }
  }

  /* Form card */
  .form-card {
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 22px;
    box-shadow: 0 8px 0 var(--ink);
    padding: 28px;
    position: relative;
    overflow: hidden;
  }

  .washi {
    position: absolute;
    top: 0;
    left: -10px;
    width: 90px;
    height: 28px;
    transform: rotate(-8deg);
    transform-origin: top left;
    opacity: 0.85;
  }

  .washi-pink {
    background: repeating-linear-gradient(
      45deg,
      var(--pink) 0,
      var(--pink) 6px,
      rgba(255,255,255,0.5) 6px,
      rgba(255,255,255,0.5) 12px
    );
    border-bottom: 1.5px solid rgba(42,34,56,0.2);
  }

  .form-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 26px;
    letter-spacing: -0.5px;
    margin-bottom: 24px;
    padding-top: 12px;
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 560px) {
    .field-row { grid-template-columns: 1fr; }
  }

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

  /* Mood selector */
  .mood-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mood-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 14px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    flex: 1;
    min-width: 64px;
  }

  .mood-btn input { display: none; }
  .mood-btn:hover { border-color: var(--ink); }

  .mood-btn.selected {
    border-color: var(--mood-color, var(--pink));
    background: color-mix(in srgb, var(--mood-color, var(--pink)) 12%, white);
    box-shadow: 0 3px 0 var(--mood-color, var(--pink));
  }

  .mood-emoji { font-size: 28px; line-height: 1; }

  .mood-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    text-align: center;
  }

  /* Topic chips */
  .topic-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .topic-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    cursor: pointer;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
    transition: border-color 0.15s, background 0.15s;
  }

  .topic-chip input { display: none; }
  .topic-chip:hover { border-color: var(--ink); }
  .topic-chip.checked { border-color: var(--pink); background: #fff0f6; }

  /* Anonymous row */
  .anon-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    line-height: 1.4;
  }

  .anon-row input { margin-top: 2px; flex-shrink: 0; width: 16px; height: 16px; }

  /* Submit col */
  .submit-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .human-note {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    opacity: 0.6;
  }

  /* Buttons */
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
    text-align: center;
  }

  .big-btn:hover { transform: translateY(-2px); }
  .big-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--ink); }
  .big-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 0 3px 0 var(--ink); }
  .pink-btn { background: var(--pink); color: white; }
  .purple-btn { background: var(--purple); color: white; }

  /* Sidebar */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .sidebar-card {
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 22px;
    box-shadow: 0 8px 0 var(--ink);
    padding: 22px;
  }

  .sidebar-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    letter-spacing: -0.3px;
    margin-bottom: 12px;
  }

  .sidebar-body {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.8;
    margin-bottom: 16px;
  }

  /* Success */
  .success-wrap {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }

  .success-card {
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 22px;
    box-shadow: 0 8px 0 var(--ink);
    padding: 48px 36px;
    max-width: 520px;
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    animation: spin-in 0.4s ease;
  }

  .success-icon { font-size: 56px; }

  .success-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 48px;
    letter-spacing: -1px;
  }

  .success-sub {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    opacity: 0.7;
    max-width: 360px;
  }
</style>
