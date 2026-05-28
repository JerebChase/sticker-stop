<script>
  let { data } = $props();

  let name = $state('');
  let email = $state('');
  let purpose = $state('');
  let theme = $state('');
  let description = $state('');
  let styles = $state([]);
  let qty = $state('25');
  let deadline = $state('');
  let budget = $state('');
  let rightsConfirmed = $state(false);
  let fileNames = $state([]);
  let isDragging = $state(false);
  let submitting = $state(false);
  let submitted = $state(false);
  let openFaq = $state(null);

  const themes = [
    { id: 'pets', label: 'Pets / animals', emoji: '🐶' },
    { id: 'family', label: 'Family portrait', emoji: '👨‍👩‍👧' },
    { id: 'brand', label: 'Brand / logo', emoji: '🏢' },
    { id: 'event', label: 'Event / party', emoji: '🎉' },
    { id: 'team', label: 'Team / mascot', emoji: '⚽' },
    { id: 'hobby', label: 'Hobby / craft', emoji: '🌸' },
    { id: 'fandom', label: 'Game / fandom', emoji: '🐉' },
    { id: 'weird', label: 'Something weird', emoji: '✨', special: true },
  ];

  const styleOptions = [
    'Cute / kawaii', 'Cartoony', 'Realistic', 'Hand-drawn doodle',
    'Bold & blocky', 'Watercolor', 'Retro 80s/90s', 'Pastel dreamy',
    'Match your house style',
  ];

  const qtyTiers = [
    { id: '10', sheets: '10 sheets', price: '$45', unit: '$4.50 each', label: 'Just for me' },
    { id: '25', sheets: '25 sheets', price: '$95', unit: '$3.80 each', label: 'Friends & family', fav: true },
    { id: '50', sheets: '50+', price: 'Quote', unit: "we'll calc it", label: 'Event / shop' },
  ];

  const faqs = [
    {
      q: 'How long does it take?',
      a: '2–3 weeks from approval. Rush turnaround is sometimes possible — mention it in your request!',
    },
    {
      q: 'How many revisions do I get?',
      a: '2 included free. Additional revisions are $20 each.',
    },
    {
      q: 'Can I see a mockup first?',
      a: 'Yes! Every quote comes with a sketch mockup. You only pay after you approve the design.',
    },
    {
      q: 'What about my photos?',
      a: 'Your photos are used as reference only. You keep all rights to your images.',
    },
  ];

  let canSubmit = $derived(
    name.trim() && email.trim() && description.trim() && rightsConfirmed
  );

  function toggleStyle(s) {
    if (styles.includes(s)) {
      styles = styles.filter(x => x !== s);
    } else {
      styles = [...styles, s];
    }
  }

  function handleFiles(files) {
    const names = Array.from(files).map(f => f.name);
    fileNames = [...new Set([...fileNames, ...names])];
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  }

  function handleFileInput(e) {
    if (e.target.files) handleFiles(e.target.files);
  }

  function removeFile(name) {
    fileNames = fileNames.filter(f => f !== name);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    submitting = true;
    try {
      const res = await fetch('/api/custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, purpose, theme, description, styles, qty, deadline, budget, fileNames }),
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

  function toggleFaq(i) {
    openFaq = openFaq === i ? null : i;
  }

  let estimateText = $derived(
    qty === '10' ? '$45' : qty === '25' ? '$95' : 'Quote'
  );
</script>

<svelte:head>
  <title>Custom Stickers — Sticker Stop</title>
</svelte:head>

<div class="page max-w">
  {#if submitted}
    <div class="success-wrap">
      <div class="success-card">
        <div class="success-icon">🎉</div>
        <h1 class="success-title">Request sent!</h1>
        <p class="success-sub">We'll review your request and send a quote + mockup within 1–3 days. Keep an eye on your inbox!</p>
        <a href="/" class="big-btn pink-btn">← Back to stickers</a>
      </div>
    </div>
  {:else}
    <!-- Hero -->
    <div class="hero">
      <div class="stamp">A whole sheet · just for you</div>
      <h1 class="hero-title">Your stuff, stickered.</h1>
      <p class="hero-sub">Bring your photos, art or a totally bonkers idea. We'll turn it into a sticker sheet.</p>
    </div>

    <!-- How it works ribbon -->
    <div class="how-ribbon">
      <div class="how-grid">
        <div class="how-step">
          <div class="how-num">1</div>
          <div class="how-text">
            <strong>Tell us your vision</strong>
            <span>Fill out the form below</span>
          </div>
        </div>
        <div class="how-step">
          <div class="how-num" style="background: var(--yellow); color: var(--ink);">2</div>
          <div class="how-text">
            <strong>Get a quote in 1–3 days</strong>
            <span>We email a price + mockup</span>
          </div>
        </div>
        <div class="how-step">
          <div class="how-num" style="background: var(--mint); color: var(--ink);">3</div>
          <div class="how-text">
            <strong>Approve & we make 'em</strong>
            <span>Pay only after you love it</span>
          </div>
        </div>
        <div class="how-step">
          <div class="how-num" style="background: var(--blue); color: var(--ink);">4</div>
          <div class="how-text">
            <strong>Stickers in the mail</strong>
            <span>Usually 2–3 weeks total</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="main-grid">
      <!-- Form -->
      <div class="form-col">
        <div class="form-card">
          <div class="washi washi-purple"></div>
          <h2 class="form-heading">Tell us about your dream sticker</h2>

          <div class="fields">
            <div class="field-row">
              <label class="field">
                <span class="field-label">Your name <span class="req">*</span></span>
                <input type="text" bind:value={name} placeholder="Pickle's owner" required />
              </label>
              <label class="field">
                <span class="field-label">Email <span class="req">*</span></span>
                <input type="email" bind:value={email} placeholder="you@example.com" required />
              </label>
            </div>

            <label class="field">
              <span class="field-label">Is this for…</span>
              <select bind:value={purpose}>
                <option value="">Choose one</option>
                <option value="personal">Personal / fun</option>
                <option value="gift">Gift for someone</option>
                <option value="business">My small business or shop</option>
                <option value="school">A school / team / club</option>
                <option value="event">Event or party favors</option>
                <option value="wedding">Wedding / save the date</option>
                <option value="other">Something else</option>
              </select>
            </label>

            <div class="field">
              <span class="field-label">Theme</span>
              <div class="theme-grid">
                {#each themes as t}
                  <label class="theme-card" class:selected={theme === t.id} class:special={t.special}>
                    <input type="radio" bind:group={theme} value={t.id} />
                    <span class="theme-emoji">{t.emoji}</span>
                    <span class="theme-label">{t.label}</span>
                  </label>
                {/each}
              </div>
            </div>

            <label class="field">
              <span class="field-label">Describe your dream sticker sheet <span class="req">*</span></span>
              <textarea
                bind:value={description}
                rows="5"
                placeholder="e.g. My dog Pickle as 8 different superheroes. Bright colors, sparkles, and a little donut version for good measure 🍩"
                required
              ></textarea>
            </label>

            <div class="field">
              <span class="field-label">Art style</span>
              <div class="style-grid">
                {#each styleOptions as s}
                  <label class="style-chip" class:checked={styles.includes(s)}>
                    <input type="checkbox" checked={styles.includes(s)} onchange={() => toggleStyle(s)} />
                    {s}
                  </label>
                {/each}
              </div>
            </div>

            <div class="field">
              <span class="field-label">Got reference pics?</span>
              <div
                class="drop-zone"
                class:dragging={isDragging}
                role="button"
                tabindex="0"
                ondragover={(e) => { e.preventDefault(); isDragging = true; }}
                ondragleave={() => { isDragging = false; }}
                ondrop={handleDrop}
                onclick={() => document.getElementById('file-input').click()}
                onkeydown={(e) => { if (e.key === 'Enter') document.getElementById('file-input').click(); }}
              >
                <span class="drop-icon">📎</span>
                <span class="drop-main">Drop your images here</span>
                <span class="drop-sub">click or drag · PNG, JPG, GIF</span>
                <input id="file-input" type="file" multiple accept="image/*" onchange={handleFileInput} style="display:none" />
              </div>
              {#if fileNames.length > 0}
                <div class="file-pills">
                  {#each fileNames as fname}
                    <span class="file-pill">
                      {fname}
                      <button type="button" onclick={() => removeFile(fname)} class="pill-remove">×</button>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="field">
              <span class="field-label">Quantity</span>
              <div class="qty-grid">
                {#each qtyTiers as tier}
                  <label class="qty-card" class:selected={qty === tier.id} class:fav={tier.fav}>
                    <input type="radio" bind:group={qty} value={tier.id} />
                    {#if tier.fav}<span class="fav-badge">FAVORITE</span>{/if}
                    <span class="qty-sheets">{tier.sheets}</span>
                    <span class="qty-price">{tier.price}</span>
                    <span class="qty-unit">{tier.unit}</span>
                    <span class="qty-label">{tier.label}</span>
                  </label>
                {/each}
              </div>
            </div>

            <div class="field-row">
              <label class="field">
                <span class="field-label">Deadline <span class="opt">(optional)</span></span>
                <input type="text" bind:value={deadline} placeholder="e.g. July 4th party!" />
              </label>
              <label class="field">
                <span class="field-label">Budget</span>
                <select bind:value={budget}>
                  <option value="">Choose one</option>
                  <option value="50-100">$50–$100</option>
                  <option value="100-250">$100–$250</option>
                  <option value="250-500">$250–$500</option>
                  <option value="500+">$500+</option>
                  <option value="unsure">Not sure — quote me</option>
                </select>
              </label>
            </div>

            <label class="rights-row">
              <input type="checkbox" bind:checked={rightsConfirmed} />
              <span>I confirm I have the rights to any photos / art / logos I uploaded. (Pinky promise!)</span>
            </label>
          </div>

          <div class="submit-row">
            <div class="estimate-block">
              <span class="estimate-price">Rough estimate {estimateText}+</span>
              <span class="estimate-note">final quote arrives by email · no commitment yet</span>
            </div>
            <button
              class="big-btn pink-btn"
              disabled={!canSubmit || submitting}
              onclick={handleSubmit}
            >
              {submitting ? 'Sending…' : 'Send my request →'}
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-heading">Why a bit more?</h3>
          <p class="sidebar-body">Custom sheets are hand-illustrated just for you — unlike our pre-made sets, these take real design time and love.</p>
          <div class="price-compare">
            <div class="compare-row">
              <span>Off-the-shelf sheet</span>
              <span class="compare-price">$2</span>
            </div>
            <div class="compare-row">
              <span>Custom sheet</span>
              <span class="compare-price">$4–5</span>
            </div>
            <div class="compare-row highlight-row">
              <span>Includes design + revisions</span>
              <span class="compare-price highlight-price">free</span>
            </div>
          </div>
          <p class="sidebar-caveat">"Trust us — when your dog Pickle is on a sticker, it'll feel worth it."</p>
        </div>

        <div class="sidebar-card">
          <h3 class="sidebar-heading">Past customs</h3>
          <div class="examples-grid">
            <div class="example-box" style="background: var(--pink)">Pickle as Batman</div>
            <div class="example-box" style="background: var(--mint)">Ridgewood Soccer '25</div>
            <div class="example-box" style="background: var(--blue)">Maya & Jay wedding</div>
            <div class="example-box" style="background: var(--orange)">D&D night crew</div>
            <div class="example-box" style="background: var(--purple); color: white">Aurora's 7th bday</div>
            <div class="example-box" style="background: var(--yellow)">Café Lulu menu</div>
          </div>
        </div>

        <div class="sidebar-card faq-card">
          <h3 class="sidebar-heading">FAQs</h3>
          {#each faqs as faq, i}
            <div class="faq-item">
              <button class="faq-q" onclick={() => toggleFaq(i)}>
                {faq.q}
                <span class="faq-arrow" class:open={openFaq === i}>▾</span>
              </button>
              {#if openFaq === i}
                <div class="faq-a">{faq.a}</div>
              {/if}
            </div>
          {/each}
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

  /* How it works */
  .how-ribbon {
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 18px;
    box-shadow: 0 6px 0 var(--ink);
    padding: 22px 28px;
    margin-bottom: 40px;
  }

  .how-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  @media (max-width: 700px) {
    .how-grid { grid-template-columns: 1fr 1fr; }
  }

  .how-step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .how-num {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--pink);
    color: white;
    border: 2.5px solid var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 18px;
    flex-shrink: 0;
  }

  .how-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .how-text strong {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.2;
  }

  .how-text span {
    font-family: 'Caveat', cursive;
    font-size: 14px;
    opacity: 0.6;
  }

  /* Main grid */
  .main-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
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

  .washi-purple {
    background: repeating-linear-gradient(
      45deg,
      var(--purple) 0,
      var(--purple) 6px,
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

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 560px) {
    .field-row { grid-template-columns: 1fr; }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .field-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
  }

  .req { color: var(--pink); }
  .opt { font-weight: 400; opacity: 0.6; font-size: 12px; }

  .field input,
  .field textarea,
  .field select {
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
  .field textarea:focus,
  .field select:focus { border-color: var(--blue); }

  /* Theme grid */
  .theme-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  @media (max-width: 560px) {
    .theme-grid { grid-template-columns: repeat(2, 1fr); }
  }

  .theme-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 6px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    text-align: center;
  }

  .theme-card input { display: none; }

  .theme-card:hover { border-color: var(--ink); }

  .theme-card.selected {
    border-color: var(--purple);
    background: #f0ebff;
    box-shadow: 0 3px 0 var(--purple);
  }

  .theme-card.special.selected {
    border-color: var(--pink);
    background: #fff0f6;
    box-shadow: 0 3px 0 var(--pink);
  }

  .theme-emoji { font-size: 24px; line-height: 1; }

  .theme-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--ink);
  }

  /* Style grid */
  .style-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .style-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    cursor: pointer;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
    transition: border-color 0.15s, background 0.15s;
  }

  .style-chip input { display: none; }
  .style-chip:hover { border-color: var(--ink); }
  .style-chip.checked { border-color: var(--purple); background: #f0ebff; }

  /* Drop zone */
  .drop-zone {
    border: 2px dashed var(--line);
    border-radius: 14px;
    padding: 28px;
    text-align: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: border-color 0.15s, background 0.15s;
    background: var(--paper);
  }

  .drop-zone:hover, .drop-zone.dragging {
    border-color: var(--blue);
    background: #eef9ff;
  }

  .drop-icon { font-size: 28px; }

  .drop-main {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 700;
  }

  .drop-sub {
    font-family: 'Caveat', cursive;
    font-size: 14px;
    opacity: 0.6;
  }

  .file-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .file-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--blue);
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    padding: 3px 10px 3px 12px;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 600;
  }

  .pill-remove {
    background: none;
    border: none;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 0 2px;
    color: var(--ink);
    font-weight: 700;
  }

  /* Qty grid */
  .qty-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  @media (max-width: 480px) {
    .qty-grid { grid-template-columns: 1fr; }
  }

  .qty-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 14px 8px;
    border: 2px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    cursor: pointer;
    text-align: center;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    position: relative;
  }

  .qty-card input { display: none; }
  .qty-card:hover { border-color: var(--ink); }
  .qty-card.selected { border-color: var(--pink); background: #fff0f6; box-shadow: 0 4px 0 var(--pink); }
  .qty-card.fav { border-color: var(--pink); }

  .fav-badge {
    position: absolute;
    top: -10px;
    background: var(--pink);
    color: white;
    font-family: 'Fredoka', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1.5px solid var(--ink);
  }

  .qty-sheets {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 18px;
  }

  .qty-price {
    font-family: 'Fredoka', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--pink);
  }

  .qty-unit {
    font-family: 'Caveat', cursive;
    font-size: 13px;
    opacity: 0.7;
  }

  .qty-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 600;
    opacity: 0.7;
  }

  /* Rights row */
  .rights-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    line-height: 1.4;
  }

  .rights-row input { margin-top: 2px; flex-shrink: 0; width: 16px; height: 16px; }

  /* Submit row */
  .submit-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: var(--ink);
    border-radius: 14px;
    padding: 18px 22px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  .estimate-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .estimate-price {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 24px;
    color: var(--yellow);
  }

  .estimate-note {
    font-family: 'Caveat', cursive;
    font-size: 14px;
    color: rgba(255,255,255,0.7);
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
    white-space: nowrap;
  }

  .big-btn:hover { transform: translateY(-2px); }
  .big-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--ink); }
  .big-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: 0 3px 0 var(--ink); }
  .pink-btn { background: var(--pink); color: white; }

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
    margin-bottom: 14px;
  }

  .sidebar-body {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.8;
    margin-bottom: 16px;
  }

  .price-compare {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }

  .compare-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--paper);
  }

  .compare-price { font-weight: 700; }

  .highlight-row {
    background: var(--yellow);
    border: 1.5px solid var(--ink);
  }

  .highlight-price { color: #1a5c2a; }

  .sidebar-caveat {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    opacity: 0.7;
    font-style: italic;
  }

  /* Examples grid */
  .examples-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .example-box {
    border-radius: 12px;
    border: 2px solid var(--ink);
    padding: 14px 10px;
    text-align: center;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
  }

  /* FAQ */
  .faq-card { padding: 22px; }

  .faq-item {
    border-bottom: 1.5px dashed var(--line);
    padding: 2px 0;
  }

  .faq-item:last-child { border-bottom: none; }

  .faq-q {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
    padding: 12px 0;
    text-align: left;
    gap: 8px;
  }

  .faq-arrow { transition: transform 0.2s; flex-shrink: 0; }
  .faq-arrow.open { transform: rotate(180deg); }

  .faq-a {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    opacity: 0.8;
    padding-bottom: 12px;
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
    font-size: 44px;
    letter-spacing: -1px;
  }

  .success-sub {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    opacity: 0.7;
    max-width: 380px;
  }
</style>
