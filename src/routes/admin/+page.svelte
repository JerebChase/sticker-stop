<script>
  let password = $state('');
  let authed = $state(false);
  let authError = $state(false);
  let tab = $state('orders');

  // Orders
  let orders = $state([]);
  let ordersLoading = $state(false);

  // Settings
  let settings = $state({
    notification_emails: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_from: '',
    apple_pay_contact: '',
  });
  let smtpPass = $state('');
  let newPassword = $state('');
  let settingsSaved = $state(false);
  let settingsLoading = $state(false);
  let testEmailStatus = $state(null); // null | { ok, message }
  let testEmailLoading = $state(false);

  // Sticker Sets
  let sets = $state([]);
  let setsLoading = $state(false);
  let setsError = $state('');
  let editingId = $state(null); // id of set being edited, or 'new'
  let editForm = $state(null);  // the working copy of the form
  let uploadingImage = $state(false);

  function blankSet() {
    return {
      id: '', name: '', tagline: '', color: '#6ddc8a', image: '',
      sortOrder: 0, active: true,
      sheetA: { id: '', name: '', blurb: '', image: '' },
      sheetB: { id: '', name: '', blurb: '', image: '' },
    };
  }

  async function loadSets() {
    setsLoading = true;
    setsError = '';
    try {
      const res = await fetch('/api/admin/sticker-sets', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) setsError = data.error ?? 'Failed to load.';
      else sets = data;
    } catch { setsError = 'Could not reach server.'; }
    finally { setsLoading = false; }
  }

  function startEdit(set) {
    editingId = set.id;
    editForm = JSON.parse(JSON.stringify(set)); // deep clone
  }

  function startNew() {
    editingId = 'new';
    editForm = blankSet();
  }

  function cancelEdit() {
    editingId = null;
    editForm = null;
  }

  async function saveSet() {
    // For existing sets, keep sheet IDs in sync with set ID
    if (editingId !== 'new') {
      editForm.sheetA.id = `${editForm.id}-a`;
      editForm.sheetB.id = `${editForm.id}-b`;
    }
    // New sets: ID and sheet IDs are generated server-side

    const isNew = editingId === 'new';
    const url = isNew ? '/api/admin/sticker-sets' : `/api/admin/sticker-sets/${editingId}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      await loadSets();
      cancelEdit();
    } else {
      const d = await res.json();
      alert(d.error ?? 'Save failed.');
    }
  }

  // target: the object whose .image property should be updated (f, f.sheetA, or f.sheetB)
  // prefix: filename prefix for storage (e.g. 'critters', 'critters-a', 'critters-b')
  async function handleImageUpload(event, target, prefix) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadingImage = true;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('setId', prefix || 'new');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) target.image = data.url;
      else alert(data.error ?? 'Upload failed.');
    } finally {
      uploadingImage = false;
      event.target.value = '';
    }
  }

  async function deleteSet(id) {
    if (!confirm(`Delete "${id}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/sticker-sets/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    await loadSets();
  }

  async function login() {
    authError = false;
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) {
      authed = true;
      loadOrders();
      loadSettings();
      loadSets();
    } else {
      authError = true;
    }
  }

  let ordersError = $state('');

  async function loadOrders() {
    ordersLoading = true;
    ordersError = '';
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) { ordersError = data.error ?? 'Failed to load orders.'; }
      else { orders = data; }
    } catch {
      ordersError = 'Could not reach server.';
    } finally {
      ordersLoading = false;
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        const data = await res.json();
        settings = { ...settings, ...data };
      }
    } catch { /* settings will use defaults */ }
  }

  async function updateStatus(id, status) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ status }),
    });
    orders = orders.map(o => o.id === id ? { ...o, status } : o);
  }

  async function testEmail() {
    testEmailLoading = true;
    testEmailStatus = null;
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        testEmailStatus = { ok: true, message: `Test email sent to ${data.to}` };
      } else {
        testEmailStatus = { ok: false, message: data.error + (data.hint ? `\n\n💡 ${data.hint}` : '') };
      }
    } catch (err) {
      testEmailStatus = { ok: false, message: err.message };
    }
    testEmailLoading = false;
  }

  async function saveSettings() {
    settingsLoading = true;
    // Strip secret fields — only send them if the user filled them in
    const { resend_api_key, ...rest } = settings;
    const payload = { ...rest };
    if (resend_api_key) payload.resend_api_key = resend_api_key;
    if (smtpPass) payload.smtp_pass = smtpPass;
    if (newPassword) payload.admin_password = newPassword;
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify(payload),
    });
    if (newPassword) password = newPassword;
    newPassword = '';
    smtpPass = '';
    settings.resend_api_key = '';
    settingsSaved = true;
    setTimeout(() => { settingsSaved = false; }, 2500);
    settingsLoading = false;
  }

  let stats = $derived({
    total:     orders.length,
    newCount:  orders.filter(o => o.status === 'new').length,
    fulfilled: orders.filter(o => o.status === 'fulfilled').length,
    revenue:   orders.reduce((s, o) => s + parseFloat(o.total || 0), 0).toFixed(2),
  });
</script>

<svelte:head>
  <title>Admin — Sticker Stop</title>
</svelte:head>

<div class="admin-page max-w">
  {#if !authed}
    <!-- Login -->
    <div class="login-card">
      <div class="login-badge">S!</div>
      <h1 class="login-title">Admin Login</h1>
      <form onsubmit={(e) => { e.preventDefault(); login(); }} class="login-form">
        <input
          type="password"
          bind:value={password}
          placeholder="Enter admin password"
          class="login-input"
          class:error={authError}
          autofocus
        />
        {#if authError}
          <p class="login-error">Wrong password. Try again.</p>
        {/if}
        <button type="submit" class="login-btn">Sign in →</button>
      </form>
    </div>
  {:else}
    <!-- Dashboard -->
    <div class="dash-header">
      <h1 class="dash-title">Sticker Stop Admin</h1>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" class:active={tab === 'orders'}   onclick={() => tab = 'orders'}>Orders</button>
      <button class="tab" class:active={tab === 'sets'}     onclick={() => tab = 'sets'}>Sticker Sets</button>
      <button class="tab" class:active={tab === 'settings'} onclick={() => tab = 'settings'}>Settings</button>
    </div>

    {#if tab === 'orders'}
      <!-- Stats -->
      <div class="stats-row">
        {#each [
          { label: 'Total Orders', value: stats.total,     color: 'var(--blue)' },
          { label: 'New',          value: stats.newCount,  color: 'var(--yellow)' },
          { label: 'Fulfilled',    value: stats.fulfilled, color: 'var(--mint)' },
          { label: 'Revenue',      value: `$${stats.revenue}`, color: 'var(--pink)' },
        ] as s}
          <div class="stat-card" style="--sc:{s.color}">
            <span class="stat-val">{s.value}</span>
            <span class="stat-label">{s.label}</span>
          </div>
        {/each}
      </div>

      {#if ordersLoading}
        <p class="loading-msg">Loading orders…</p>
      {:else if ordersError}
        <div class="empty-orders" style="color:var(--pink)">
          ⚠️ {ordersError} — Set DATABASE_URL in your .env to connect Neon Postgres.
        </div>
      {:else if orders.length === 0}
        <div class="empty-orders">
          <p>No orders yet — share the shop link and watch them roll in!</p>
        </div>
      {:else}
        <div class="orders-table-wrap">
          <table class="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each orders as o}
                <tr class="order-row" class:row-new={o.status === 'new'}>
                  <td class="order-id">#{o.id}</td>
                  <td class="order-date">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td class="order-customer">
                    <span class="customer-name">{o.customer_name}</span>
                    {#if o.customer_email}
                      <a href="mailto:{o.customer_email}" class="customer-email">{o.customer_email}</a>
                    {/if}
                  </td>
                  <td class="order-items">
                    {#each o.items as item}
                      <div class="item-line">{item.qty}× {item.name}</div>
                    {/each}
                  </td>
                  <td class="order-total">${parseFloat(o.total).toFixed(2)}</td>
                  <td class="order-status">
                    <select
                      value={o.status}
                      onchange={(e) => updateStatus(o.id, e.target.value)}
                      class="status-select"
                      data-status={o.status}
                    >
                      <option value="new">New</option>
                      <option value="processing">Processing</option>
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

    {:else if tab === 'sets'}
      <!-- Sticker Sets -->
      <div class="sets-panel">
        <div class="sets-toolbar">
          <h2 class="sets-heading">Sticker Sets</h2>
          {#if editingId !== 'new'}
            <button class="add-set-btn" onclick={startNew}>+ Add set</button>
          {/if}
        </div>

        {#if setsLoading}
          <p class="loading-msg">Loading sets…</p>
        {:else if setsError}
          <p class="loading-msg" style="color:var(--pink)">⚠️ {setsError}</p>
        {:else}

          <!-- Add new set form -->
          {#if editingId === 'new'}
            <div class="set-edit-card">
              <h3 class="edit-card-title">New sticker set</h3>
              {@render setForm(editForm)}
              <div class="edit-actions">
                <button class="save-btn" onclick={saveSet}>Save set</button>
                <button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
              </div>
            </div>
          {/if}

          <!-- Existing sets list -->
          {#each sets as set}
            <div class="set-row">
              {#if editingId === set.id}
                <div class="set-edit-card">
                  <h3 class="edit-card-title">Editing: {set.name}</h3>
                  {@render setForm(editForm)}
                  <div class="edit-actions">
                    <button class="save-btn" onclick={saveSet}>Save changes</button>
                    <button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
                    <button class="delete-btn" onclick={() => deleteSet(set.id)}>Delete</button>
                  </div>
                </div>
              {:else}
                <div class="set-summary">
                  <div class="set-swatch" style="background:{set.color}"></div>
                  <div class="set-info">
                    <span class="set-name">{set.name}</span>
                    <span class="set-meta">{set.active ? 'Active' : 'Hidden'} · order {set.sortOrder}</span>
                  </div>
                  <div class="set-row-actions">
                    <button class="row-edit-btn" onclick={() => startEdit(set)}>Edit</button>
                  </div>
                </div>
              {/if}
            </div>
          {/each}

          {#if sets.length === 0 && editingId !== 'new'}
            <div class="empty-orders">No sticker sets yet — add one above.</div>
          {/if}
        {/if}
      </div>

    {:else}
      <!-- Settings -->
      <div class="settings-panel">
        <h2 class="settings-heading">Email Provider</h2>
        <label class="field">
          <span class="field-label">Resend API key</span>
          <input type="password" bind:value={settings.resend_api_key} placeholder="re_xxxxxxxxxxxxxxxxxxxx — leave blank to keep current" />
        </label>
        <label class="field">
          <span class="field-label">From address</span>
          <input type="text" bind:value={settings.smtp_from} placeholder="Sticker Stop <orders@yourdomain.com>" />
        </label>

        <h2 class="settings-heading">Notification Emails</h2>
        <label class="field">
          <span class="field-label">Send new order alerts to (comma-separated)</span>
          <input type="text" bind:value={settings.notification_emails} placeholder="you@example.com" />
        </label>

        <h2 class="settings-heading">Payment</h2>
        <label class="field">
          <span class="field-label">Apple Pay contact (phone number or Cashtag shown in confirmation email)</span>
          <input type="text" bind:value={settings.apple_pay_contact} placeholder="$stickerstop or +1 (555) 000-0000" />
        </label>

        <h2 class="settings-heading">Security</h2>
        <label class="field">
          <span class="field-label">New admin password</span>
          <input type="password" bind:value={newPassword} placeholder="Leave blank to keep current" />
        </label>

        <div class="settings-actions">
          <button class="save-btn" onclick={saveSettings} disabled={settingsLoading}>
            {settingsSaved ? 'Saved! ✓' : settingsLoading ? 'Saving…' : 'Save settings'}
          </button>
          <button class="test-email-btn" onclick={testEmail} disabled={testEmailLoading}>
            {testEmailLoading ? 'Sending…' : 'Send test email'}
          </button>
        </div>

        {#if testEmailStatus}
          <div class="test-email-result" class:ok={testEmailStatus.ok} class:fail={!testEmailStatus.ok}>
            {testEmailStatus.ok ? '✓ ' : '✗ '}{testEmailStatus.message}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

{#snippet setForm(f)}
  <div class="set-form">
    <div class="set-form-row">
      <label class="field">
        <span class="field-label">Sort order</span>
        <input type="number" bind:value={f.sortOrder} min="0" />
      </label>
      <label class="field">
        <span class="field-label">Accent color</span>
        <div class="color-select-row">
          {#each [
            { label: 'Mint',   value: '#6ddc8a' },
            { label: 'Yellow', value: '#ffd23f' },
            { label: 'Blue',   value: '#4ec3ff' },
            { label: 'Pink',   value: '#ff4d8d' },
            { label: 'Purple', value: '#8b5cf6' },
            { label: 'Orange', value: '#ff8a3d' },
          ] as c}
            <button
              type="button"
              class="color-swatch-btn"
              class:selected={f.color === c.value}
              style="background:{c.value}"
              title={c.label}
              onclick={() => f.color = c.value}
            ></button>
          {/each}
        </div>
      </label>
      <label class="field field-check">
        <span class="field-label">Active</span>
        <input type="checkbox" bind:checked={f.active} />
      </label>
    </div>

    <label class="field">
      <span class="field-label">Name</span>
      <input type="text" bind:value={f.name} placeholder="Cuddly Critters" />
    </label>
    <label class="field">
      <span class="field-label">Tagline</span>
      <input type="text" bind:value={f.tagline} placeholder="Tiny clay friends from forest & shore." />
    </label>
    <div class="field">
      <span class="field-label">Image</span>
      <div class="img-upload-wrap">
        {#if f.image}
          <img src={f.image} alt="preview" class="img-preview" />
        {/if}
        <div class="img-controls">
          <label class="upload-btn" class:uploading={uploadingImage}>
            {#if uploadingImage}Uploading…{:else if f.image}Change image{:else}Upload image{/if}
            <input
              type="file"
              accept="image/*"
              style="display:none"
              disabled={uploadingImage}
              onchange={(e) => handleImageUpload(e, f, f.id || 'new')}
            />
          </label>
          <input
            type="text"
            bind:value={f.image}
            placeholder="or paste a URL"
            class="url-fallback"
          />
        </div>
      </div>
    </div>

    <div class="sheet-cols">
      <div class="sheet-col">
        <h4 class="sheet-col-title">Sheet A</h4>
        <label class="field">
          <span class="field-label">Name</span>
          <input type="text" bind:value={f.sheetA.name} placeholder="Forest Friends" />
        </label>
        <div class="field">
          <span class="field-label">Image</span>
          <div class="img-upload-wrap">
            {#if f.sheetA.image}
              <img src={f.sheetA.image} alt="Sheet A preview" class="img-preview" />
            {/if}
            <div class="img-controls">
              <label class="upload-btn" class:uploading={uploadingImage}>
                {#if uploadingImage}Uploading…{:else if f.sheetA.image}Change{:else}Upload{/if}
                <input type="file" accept="image/*" style="display:none" disabled={uploadingImage}
                  onchange={(e) => handleImageUpload(e, f.sheetA, `${f.id}-a`)} />
              </label>
              <input type="text" bind:value={f.sheetA.image} placeholder="or paste URL" class="url-fallback" />
            </div>
          </div>
        </div>
        <label class="field">
          <span class="field-label">Blurb</span>
          <textarea bind:value={f.sheetA.blurb} rows="3" placeholder="Short description…"></textarea>
        </label>
      </div>
      <div class="sheet-col">
        <h4 class="sheet-col-title">Sheet B</h4>
        <label class="field">
          <span class="field-label">Name</span>
          <input type="text" bind:value={f.sheetB.name} placeholder="Beach Buddies" />
        </label>
        <div class="field">
          <span class="field-label">Image</span>
          <div class="img-upload-wrap">
            {#if f.sheetB.image}
              <img src={f.sheetB.image} alt="Sheet B preview" class="img-preview" />
            {/if}
            <div class="img-controls">
              <label class="upload-btn" class:uploading={uploadingImage}>
                {#if uploadingImage}Uploading…{:else if f.sheetB.image}Change{:else}Upload{/if}
                <input type="file" accept="image/*" style="display:none" disabled={uploadingImage}
                  onchange={(e) => handleImageUpload(e, f.sheetB, `${f.id}-b`)} />
              </label>
              <input type="text" bind:value={f.sheetB.image} placeholder="or paste URL" class="url-fallback" />
            </div>
          </div>
        </div>
        <label class="field">
          <span class="field-label">Blurb</span>
          <textarea bind:value={f.sheetB.blurb} rows="3" placeholder="Short description…"></textarea>
        </label>
      </div>
    </div>
  </div>
{/snippet}

<style>
  .admin-page {
    padding: 40px 0 80px;
    position: relative;
    z-index: 1;
  }

  /* ── Login ── */
  .login-card {
    max-width: 400px;
    margin: 80px auto 0;
    background: white;
    border-radius: 22px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 8px 0 var(--ink);
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    text-align: center;
  }

  .login-badge {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--blue);
    border: 2.5px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-8deg);
  }

  .login-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 28px;
  }

  .login-form { width: 100%; display: flex; flex-direction: column; gap: 12px; }

  .login-input {
    width: 100%;
    border: 2.5px solid var(--ink);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 15px;
    background: var(--paper);
    outline: none;
    font-family: 'Nunito', sans-serif;
  }

  .login-input.error { border-color: var(--pink); }

  .login-error {
    font-family: 'Caveat', cursive;
    font-size: 16px;
    color: var(--pink);
    text-align: center;
  }

  .login-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    background: var(--pink);
    color: white;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    padding: 12px 24px;
    box-shadow: 0 6px 0 var(--ink);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .login-btn:hover { transform: translateY(-2px); }
  .login-btn:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--ink); }

  /* ── Dashboard ── */
  .dash-header { margin-bottom: 24px; }

  .dash-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 36px;
    letter-spacing: -1px;
  }

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 28px;
    border-bottom: 2.5px solid var(--ink);
    padding-bottom: 0;
  }

  .tab {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 700;
    padding: 10px 24px;
    border-radius: 10px 10px 0 0;
    border: 2.5px solid var(--ink);
    border-bottom: none;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
    margin-bottom: -2.5px;
    transition: background 0.15s;
  }

  .tab.active { background: white; }

  /* ── Stats ── */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  @media (max-width: 700px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }

  .stat-card {
    background: white;
    border-radius: 14px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    padding: 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-val {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 28px;
    color: var(--sc);
  }

  .stat-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    opacity: 0.65;
  }

  /* ── Orders table ── */
  .loading-msg { font-family: 'Caveat', cursive; font-size: 18px; opacity: 0.6; padding: 24px 0; }

  .empty-orders {
    background: white;
    border-radius: 14px;
    border: 2.5px solid var(--ink);
    padding: 40px;
    text-align: center;
    font-family: 'Caveat', cursive;
    font-size: 20px;
    opacity: 0.65;
  }

  .orders-table-wrap {
    background: white;
    border-radius: 16px;
    border: 2.5px solid var(--ink);
    overflow-x: auto;
  }

  .orders-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .orders-table th {
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 700;
    text-align: left;
    padding: 14px 16px;
    border-bottom: 2px solid var(--ink);
    background: var(--paper-2);
    white-space: nowrap;
  }

  .orders-table td {
    padding: 12px 16px;
    border-bottom: 1.5px solid var(--line);
    vertical-align: top;
  }

  .order-row:last-child td { border-bottom: none; }

  .order-row.row-new { background: #fffbef; }

  .order-id { font-family: 'Bagel Fat One', sans-serif; font-size: 16px; }

  .order-date { white-space: nowrap; opacity: 0.7; }

  .customer-name { font-weight: 700; display: block; }
  .customer-email { font-size: 12px; opacity: 0.6; }
  .customer-email:hover { opacity: 1; text-decoration: underline; }

  .item-line { font-size: 13px; opacity: 0.8; }

  .order-total { font-family: 'Bagel Fat One', sans-serif; font-size: 16px; white-space: nowrap; }

  .status-select {
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 5px 8px;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: var(--paper);
    outline: none;
  }

  .status-select[data-status="new"]       { background: #fffbef; }
  .status-select[data-status="processing"]{ background: #e8f4ff; }
  .status-select[data-status="fulfilled"] { background: #efffee; }
  .status-select[data-status="cancelled"] { background: #fff0f0; }

  /* ── Settings ── */
  .settings-panel {
    background: white;
    border-radius: 18px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 6px 0 var(--ink);
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .settings-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 20px;
    margin-top: 8px;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 600px) { .settings-grid { grid-template-columns: 1fr; } }

  .span-2 { grid-column: span 2; }
  @media (max-width: 600px) { .span-2 { grid-column: span 1; } }

  .field { display: flex; flex-direction: column; gap: 5px; }

  .field-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 700;
  }

  .field input {
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 14px;
    background: var(--paper);
    outline: none;
    font-family: 'Nunito', sans-serif;
  }

  .field input:focus { border-color: var(--blue); }

  .save-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 17px;
    font-weight: 700;
    background: var(--mint);
    color: var(--ink);
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    padding: 11px 28px;
    box-shadow: 0 5px 0 var(--ink);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s, background 0.2s;
    align-self: flex-start;
  }

  .save-btn:hover { transform: translateY(-2px); }
  .save-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 var(--ink); }
  .save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .settings-actions {
    display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
  }
  .test-email-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 15px; font-weight: 600;
    background: white; color: var(--ink);
    border: 2.5px solid var(--ink); border-radius: 999px;
    padding: 10px 22px;
    box-shadow: 0 4px 0 var(--ink);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .test-email-btn:hover { transform: translateY(-2px); }
  .test-email-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--ink); }
  .test-email-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .test-email-result {
    margin-top: 12px;
    padding: 12px 16px;
    border-radius: 12px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px; font-weight: 600;
    white-space: pre-wrap;
    line-height: 1.5;
  }
  .test-email-result.ok   { background: #d1fae5; border: 2px solid #059669; color: #065f46; }
  .test-email-result.fail { background: #fee2e2; border: 2px solid #dc2626; color: #991b1b; }

  /* ── Sticker Sets ── */
  .sets-panel { display: flex; flex-direction: column; gap: 12px; }

  .sets-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .sets-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 24px;
  }

  .add-set-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 15px;
    background: var(--mint);
    color: var(--ink);
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    padding: 8px 20px;
    box-shadow: 0 4px 0 var(--ink);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .add-set-btn:hover { transform: translateY(-2px); }
  .add-set-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--ink); }

  /* Summary row (collapsed) */
  .set-row {
    background: white;
    border-radius: 14px;
    border: 2.5px solid var(--ink);
  }

  .set-summary {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
  }

  .set-swatch {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 2px solid var(--ink);
    flex-shrink: 0;
  }

  .set-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .set-name {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 16px;
  }

  .set-meta {
    font-size: 12px;
    opacity: 0.55;
    font-family: 'Nunito', sans-serif;
  }

  .set-row-actions { display: flex; gap: 8px; }

  .row-edit-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    padding: 6px 16px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-2);
    cursor: pointer;
    transition: background 0.15s;
  }
  .row-edit-btn:hover { background: var(--blue); }

  /* Expanded edit card */
  .set-edit-card {
    background: white;
    border-radius: 14px;
    border: 2.5px solid var(--ink);
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .edit-card-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 18px;
    margin-bottom: 4px;
  }

  /* Form layout */
  .set-form { display: flex; flex-direction: column; gap: 12px; }

  .set-form-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: end;
  }

  @media (max-width: 700px) {
    .set-form-row { grid-template-columns: 1fr 1fr; }
  }

  .color-select-row { display: flex; gap: 8px; flex-wrap: wrap; }

  .color-swatch-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    transition: transform 0.12s, border-color 0.12s;
    box-shadow: 0 2px 0 rgba(42,34,56,0.3);
    padding: 0;
  }
  .color-swatch-btn:hover { transform: scale(1.15); }
  .color-swatch-btn.selected {
    border-color: var(--ink);
    transform: scale(1.15);
    box-shadow: 0 0 0 2px white, 0 0 0 4px var(--ink);
  }

  .field-check { justify-content: flex-start; gap: 8px; }
  .field-check input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; accent-color: var(--mint); }

  .sheet-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 600px) { .sheet-cols { grid-template-columns: 1fr; } }

  .sheet-col { display: flex; flex-direction: column; gap: 10px; }

  .sheet-col-title {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 15px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--line);
  }

  .field textarea {
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 14px;
    background: var(--paper);
    outline: none;
    font-family: 'Nunito', sans-serif;
    resize: vertical;
  }
  .field textarea:focus { border-color: var(--blue); }

  .edit-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    padding-top: 4px;
  }

  .cancel-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 15px;
    padding: 9px 22px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-2);
    cursor: pointer;
    transition: transform 0.1s;
  }
  .cancel-btn:hover { transform: translateY(-1px); }

  .delete-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 15px;
    padding: 9px 22px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    background: #ffe0e0;
    color: #c0000a;
    cursor: pointer;
    margin-left: auto;
    transition: transform 0.1s;
  }
  .delete-btn:hover { transform: translateY(-1px); }

  /* ── Image upload ── */
  .img-upload-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .img-preview {
    width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: 10px;
    border: 2px solid var(--ink);
  }

  .img-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .upload-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    padding: 8px 18px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    background: var(--yellow);
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.1s, opacity 0.15s;
    box-shadow: 0 3px 0 var(--ink);
  }
  .upload-btn:hover { transform: translateY(-1px); }
  .upload-btn.uploading { opacity: 0.6; cursor: wait; }

  .url-fallback {
    flex: 1;
    min-width: 0;
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    background: var(--paper);
    outline: none;
    font-family: 'Nunito', sans-serif;
    color: var(--ink);
    opacity: 0.7;
  }
  .url-fallback:focus { opacity: 1; border-color: var(--blue); }
</style>
