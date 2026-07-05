<script>
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js/auto';

  let { data } = $props();

  let password = $state('');
  let authed = $state(data.authed);
  let authError = $state(false);
  let tab = $state('orders');

  // Orders
  let orders = $state([]);
  let ordersLoading = $state(false);

  // Settings
  let settings = $state({
    notification_emails: '',
    site_password: '',
  });
  let newPassword = $state('');
  let settingsSaved = $state(false);
  let settingsLoading = $state(false);
  let notifEmailInput = $state('');

  let notifEmails = $derived(
    settings.notification_emails.split(',').map(e => e.trim()).filter(Boolean)
  );

  function addNotifEmail() {
    const email = notifEmailInput.trim().toLowerCase();
    if (!email || notifEmails.includes(email)) { notifEmailInput = ''; return; }
    settings.notification_emails = [...notifEmails, email].join(',');
    notifEmailInput = '';
  }

  function removeNotifEmail(email) {
    settings.notification_emails = notifEmails.filter(e => e !== email).join(',');
  }

  // Sticker Sets
  let sets = $state([]);
  let setsLoading = $state(false);
  let setsError = $state('');
  let editingId = $state(null); // id of set being edited, or 'new'
  let editForm = $state(null);  // the working copy of the form
  let uploadingSheetIndex = $state(null);
  let dragIndex = $state(null);
  let dragTarget = $state(null);

  function blankSet() {
    return {
      id: '', name: '', tagline: '', color: '#6ddc8a', image: '',
      sortOrder: 0, status: 'active',
      sheets: [{ id: '', name: '', blurb: '', image: '' }],
      priceSheet: 2,
      priceSet: 2,
      setType: 'standard',
      pyoPickCount: 2,
      pyoFreeCount: 1,
      pyoPrice: 4,
    };
  }

  const SET_STATUS_LABELS = {
    active:        'Active',
    coming_soon:   'Coming Soon',
    retiring_soon: 'Retiring Soon',
    inactive:      'Inactive',
  };

  function onDragStart(i) { dragIndex = i; }
  function onDragOver(e, i) { e.preventDefault(); dragTarget = i; }
  function onDragLeave() { dragTarget = null; }
  function onDragEnd() { dragIndex = null; dragTarget = null; }

  function onDrop(i) {
    if (dragIndex === null || dragIndex === i) { dragIndex = null; dragTarget = null; return; }
    const next = [...sets];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    sets = next;
    dragIndex = null;
    dragTarget = null;
    saveOrder();
  }

  async function saveOrder() {
    await fetch('/api/admin/sticker-sets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(sets.map((s, i) => ({ id: s.id, sortOrder: i }))),
    });
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
    if (!Array.isArray(editForm.sheets)) editForm.sheets = [];
    if (editForm.priceSheet    === undefined) editForm.priceSheet    = 2;
    if (editForm.priceSet      === undefined) editForm.priceSet      = 2;
    if (!editForm.status)                     editForm.status        = 'active';
    if (!editForm.setType)                    editForm.setType       = 'standard';
    if (editForm.pyoPickCount  === undefined) editForm.pyoPickCount  = 2;
    if (editForm.pyoFreeCount  === undefined) editForm.pyoFreeCount  = 1;
    if (editForm.pyoPrice      === undefined) editForm.pyoPrice      = 4;
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
    // For existing sets, ensure every sheet has an ID.
    // Must be globally unique, not derived from array position — a position-based
    // id can collide with a sibling sheet's already-assigned id once sheets are
    // removed/added over time, merging two distinct sheets in analytics.
    if (editingId !== 'new') {
      const seenIds = new Set();
      editForm.sheets = editForm.sheets.map((s) => {
        const id = (!s.id || seenIds.has(s.id)) ? crypto.randomUUID() : s.id;
        seenIds.add(id);
        return { ...s, id };
      });
    }
    // New sets: sheet IDs are generated server-side

    const isNew = editingId === 'new';
    if (isNew) editForm.sortOrder = sets.length;
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

  function syncDefaultSetPrice() {
    const n = editForm.sheets.length;
    editForm.priceSet = parseFloat((editForm.priceSheet + (n - 1)).toFixed(2));
  }

  function addSheet() {
    editForm.sheets = [...editForm.sheets, { id: '', name: '', blurb: '', image: '' }];
    syncDefaultSetPrice();
  }

  function removeSheet(i) {
    editForm.sheets = editForm.sheets.filter((_, idx) => idx !== i);
    syncDefaultSetPrice();
  }

  async function handleImageUpload(event, target, prefix, sheetIndex) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadingSheetIndex = sheetIndex;
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
      uploadingSheetIndex = null;
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
      loadFeedback();
    } else {
      authError = true;
    }
  }

  let ordersError = $state('');
  const PAGE_SIZE = 20;
  let ordersPage = $state(0);
  let pagedOrders = $derived(orders.slice(ordersPage * PAGE_SIZE, (ordersPage + 1) * PAGE_SIZE));
  let totalPages = $derived(Math.max(1, Math.ceil(orders.length / PAGE_SIZE)));

  // Feedback
  let feedback = $state([]);
  let feedbackLoading = $state(false);
  let feedbackError = $state('');

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
        if (data.since_order_id) sinceOrderId = data.since_order_id;
      }
    } catch { /* settings will use defaults */ }
  }

  async function updateSinceOrder(id) {
    sinceOrderId = id;
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ since_order_id: id }),
    });
  }

  async function loadFeedback() {
    feedbackLoading = true;
    feedbackError = '';
    try {
      const res = await fetch('/api/admin/feedback', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) feedbackError = data.error ?? 'Failed to load feedback.';
      else feedback = data;
    } catch {
      feedbackError = 'Could not reach server.';
    } finally {
      feedbackLoading = false;
    }
  }

  let emailSentOrderId = $state(null);
  let reminderSentOrderId = $state(null);
  let reminderSendingId = $state(null);

  async function updateStatus(id, status) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ status }),
    });
    orders = orders.map(o => o.id === id ? { ...o, status } : o);
    const data = await res.json().catch(() => ({}));
    if (data.emailSent) {
      emailSentOrderId = id;
      setTimeout(() => { emailSentOrderId = null; }, 3500);
    }
  }

  async function togglePaid(id, paid) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ paid }),
    });
    orders = orders.map(o => o.id === id ? { ...o, paid } : o);
  }

  async function toggleApplePay(id, apple_pay) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ apple_pay }),
    });
    orders = orders.map(o => o.id === id ? { ...o, apple_pay } : o);
  }

  async function sendReminder(id) {
    reminderSendingId = id;
    try {
      await fetch(`/api/admin/orders/${id}/remind`, {
        method: 'POST',
        headers: { 'x-admin-password': password },
      });
      reminderSentOrderId = id;
      setTimeout(() => { reminderSentOrderId = null; }, 3500);
    } finally {
      reminderSendingId = null;
    }
  }

  // New in-person order modal
  let newOrderOpen = $state(false);
  let newOrderName = $state('');
  let newOrderEmail = $state('');
  let newOrderItems = $state([]);
  let newOrderPaid = $state(true);
  let newOrderApplePay = $state(false);
  let newOrderSaving = $state(false);
  let newOrderError = $state('');

  let newOrderSubtotal = $derived(
    newOrderItems.reduce((s, i) => s + i.price * i.qty, 0)
  );

  function openNewOrder() {
    newOrderName = '';
    newOrderEmail = '';
    newOrderItems = [];
    newOrderPaid = true;
    newOrderApplePay = false;
    newOrderError = '';
    newOrderOpen = true;
  }

  function closeNewOrder() {
    newOrderOpen = false;
  }

  function addNewOrderItem(set, sheet = null) {
    const isSet   = !sheet;
    const sheetId = isSet ? `${set.id}-set` : sheet.id;
    const existing = newOrderItems.find(i => i.sheetId === sheetId);
    if (existing) {
      newOrderItems = newOrderItems.map(i => i.sheetId === sheetId ? { ...i, qty: i.qty + 1 } : i);
    } else {
      newOrderItems = [...newOrderItems, {
        kind:    isSet ? 'set' : 'sheet',
        setId:   set.id,
        sheetId,
        name:    isSet ? `${set.name} — Full set` : `${set.name} — ${sheet.name}`,
        price:   isSet ? set.priceSet : set.priceSheet,
        qty:     1,
      }];
    }
  }

  function changeNewOrderQty(sheetId, delta) {
    newOrderItems = newOrderItems
      .map(i => i.sheetId === sheetId ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0);
  }

  async function submitNewOrder() {
    newOrderError = '';
    if (!newOrderName.trim()) { newOrderError = 'Customer name is required.'; return; }
    if (newOrderItems.length === 0) { newOrderError = 'Add at least one item.'; return; }
    newOrderSaving = true;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          customer_name:  newOrderName.trim(),
          customer_email: newOrderEmail.trim(),
          items:          newOrderItems.map(({ kind, setId, sheetId, name, price, qty }) => ({ kind, setId, sheetId, name, price, qty })),
          paid:           newOrderPaid,
          apple_pay:      newOrderApplePay,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        newOrderError = data.error ?? 'Failed to create order.';
      } else {
        newOrderOpen = false;
        loadOrders();
      }
    } catch {
      newOrderError = 'Could not reach server.';
    } finally {
      newOrderSaving = false;
    }
  }

  async function saveSettings() {
    settingsLoading = true;
    const payload = { ...settings };
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
    settingsSaved = true;
    setTimeout(() => { settingsSaved = false; }, 2500);
    settingsLoading = false;
  }

  function calcTotals(list) {
    const shopFund = list.reduce((s, o) => {
      const subtotal = parseFloat(o.subtotal || o.total || 0);
      const shipping = parseFloat(o.shipping || 0);
      return s + shipping + subtotal / 2;
    }, 0);
    const earnings = list.reduce((s, o) => {
      const subtotal = parseFloat(o.subtotal || o.total || 0);
      return s + subtotal / 2;
    }, 0);
    return { shopFund: shopFund.toFixed(2), earnings: earnings.toFixed(2) };
  }

  let stats = $derived.by(() => {
    const active = orders.filter(o => o.status !== 'canceled' && o.status !== 'cancelled');
    const { shopFund, earnings } = calcTotals(active);
    const paidOrders    = active.filter(o => o.paid);
    const applePayTotal = paidOrders.filter(o => o.apple_pay).reduce((s, o) => s + parseFloat(o.total || 0), 0).toFixed(2);
    const cashTotal     = paidOrders.filter(o => !o.apple_pay).reduce((s, o) => s + parseFloat(o.total || 0), 0).toFixed(2);
    return {
      total:         orders.length,
      newCount:      orders.filter(o => o.status === 'new').length,
      fulfilled:     orders.filter(o => o.status === 'fulfilled').length,
      shopFund,
      earnings,
      applePayTotal,
      cashTotal,
    };
  });

  let sinceOrderId = $state('');

  let statsSince = $derived.by(() => {
    if (!sinceOrderId) return null;
    const selected = orders.find(o => String(o.id) === String(sinceOrderId));
    if (!selected) return null;
    const cutoff = new Date(selected.created_at).getTime();
    const active = orders.filter(o =>
      o.status !== 'canceled' && o.status !== 'cancelled' &&
      new Date(o.created_at).getTime() >= cutoff
    );
    const { shopFund, earnings } = calcTotals(active);
    return { count: active.length, shopFund, earnings };
  });

  let analytics = $derived.by(() => {
    const active    = orders.filter(o => o.status !== 'canceled' && o.status !== 'cancelled');
    const setLookup = new Map(sets.map(s => [s.id, s]));
    const sheetMap  = new Map();
    const setMap    = new Map();

    for (const order of active) {
      for (const item of (order.items ?? [])) {
        const qty = item.qty ?? 1;
        if (item.kind === 'sheet') {
          const key = item.sheetId || item.name;
          const existing = sheetMap.get(key);
          if (existing) existing.qty += qty;
          else sheetMap.set(key, { name: item.name, qty });
        } else if (item.kind === 'set') {
          // Tally the full set
          const setKey = item.setId || item.name;
          const existingSet = setMap.get(setKey);
          if (existingSet) existingSet.qty += qty;
          else setMap.set(setKey, { name: item.name, qty });

          // Also credit each individual sheet that was in the set
          const setData = setLookup.get(item.setId);
          if (setData?.sheets) {
            for (const sheet of setData.sheets) {
              const sheetName = `${setData.name} — ${sheet.name}`;
              const existing  = sheetMap.get(sheet.id);
              if (existing) existing.qty += qty;
              else sheetMap.set(sheet.id, { name: sheetName, qty });
            }
          }
        }
      }
    }

    const sheetRankings = [...sheetMap.values()].sort((a, b) => b.qty - a.qty);
    const setRankings   = [...setMap.values()].sort((a, b) => b.qty - a.qty);

    const shipped   = active.filter(o => o.delivery_method !== 'pickup' && o.delivery_method !== 'in_person').length;
    const pickup    = active.filter(o => o.delivery_method === 'pickup').length;
    const inPerson  = active.filter(o => o.delivery_method === 'in_person').length;
    const deliveryTotal = shipped + pickup + inPerson || 1;

    const totalSheetsSold = active.reduce((sum, o) =>
      sum + (o.items ?? []).reduce((s, i) => {
        if (i.kind === 'sheet') return s + (i.qty ?? 1);
        if (i.kind === 'set') {
          const sheetCount = setLookup.get(i.setId)?.sheets?.length ?? 0;
          return s + sheetCount * (i.qty ?? 1);
        }
        return s;
      }, 0), 0);
    const totalSetsSold = active.reduce((sum, o) =>
      sum + (o.items ?? []).filter(i => i.kind === 'set').reduce((s, i) => s + (i.qty ?? 1), 0), 0);

    return {
      sheets:          sheetRankings,
      sets:            setRankings,
      maxSheet:        sheetRankings[0]?.qty || 1,
      maxSet:          setRankings[0]?.qty   || 1,
      shipped,
      pickup,
      inPerson,
      deliveryTotal,
      totalSheetsSold,
      totalSetsSold,
    };
  });

  // Purchase history chart — pick a set, see each of its sheets' qty sold per day, stacked
  let historySelection = $state('');

  let historySeries = $derived.by(() => {
    if (!historySelection) return null;
    const setData = sets.find(s => s.id === historySelection);
    if (!setData) return null;
    const sheets = setData.sheets ?? [];

    const active        = orders.filter(o => o.status !== 'canceled' && o.status !== 'cancelled');
    const dayQtyBySheet  = new Map(sheets.map(sh => [sh.id, new Map()]));
    const allDays        = new Set();

    for (const order of active) {
      const day = new Date(order.created_at).toISOString().slice(0, 10);
      for (const item of (order.items ?? [])) {
        if (item.kind === 'sheet' && dayQtyBySheet.has(item.sheetId)) {
          const m = dayQtyBySheet.get(item.sheetId);
          m.set(day, (m.get(day) ?? 0) + (item.qty ?? 1));
          allDays.add(day);
        } else if (item.kind === 'set' && item.setId === historySelection) {
          // a full-set purchase credits every one of the set's current sheets
          for (const sh of sheets) {
            const m = dayQtyBySheet.get(sh.id);
            m.set(day, (m.get(day) ?? 0) + (item.qty ?? 1));
          }
          allDays.add(day);
        }
      }
    }

    const total = [...dayQtyBySheet.values()]
      .reduce((sum, m) => sum + [...m.values()].reduce((a, b) => a + b, 0), 0);
    if (allDays.size === 0) return { days: [], sheets, dayQtyBySheet, total };

    const sortedDays = [...allDays].sort();
    const last = new Date(sortedDays[sortedDays.length - 1]);
    const days = [];
    for (const d = new Date(sortedDays[0]); d <= last; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
    }

    return { days, sheets, dayQtyBySheet, total };
  });

  let historyCanvasEl = $state(null);
  let historyChart = null; // Chart.js instance — not reactive state

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  const HISTORY_PALETTE = ['--pink', '--blue', '--mint', '--orange', '--purple', '--yellow'];

  $effect(() => {
    const canvas = historyCanvasEl;
    const series = historySeries;
    if (!canvas || !series || series.days.length === 0) return;

    const ink = cssVar('--ink');
    const grid = cssVar('--line');
    const palette = HISTORY_PALETTE.map(cssVar);

    const datasets = series.sheets.map((sh, i) => ({
      label: sh.name,
      data: series.days.map(d => series.dayQtyBySheet.get(sh.id)?.get(d.key) ?? 0),
      backgroundColor: palette[i % palette.length],
      borderColor: ink,
      borderWidth: 1.5,
      borderRadius: 4,
      maxBarThickness: 30,
      stack: 'sheets',
    }));

    historyChart = new Chart(canvas, {
      type: 'bar',
      data: { labels: series.days.map(d => d.label), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Fredoka', size: 11 }, color: ink, boxWidth: 14, padding: 12 },
          },
          tooltip: {
            backgroundColor: ink,
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: 'Fredoka', size: 13 },
            bodyFont: { family: 'Fredoka', size: 13 },
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} sold` },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { font: { family: 'Fredoka', size: 11 }, color: ink, maxRotation: 0, autoSkipPadding: 14 },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0, font: { family: 'Fredoka', size: 11 }, color: ink },
            grid: { color: grid },
          },
        },
      },
    });

    return () => {
      historyChart.destroy();
      historyChart = null;
    };
  });

  const TAB_LABELS = { orders: 'Orders', sets: 'Sticker Sets', analytics: 'Analytics', backgrounds: 'Backgrounds', settings: 'Settings', feedback: 'Feedback' };
  let tabMenuOpen = $state(false);

  function switchTab(t) {
    tab = t;
    tabMenuOpen = false;
  }

  // Backgrounds
  let bgImages = $state([]);
  let bgLoading = $state(false);
  let bgSelectedCatId = $state(null);
  let bgNewImgName = $state('');
  let bgImgUploading = $state(false);
  let bgImgDeleting = $state(null);

  let bgSelectedCat = $derived.by(() => {
    if (!bgSelectedCatId) return null;
    const set = sets.find(s => s.id === bgSelectedCatId);
    if (set) return { id: set.id, label: set.name, color: set.color };
    for (const s of sets) {
      const sheet = s.sheets?.find(sh => sh.id === bgSelectedCatId);
      if (sheet) return { id: sheet.id, label: `${s.name} — ${sheet.name}`, color: s.color };
    }
    return null;
  });

  let bgSelectedImages = $derived(bgImages.filter(img => img.category_id === bgSelectedCatId));

  let bgEditingImgId = $state(null);
  let bgEditingImgName = $state('');

  function startEditImgName(img) {
    bgEditingImgId = img.id;
    bgEditingImgName = img.name;
  }

  function cancelEditImgName() {
    bgEditingImgId = null;
    bgEditingImgName = '';
  }

  async function saveImgName(id) {
    if (!bgEditingImgName.trim()) return;
    await fetch(`/api/admin/backgrounds/images/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ name: bgEditingImgName }),
    });
    bgEditingImgId = null;
    bgEditingImgName = '';
    await loadBgImages();
  }

  async function loadBgImages() {
    bgLoading = true;
    try {
      const res = await fetch('/api/admin/backgrounds/images', {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) bgImages = await res.json();
    } finally {
      bgLoading = false;
    }
  }

  async function uploadBgImage(event) {
    if (!bgSelectedCatId || !bgSelectedCat) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const name = bgNewImgName.trim() || file.name.replace(/\.[^.]+$/, '');
    bgImgUploading = true;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('setId', `bg-${bgSelectedCatId}`);
      const upRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: fd,
      });
      const upData = await upRes.json();
      if (!upRes.ok) { alert(upData.error ?? 'Upload failed.'); return; }

      await fetch('/api/admin/backgrounds/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          category_id: bgSelectedCatId,
          category_label: bgSelectedCat.label,
          name,
          file: upData.url,
        }),
      });
      bgNewImgName = '';
      await loadBgImages();
    } finally {
      bgImgUploading = false;
      event.target.value = '';
    }
  }

  async function deleteBgImage(id) {
    bgImgDeleting = id;
    try {
      await fetch(`/api/admin/backgrounds/images/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      await loadBgImages();
    } finally {
      bgImgDeleting = null;
    }
  }

  // Announcement modal
  let announcementOpen = $state(false);
  let announcementSubject = $state('');
  let announcementBody = $state('');
  let announcementImageUrl = $state('');
  let announcementVideoUrl = $state('');
  let announcementRecipients = $state([]);
  let announcementNewEmail = $state('');
  let announcementSending = $state(false);
  let announcementSent = $state(false);
  let announcementError = $state('');
  let announcementResults = $state(null);
  let announcementImageUploading = $state(false);

  function openAnnouncement() {
    const emails = [...new Set(
      orders.map(o => o.customer_email).filter(Boolean)
    )].sort();
    announcementRecipients = emails;
    announcementSubject = '';
    announcementBody = '';
    announcementImageUrl = '';
    announcementVideoUrl = '';
    announcementNewEmail = '';
    announcementSent = false;
    announcementError = '';
    announcementResults = null;
    announcementImageUploading = false;
    announcementOpen = true;
  }

  async function handleAnnouncementImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    announcementImageUploading = true;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('setId', 'announcement');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) announcementImageUrl = data.url;
      else alert(data.error ?? 'Upload failed.');
    } finally {
      announcementImageUploading = false;
      event.target.value = '';
    }
  }

  function closeAnnouncement() {
    announcementOpen = false;
  }

  function removeRecipient(email) {
    announcementRecipients = announcementRecipients.filter(e => e !== email);
  }

  function addRecipient() {
    const email = announcementNewEmail.trim().toLowerCase();
    if (!email || announcementRecipients.includes(email)) {
      announcementNewEmail = '';
      return;
    }
    announcementRecipients = [...announcementRecipients, email].sort();
    announcementNewEmail = '';
  }

  async function sendAnnouncement() {
    announcementError = '';
    announcementSending = true;
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          subject: announcementSubject,
          body: announcementBody,
          imageUrl: announcementImageUrl || null,
          videoUrl: announcementVideoUrl || null,
          recipients: announcementRecipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        announcementError = data.error ?? 'Failed to send.';
      } else {
        announcementSent = true;
        announcementResults = data;
      }
    } catch {
      announcementError = 'Could not reach server.';
    } finally {
      announcementSending = false;
    }
  }

  onMount(() => {
    if (authed) {
      loadOrders();
      loadSettings();
      loadSets();
      loadFeedback();
      loadBgImages();
    }
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
      <h1 class="dash-title">Admin</h1>
      <button class="announcement-btn" onclick={openAnnouncement}>
        ✉️ Send Announcement
      </button>
    </div>

    <!-- Tabs (desktop) -->
    <div class="tabs tabs-desktop">
      <button class="tab" class:active={tab === 'orders'}   onclick={() => tab = 'orders'}>Orders</button>
      <button class="tab" class:active={tab === 'sets'}      onclick={() => tab = 'sets'}>Sticker Sets</button>
      <button class="tab" class:active={tab === 'analytics'}    onclick={() => tab = 'analytics'}>Analytics</button>
      <button class="tab" class:active={tab === 'backgrounds'}  onclick={() => { tab = 'backgrounds'; loadBgImages(); }}>Backgrounds</button>
      <button class="tab" class:active={tab === 'settings'}     onclick={() => tab = 'settings'}>Settings</button>
      <button class="tab" class:active={tab === 'feedback'}  onclick={() => tab = 'feedback'}>Feedback</button>
    </div>

    <!-- Tab picker (mobile) -->
    <div class="tabs-mobile">
      <button class="tab-picker-btn" onclick={() => tabMenuOpen = !tabMenuOpen}>
        <span class="tab-picker-label">{TAB_LABELS[tab]}</span>
        <svg class="tab-picker-chevron" class:open={tabMenuOpen} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {#if tabMenuOpen}
        <div class="tab-dropdown" role="menu">
          {#each Object.entries(TAB_LABELS) as [key, label]}
            <button
              class="tab-option"
              class:active={tab === key}
              onclick={() => switchTab(key)}
              role="menuitem"
            >
              {label}
              {#if tab === key}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l5 5L20 7"/>
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if tab === 'orders'}
      <!-- Toolbar -->
      <div class="orders-toolbar">
        <button class="new-order-btn" onclick={openNewOrder}>🧾 New In-Person Order</button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        {#each [
          { label: 'Total Orders', value: stats.total,                color: 'var(--blue)' },
          { label: 'New',          value: stats.newCount,              color: 'var(--yellow)' },
          { label: 'Fulfilled',    value: stats.fulfilled,             color: 'var(--mint)' },
          { label: 'Shop Fund',    value: `$${stats.shopFund}`,       color: 'var(--pink)' },
          { label: 'Earnings',     value: `$${stats.earnings}`,       color: '#a78bfa' },
          { label: ' Apple Pay',  value: `$${stats.applePayTotal}`,  color: 'var(--ink)' },
          { label: ' Cash',       value: `$${stats.cashTotal}`,      color: 'var(--mint)' },
        ] as s}
          <div class="stat-card" style="--sc:{s.color}">
            <span class="stat-val">{s.value}</span>
            <span class="stat-label">{s.label}</span>
          </div>
        {/each}
      </div>

      <!-- Totals since a given order -->
      <div class="since-panel">
        <label class="since-row" for="since-select">
          <span class="since-label">📈 Totals since order</span>
          <select
            id="since-select"
            class="since-select"
            value={sinceOrderId}
            onchange={(e) => updateSinceOrder(e.target.value)}
          >
            <option value="">— Select a starting order —</option>
            {#each orders as o}
              <option value={o.id}>#{o.id} · {new Date(o.created_at).toLocaleDateString()} · {o.customer_name}</option>
            {/each}
          </select>
        </label>
        {#if statsSince}
          <div class="stats-row since-stats-row">
            <div class="stat-card" style="--sc:var(--pink)">
              <span class="stat-val">${statsSince.shopFund}</span>
              <span class="stat-label">Shop Fund Since</span>
            </div>
            <div class="stat-card" style="--sc:#a78bfa">
              <span class="stat-val">${statsSince.earnings}</span>
              <span class="stat-label">Earnings Since</span>
            </div>
            <div class="stat-card" style="--sc:var(--blue)">
              <span class="stat-val">{statsSince.count}</span>
              <span class="stat-label">Orders Since</span>
            </div>
          </div>
        {/if}
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
                <th>Paid</th>
                <th>Apple Pay</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each pagedOrders as o}
                <tr class="order-row" class:row-new={o.status === 'new'}>
                  <td class="order-id">#{o.id}</td>
                  <td class="order-date">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td class="order-customer">
                    <span class="customer-name">{o.customer_name}</span>
                    {#if o.customer_email}
                      <a href="mailto:{o.customer_email}" class="customer-email">{o.customer_email}</a>
                    {/if}
                    <span class="delivery-badge"
                      class:pickup-badge={o.delivery_method === 'pickup'}
                      class:person-badge={o.delivery_method === 'in_person'}
                      class:ship-badge={o.delivery_method !== 'pickup' && o.delivery_method !== 'in_person'}
                    >
                      {o.delivery_method === 'pickup' ? 'Pickup' : o.delivery_method === 'in_person' ? 'In Person' : 'Ship'}
                    </span>
                  </td>
                  <td class="order-items">
                    {#each o.items as item}
                      <div class="item-line">{item.qty}× {item.name}</div>
                    {/each}
                  </td>
                  <td class="order-total">${parseFloat(o.total).toFixed(2)}</td>
                  <td class="order-paid">
                    {#if o.status !== 'cancelled' && o.status !== 'canceled'}
                      <label class="paid-checkbox-label" title={o.paid ? 'Paid' : 'Not paid'}>
                        <input
                          type="checkbox"
                          class="paid-checkbox"
                          checked={o.paid}
                          onchange={(e) => togglePaid(o.id, e.target.checked)}
                        />
                        <span class="paid-checkmark" class:paid={o.paid}></span>
                      </label>
                    {/if}
                  </td>
                  <td class="order-paid">
                    {#if o.paid && o.status !== 'cancelled' && o.status !== 'canceled'}
                      <label class="paid-checkbox-label" title={o.apple_pay ? 'Apple Pay' : 'Not Apple Pay'}>
                        <input
                          type="checkbox"
                          class="paid-checkbox"
                          checked={o.apple_pay}
                          onchange={(e) => toggleApplePay(o.id, e.target.checked)}
                        />
                        <span class="paid-checkmark" class:paid={o.apple_pay}></span>
                      </label>
                    {/if}
                  </td>
                  <td class="order-status">
                    <select
                      value={o.status}
                      onchange={(e) => updateStatus(o.id, e.target.value)}
                      class="status-select"
                      data-status={o.status}
                    >
                      <option value="new">New</option>
                      <option value="processing">Processing</option>
                      {#if o.delivery_method === 'in_person'}
                        <!-- No fulfillment emails for walk-in orders -->
                      {:else if o.delivery_method === 'pickup'}
                        <option value="ready">Ready for Pickup ✉️</option>
                      {:else}
                        <option value="shipped">Shipped ✉️</option>
                      {/if}
                      <option value="fulfilled">Fulfilled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {#if emailSentOrderId === o.id}
                      <div class="email-sent-badge">✉️ Email sent!</div>
                    {/if}
                  </td>
                  <td class="order-actions">
                    {#if o.customer_email && !o.paid && o.status !== 'cancelled' && o.status !== 'canceled'}
                      <button
                        class="remind-btn"
                        class:sent={reminderSentOrderId === o.id}
                        disabled={reminderSendingId === o.id}
                        onclick={() => sendReminder(o.id)}
                        title="Send payment reminder"
                      >
                        {#if reminderSentOrderId === o.id}
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12l5 5L20 7"/>
                          </svg>
                        {:else}
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 2L11 13"/>
                            <path d="M22 2L15 22l-4-9-9-4 20-7z"/>
                          </svg>
                        {/if}
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if totalPages > 1}
          <div class="pagination">
            <button class="page-btn" disabled={ordersPage === 0} onclick={() => ordersPage--}>← Prev</button>
            <span class="page-indicator">Page {ordersPage + 1} of {totalPages}</span>
            <button class="page-btn" disabled={ordersPage >= totalPages - 1} onclick={() => ordersPage++}>Next →</button>
          </div>
        {/if}
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
          {#each sets as set, i}
            <div
              class="set-row"
              class:drag-over={dragTarget === i && dragIndex !== i}
              class:editing={editingId === set.id}
              draggable={editingId === null}
              ondragstart={() => onDragStart(i)}
              ondragover={(e) => onDragOver(e, i)}
              ondragleave={onDragLeave}
              ondrop={() => onDrop(i)}
              ondragend={onDragEnd}
            >
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
                  <div class="drag-handle" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="5" cy="4" r="1.5" fill="currentColor"/>
                      <circle cx="11" cy="4" r="1.5" fill="currentColor"/>
                      <circle cx="5" cy="8" r="1.5" fill="currentColor"/>
                      <circle cx="11" cy="8" r="1.5" fill="currentColor"/>
                      <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="11" cy="12" r="1.5" fill="currentColor"/>
                    </svg>
                  </div>
                  <div class="set-swatch" style="background:{set.color}"></div>
                  <div class="set-info">
                    <span class="set-name">{set.name}</span>
                    <span class="set-meta" data-status={set.status ?? 'active'}>{SET_STATUS_LABELS[set.status] ?? 'Active'}</span>
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

    {:else if tab === 'feedback'}
      <div class="feedback-panel">
        <h2 class="settings-heading">Feedback</h2>
        {#if feedbackLoading}
          <p class="loading-msg">Loading feedback…</p>
        {:else if feedbackError}
          <div class="empty-orders" style="color:var(--pink)">⚠️ {feedbackError}</div>
        {:else if feedback.length === 0}
          <div class="empty-orders">No feedback yet — it'll show up here when someone submits the form.</div>
        {:else}
          <div class="feedback-list">
            {#each feedback as f}
              {@const topicsArr = Array.isArray(f.topics) ? f.topics : []}
              <div class="feedback-card">
                <div class="feedback-top">
                  <span class="feedback-mood">{f.mood || '💬'}</span>
                  <div class="feedback-meta">
                    <span class="feedback-from">{f.anonymous ? 'Anonymous' : (f.name || 'Someone')}</span>
                    {#if !f.anonymous && f.email}
                      <a href="mailto:{f.email}" class="feedback-email">{f.email}</a>
                    {/if}
                    <span class="feedback-date">{new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {#if f.mood_label}
                    <span class="feedback-mood-label">{f.mood_label}</span>
                  {/if}
                </div>
                {#if topicsArr.length}
                  <div class="feedback-topics">
                    {#each topicsArr as t}
                      <span class="topic-pill">{t}</span>
                    {/each}
                  </div>
                {/if}
                <p class="feedback-message">{f.message}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    {:else if tab === 'analytics'}
      <div class="analytics-panel">
        {#if orders.length === 0}
          <div class="empty-orders">No orders yet — analytics will appear once orders come in.</div>
        {:else}
          <!-- Summary totals -->
          <div class="analytics-totals">
            <div class="stat-card" style="--sc:var(--blue)">
              <span class="stat-val">{analytics.totalSheetsSold}</span>
              <span class="stat-label">Sheets Sold</span>
            </div>
            <div class="stat-card" style="--sc:var(--pink)">
              <span class="stat-val">{analytics.totalSetsSold}</span>
              <span class="stat-label">Sets Sold</span>
            </div>
          </div>

          <!-- Delivery split -->
          <div class="analytics-section">
            <div class="analytics-heading-row">
              <h2 class="analytics-heading">Delivery</h2>
              <span class="analytics-sub">shipped vs. pickup vs. in person</span>
            </div>
            <div class="delivery-split">
              <div class="delivery-split-bar">
                <div class="delivery-segment ship-segment" style="width:{(analytics.shipped / analytics.deliveryTotal) * 100}%">
                  {#if analytics.shipped > 0}
                    <span class="segment-label">📦 {analytics.shipped}</span>
                  {/if}
                </div>
                <div class="delivery-segment pickup-segment" style="width:{(analytics.pickup / analytics.deliveryTotal) * 100}%">
                  {#if analytics.pickup > 0}
                    <span class="segment-label">🏠 {analytics.pickup}</span>
                  {/if}
                </div>
                <div class="delivery-segment person-segment" style="width:{(analytics.inPerson / analytics.deliveryTotal) * 100}%">
                  {#if analytics.inPerson > 0}
                    <span class="segment-label">🤝 {analytics.inPerson}</span>
                  {/if}
                </div>
              </div>
              <div class="delivery-legend">
                <span class="legend-dot" style="background: var(--blue)"></span>
                <span class="legend-text">Shipped — {Math.round((analytics.shipped / analytics.deliveryTotal) * 100)}%</span>
                <span class="legend-dot" style="background: var(--mint)"></span>
                <span class="legend-text">Pickup — {Math.round((analytics.pickup / analytics.deliveryTotal) * 100)}%</span>
                <span class="legend-dot" style="background: var(--orange)"></span>
                <span class="legend-text">In Person — {Math.round((analytics.inPerson / analytics.deliveryTotal) * 100)}%</span>
              </div>
            </div>
          </div>

          <!-- Top Sheets -->
          <div class="analytics-section">
            <div class="analytics-heading-row">
              <h2 class="analytics-heading">Top Sheets</h2>
              <span class="analytics-sub">individual sheet purchases</span>
            </div>
            {#if analytics.sheets.length === 0}
              <div class="analytics-empty">No individual sheets sold yet.</div>
            {:else}
              <div class="analytics-list">
                {#each analytics.sheets as item, i}
                  <div class="analytics-row">
                    <span class="analytics-rank">#{i + 1}</span>
                    <div class="analytics-label-wrap">
                      <span class="analytics-name">{item.name}</span>
                      <div class="analytics-bar-track">
                        <div class="analytics-bar" style="width:{(item.qty / analytics.maxSheet) * 100}%; background: var(--{['pink','blue','mint','yellow'][i % 4]})"></div>
                      </div>
                    </div>
                    <span class="analytics-qty">{item.qty}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Top Sets -->
          <div class="analytics-section">
            <div class="analytics-heading-row">
              <h2 class="analytics-heading">Top Sets</h2>
              <span class="analytics-sub">full set purchases</span>
            </div>
            {#if analytics.sets.length === 0}
              <div class="analytics-empty">No full sets sold yet.</div>
            {:else}
              <div class="analytics-list">
                {#each analytics.sets as item, i}
                  <div class="analytics-row">
                    <span class="analytics-rank">#{i + 1}</span>
                    <div class="analytics-label-wrap">
                      <span class="analytics-name">{item.name}</span>
                      <div class="analytics-bar-track">
                        <div class="analytics-bar" style="width:{(item.qty / analytics.maxSet) * 100}%; background: var(--{['pink','blue','mint','yellow'][i % 4]})"></div>
                      </div>
                    </div>
                    <span class="analytics-qty">{item.qty}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Purchase History -->
          <div class="analytics-section">
            <div class="analytics-heading-row">
              <h2 class="analytics-heading">Purchase History</h2>
              <span class="analytics-sub">pick a set to see each sheet's sales over time</span>
              <select class="history-select" bind:value={historySelection}>
                <option value="">Choose a set…</option>
                {#each sets as set}
                  <option value={set.id}>{set.name}</option>
                {/each}
              </select>
            </div>

            {#if historySeries}
              {#if historySeries.days.length === 0}
                <div class="analytics-empty">No purchases of this yet.</div>
              {:else}
                <div class="history-total">{historySeries.total} sold total</div>
                <div class="history-chart-wrap">
                  <canvas bind:this={historyCanvasEl}></canvas>
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      </div>

    {:else if tab === 'backgrounds'}
      <div class="bg-panel">

        <!-- Left: sticker sets / sheets picker -->
        <div class="bg-cats-col">
          <h2 class="bg-col-heading">Category</h2>

          {#if bgLoading}
            <p class="loading-msg">Loading…</p>
          {:else if sets.length === 0}
            <div class="bg-no-sets">No sticker sets yet — add some in the Sets tab first.</div>
          {:else}
            <div class="bg-cat-list">
              {#each sets as set}
                <div
                  class="bg-cat-row bg-cat-set"
                  class:selected={bgSelectedCatId === set.id}
                  onclick={() => bgSelectedCatId = set.id}
                  role="button"
                  tabindex="0"
                >
                  <div class="bg-set-swatch" style="background:{set.color}"></div>
                  <span class="bg-cat-label">{set.name}</span>
                  {#if bgImages.filter(i => i.category_id === set.id).length > 0}
                    <span class="bg-cat-count">{bgImages.filter(i => i.category_id === set.id).length}</span>
                  {/if}
                </div>
                {#each set.sheets ?? [] as sheet}
                  <div
                    class="bg-cat-row bg-cat-sheet"
                    class:selected={bgSelectedCatId === sheet.id}
                    onclick={() => bgSelectedCatId = sheet.id}
                    role="button"
                    tabindex="0"
                  >
                    <div class="bg-sheet-indent"></div>
                    <span class="bg-cat-label">{sheet.name}</span>
                    {#if bgImages.filter(i => i.category_id === sheet.id).length > 0}
                      <span class="bg-cat-count">{bgImages.filter(i => i.category_id === sheet.id).length}</span>
                    {/if}
                  </div>
                {/each}
              {/each}
            </div>
          {/if}
        </div>

        <!-- Right: images for selected category -->
        <div class="bg-images-col">
          {#if !bgSelectedCat}
            <div class="bg-no-selection">
              <span class="bg-no-selection-icon">←</span>
              <p>Select a category to manage its images</p>
            </div>
          {:else}
            <div class="bg-images-header">
              <h2 class="bg-col-heading">
                <div class="bg-header-swatch" style="background:{bgSelectedCat.color}"></div>
                {bgSelectedCat.label}
              </h2>
              <span class="bg-img-count">{bgSelectedImages.length} image{bgSelectedImages.length === 1 ? '' : 's'}</span>
            </div>

            <!-- Upload form -->
            <div class="bg-upload-form">
              <input
                class="bg-input"
                bind:value={bgNewImgName}
                placeholder="Image name (optional — defaults to filename)"
              />
              <label class="upload-btn" class:uploading={bgImgUploading}>
                {bgImgUploading ? 'Uploading…' : '⬆ Upload Image'}
                <input type="file" accept="image/*" style="display:none" disabled={bgImgUploading} onchange={uploadBgImage} />
              </label>
            </div>

            <!-- Images grid -->
            {#if bgSelectedImages.length === 0}
              <div class="bg-empty-images">
                <p>No images yet — upload one above!</p>
              </div>
            {:else}
              <div class="bg-img-grid">
                {#each bgSelectedImages as img}
                  <div class="bg-img-card">
                    <div class="bg-img-preview-wrap">
                      <img src={img.preview || img.file} alt={img.name} class="bg-img-preview" loading="lazy" />
                      <button
                        class="bg-img-delete"
                        disabled={bgImgDeleting === img.id}
                        onclick={() => deleteBgImage(img.id)}
                        title="Delete image"
                      >
                        {bgImgDeleting === img.id ? '…' : '✕'}
                      </button>
                    </div>
                    {#if bgEditingImgId === img.id}
                      <div class="bg-img-name-edit">
                        <input
                          class="bg-img-name-input"
                          bind:value={bgEditingImgName}
                          onkeydown={(e) => { if (e.key === 'Enter') saveImgName(img.id); if (e.key === 'Escape') cancelEditImgName(); }}
                        />
                        <button class="bg-name-save" onclick={() => saveImgName(img.id)} title="Save">✓</button>
                        <button class="bg-name-cancel" onclick={cancelEditImgName} title="Cancel">✕</button>
                      </div>
                    {:else}
                      <div class="bg-img-name-row">
                        <span class="bg-img-name">{img.name}</span>
                        <button class="bg-img-rename" onclick={() => startEditImgName(img)} title="Rename">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          {/if}
        </div>

      </div>

    {:else}
      <!-- Settings -->
      <div class="settings-panel">
        <h2 class="settings-heading">Notification Emails</h2>
        <div class="field">
          <span class="field-label">Send new order alerts to</span>
          <div class="recipients-list">
            {#each notifEmails as email}
              <span class="recipient-chip">
                {email}
                <button class="chip-remove" onclick={() => removeNotifEmail(email)}>✕</button>
              </span>
            {/each}
          </div>
          <div class="add-recipient-row">
            <input
              type="email"
              bind:value={notifEmailInput}
              placeholder="Add an email…"
              onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNotifEmail(); } }}
            />
            <button class="add-recipient-btn" onclick={addNotifEmail}>Add</button>
          </div>
        </div>

        <h2 class="settings-heading">Site Access</h2>
        <label class="field">
          <span class="field-label">Site password <span class="field-hint">(leave blank to make site public)</span></span>
          <input type="password" bind:value={settings.site_password} placeholder="Password to enter the site" />
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
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Announcement Modal -->
{#if announcementOpen}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) closeAnnouncement(); }}>
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">Send Announcement</h2>
        <button class="modal-close" onclick={closeAnnouncement}>✕</button>
      </div>

      {#if announcementSent}
        <div class="modal-success">
          <div class="success-emoji">🎉</div>
          <p class="success-heading">Sent!</p>
          <p class="success-sub">
            {announcementResults?.sent ?? announcementRecipients.length} email{(announcementResults?.sent ?? announcementRecipients.length) !== 1 ? 's' : ''} delivered
            {#if announcementResults?.failed > 0}
              · {announcementResults.failed} failed
            {/if}
          </p>
          <button class="save-btn" onclick={closeAnnouncement}>Done</button>
        </div>
      {:else}
        <div class="modal-body">
          <label class="field">
            <span class="field-label">Subject</span>
            <input type="text" bind:value={announcementSubject} placeholder="New sticker drop! 🎉" />
          </label>

          <label class="field">
            <span class="field-label">Body</span>
            <textarea bind:value={announcementBody} rows="6" placeholder="Write your message here…&#10;&#10;Use blank lines to separate paragraphs."></textarea>
          </label>

          <div class="field">
            <span class="field-label">Image <span class="field-hint">(optional)</span></span>
            {#if announcementImageUrl}
              <div class="ann-img-preview-wrap">
                <img src={announcementImageUrl} alt="Announcement image" class="ann-img-preview" />
                <button class="ann-img-remove" onclick={() => announcementImageUrl = ''}>✕ Remove</button>
              </div>
            {:else}
              <label class="upload-btn" class:uploading={announcementImageUploading}>
                {announcementImageUploading ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/*" style="display:none"
                  disabled={announcementImageUploading}
                  onchange={handleAnnouncementImageUpload} />
              </label>
            {/if}
          </div>

          <label class="field">
            <span class="field-label">
              Video link <span class="field-hint">(optional)</span>
            </span>
            <input type="url" bind:value={announcementVideoUrl} placeholder="https://youtube.com/watch?v=…" />
            <span class="field-hint">Shown as a thumbnail with a play button that links out to the video — email clients don't play video inline.</span>
          </label>

          <div class="field">
            <span class="field-label">
              Recipients
              <span class="field-hint">({announcementRecipients.length} email{announcementRecipients.length !== 1 ? 's' : ''})</span>
            </span>
            <div class="recipients-list">
              {#each announcementRecipients as email}
                <span class="recipient-chip">
                  {email}
                  <button class="chip-remove" onclick={() => removeRecipient(email)}>✕</button>
                </span>
              {/each}
            </div>
            <div class="add-recipient-row">
              <input
                type="email"
                bind:value={announcementNewEmail}
                placeholder="Add an email…"
                onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRecipient(); } }}
              />
              <button class="add-recipient-btn" onclick={addRecipient}>Add</button>
            </div>
          </div>

          {#if announcementError}
            <p class="announcement-error">{announcementError}</p>
          {/if}

          <div class="modal-actions">
            <button class="cancel-btn" onclick={closeAnnouncement}>Cancel</button>
            <button
              class="send-btn"
              onclick={sendAnnouncement}
              disabled={announcementSending || !announcementSubject.trim() || !announcementBody.trim() || !announcementRecipients.length}
            >
              {announcementSending ? 'Sending…' : `Send to ${announcementRecipients.length}`}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- New In-Person Order Modal -->
{#if newOrderOpen}
  <div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) closeNewOrder(); }}>
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">New In-Person Order</h2>
        <button class="modal-close" onclick={closeNewOrder}>✕</button>
      </div>

      <div class="modal-body">
        <label class="field">
          <span class="field-label">Customer name</span>
          <input type="text" bind:value={newOrderName} placeholder="Jane Doe" />
        </label>
        <label class="field">
          <span class="field-label">Email <span class="field-hint">(optional)</span></span>
          <input type="email" bind:value={newOrderEmail} placeholder="jane@example.com" />
        </label>

        <div class="field">
          <span class="field-label">What did they buy?</span>
          <div class="picker-sets">
            {#each sets as set}
              <div class="picker-set">
                <div class="picker-set-header">
                  <span class="picker-swatch" style="background:{set.color}"></span>
                  <span class="picker-set-name">{set.name}</span>
                </div>
                <div class="picker-options">
                  <button type="button" class="picker-chip" onclick={() => addNewOrderItem(set)}>
                    Full set <span class="picker-chip-price">${set.priceSet.toFixed(2)}</span>
                  </button>
                  {#each set.sheets as sheet}
                    <button type="button" class="picker-chip" onclick={() => addNewOrderItem(set, sheet)}>
                      {sheet.name} <span class="picker-chip-price">${set.priceSheet.toFixed(2)}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>

        {#if newOrderItems.length > 0}
          <div class="field">
            <span class="field-label">Cart</span>
            <div class="new-order-cart">
              {#each newOrderItems as item (item.sheetId)}
                <div class="cart-line">
                  <span class="cart-line-name">{item.name}</span>
                  <div class="cart-line-qty">
                    <button type="button" onclick={() => changeNewOrderQty(item.sheetId, -1)}>−</button>
                    <span>{item.qty}</span>
                    <button type="button" onclick={() => changeNewOrderQty(item.sheetId, 1)}>+</button>
                  </div>
                  <span class="cart-line-price">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              {/each}
            </div>
            <div class="new-order-total">Total: ${newOrderSubtotal.toFixed(2)}</div>
          </div>
        {/if}

        <div class="new-order-toggles">
          <label class="field field-check">
            <span class="field-label">Paid</span>
            <input type="checkbox" bind:checked={newOrderPaid} />
          </label>
          {#if newOrderPaid}
            <label class="field field-check">
              <span class="field-label">Apple Pay</span>
              <input type="checkbox" bind:checked={newOrderApplePay} />
            </label>
          {/if}
        </div>

        {#if newOrderError}
          <p class="announcement-error">{newOrderError}</p>
        {/if}

        <div class="modal-actions">
          <button class="cancel-btn" onclick={closeNewOrder}>Cancel</button>
          <button
            class="send-btn"
            onclick={submitNewOrder}
            disabled={newOrderSaving || !newOrderName.trim() || newOrderItems.length === 0}
          >
            {newOrderSaving ? 'Creating…' : `Create order — $${newOrderSubtotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#snippet setForm(f)}
  <div class="set-form">
    <div class="set-form-row">
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
      <label class="field">
        <span class="field-label">Status</span>
        <select bind:value={f.status}>
          <option value="active">Active</option>
          <option value="coming_soon">Coming Soon</option>
          <option value="retiring_soon">Retiring Soon</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>
    </div>

    <!-- Set type toggle -->
    <div class="field">
      <span class="field-label">Type</span>
      <div class="type-toggle">
        <button type="button" class:active={f.setType !== 'pyo'} onclick={() => f.setType = 'standard'}>Standard</button>
        <button type="button" class:active={f.setType === 'pyo'} onclick={() => f.setType = 'pyo'}>Pick Your Own</button>
      </div>
    </div>

    {#if f.setType === 'pyo'}
      <div class="pyo-config">
        <label class="field">
          <span class="field-label">Paid picks</span>
          <input type="number" bind:value={f.pyoPickCount} min="1" max="20" step="1" />
        </label>
        <label class="field">
          <span class="field-label">Free picks</span>
          <input type="number" bind:value={f.pyoFreeCount} min="1" max="10" step="1" />
        </label>
        <label class="field">
          <span class="field-label">Price per sheet</span>
          <div class="price-input-wrap">
            <span class="price-prefix">$</span>
            <input type="number" bind:value={f.pyoPrice} min="0" step="0.01" />
          </div>
        </label>
      </div>
    {/if}

    <label class="field">
      <span class="field-label">Name</span>
      <input type="text" bind:value={f.name} placeholder="Cuddly Critters" />
    </label>
    <label class="field">
      <span class="field-label">Tagline</span>
      <input type="text" bind:value={f.tagline} placeholder="Tiny clay friends from forest & shore." />
    </label>

    <div class="sheets-section">
      {#if f.setType === 'pyo'}
        <p class="pyo-sheets-hint">These are the sheets customers pick from.</p>
      {/if}
      <div class="sheets-header">
        <span class="field-label">Sheets</span>
        <button type="button" class="add-sheet-btn" onclick={addSheet}>+ Add sheet</button>
      </div>

      {#each f.sheets as sheet, i}
        <div class="sheet-card">
          <div class="sheet-card-header">
            <h4 class="sheet-col-title">Sheet {i + 1}</h4>
            {#if f.sheets.length > 1}
              <button type="button" class="remove-sheet-btn" onclick={() => removeSheet(i)}>Remove</button>
            {/if}
          </div>
          <label class="field">
            <span class="field-label">Name</span>
            <input type="text" bind:value={sheet.name} placeholder="Forest Friends" />
          </label>
          <div class="field">
            <span class="field-label">Image</span>
            <div class="img-upload-wrap">
              {#if sheet.image}
                <img src={sheet.image} alt="Sheet {i + 1} preview" class="img-preview" />
              {/if}
              <div class="img-controls">
                <label class="upload-btn" class:uploading={uploadingSheetIndex === i}>
                  {#if uploadingSheetIndex === i}Uploading…{:else if sheet.image}Change{:else}Upload{/if}
                  <input type="file" accept="image/*" style="display:none" disabled={uploadingSheetIndex !== null}
                    onchange={(e) => handleImageUpload(e, sheet, `${f.id || 'new'}-sheet-${i + 1}`, i)} />
                </label>
              </div>
            </div>
          </div>
          <label class="field">
            <span class="field-label">Blurb</span>
            <textarea bind:value={sheet.blurb} rows="3" placeholder="Short description…"></textarea>
          </label>
        </div>
      {/each}
    </div>

    {#if f.setType !== 'pyo'}
      <div class="price-row">
        <label class="field">
          <span class="field-label">Price per sheet</span>
          <div class="price-input-wrap">
            <span class="price-prefix">$</span>
            <input type="number" bind:value={f.priceSheet} min="0" step="0.01" />
          </div>
        </label>
        {#if f.sheets.length > 1}
          <label class="field">
            <span class="field-label">Full set price <span class="price-hint">(default: ${(f.priceSheet * 1 + (f.sheets.length - 1)).toFixed(2)})</span></span>
            <div class="price-input-wrap">
              <span class="price-prefix">$</span>
              <input type="number" bind:value={f.priceSet} min="0" step="0.01" />
            </div>
          </label>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<style>
  .admin-page {
    padding: 40px 0 80px;
    position: relative;
    z-index: 1;
  }

  @media (max-width: 600px) {
    .admin-page { padding-inline: 20px; }
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
  .dash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .dash-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 36px;
    letter-spacing: -1px;
  }

  /* ── Desktop tabs ── */
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

  /* ── Mobile tab picker ── */
  .tabs-mobile {
    display: none;
    position: relative;
    margin-bottom: 24px;
  }

  .tab-picker-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 13px 18px;
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 14px;
    box-shadow: 0 4px 0 var(--ink);
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 17px;
    color: var(--ink);
    cursor: pointer;
  }

  .tab-picker-label { flex: 1; text-align: left; }

  .tab-picker-chevron {
    transition: transform 0.2s;
    flex-shrink: 0;
  }
  .tab-picker-chevron.open { transform: rotate(180deg); }

  .tab-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 14px;
    box-shadow: 0 6px 0 var(--ink);
    overflow: hidden;
    z-index: 50;
  }

  .tab-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 14px 18px;
    background: none;
    border: none;
    border-bottom: 1.5px solid rgba(42,34,56,0.1);
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 16px;
    color: var(--ink);
    cursor: pointer;
    text-align: left;
  }
  .tab-option:last-child { border-bottom: none; }
  .tab-option.active { background: var(--paper-2); font-weight: 700; }
  .tab-option:hover { background: var(--paper-2); }

  @media (max-width: 620px) {
    .tabs-desktop { display: none; }
    .tabs-mobile  { display: block; }
  }

  /* ── Stats ── */
  .orders-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }

  .new-order-btn {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 10px 20px;
    border-radius: 14px;
    border: 2.5px solid var(--ink);
    background: var(--orange);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 4px 0 var(--ink);
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .new-order-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 var(--ink);
  }

  .new-order-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--ink);
  }

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

  .since-panel {
    background: white;
    border-radius: 14px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    padding: 16px;
    margin-bottom: 28px;
  }

  .since-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .since-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
  }

  .since-select {
    flex: 1;
    min-width: 200px;
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 14px;
    background: var(--paper);
    outline: none;
    font-family: 'Nunito', sans-serif;
  }

  .since-select:focus { border-color: var(--blue); }

  .since-stats-row {
    grid-template-columns: repeat(3, 1fr);
    margin: 16px 0 0;
  }

  @media (max-width: 700px) { .since-stats-row { grid-template-columns: 1fr; } }

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
  .customer-email { font-size: 12px; opacity: 0.6; display: block; }
  .customer-email:hover { opacity: 1; text-decoration: underline; }
  .delivery-badge {
    display: inline-block;
    font-family: 'Fredoka', sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1.5px solid var(--ink);
    margin-top: 4px;
  }
  .ship-badge { background: var(--blue); }
  .pickup-badge { background: var(--yellow); }
  .person-badge { background: var(--orange); }

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

  .status-select[data-status="new"]        { background: #fffbef; }
  .status-select[data-status="processing"] { background: #e8f4ff; }
  .status-select[data-status="ready"]      { background: #efffee; }
  .status-select[data-status="shipped"]    { background: #eef4ff; }
  .status-select[data-status="fulfilled"]  { background: #efffee; }
  .status-select[data-status="cancelled"]  { background: #fff0f0; }

  .email-sent-badge {
    margin-top: 6px;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #2a7a3a;
    background: #d4f5dd;
    border: 1.5px solid #6ddc8a;
    border-radius: 999px;
    padding: 3px 10px;
    display: inline-block;
    white-space: nowrap;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 16px 0 4px;
  }

  .page-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    padding: 7px 18px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: white;
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(42,34,56,0.2);
    transition: background 0.15s, box-shadow 0.1s;
  }

  .page-btn:hover:not(:disabled) {
    background: var(--yellow);
    box-shadow: 0 3px 0 rgba(42,34,56,0.35);
  }

  .page-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: none;
  }

  .page-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .page-indicator {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    opacity: 0.7;
  }

  .order-paid { text-align: center; }

  .paid-checkbox-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    width: 28px;
    height: 28px;
  }

  .paid-checkbox-label input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .paid-checkmark {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    border: 2.5px solid #c0b8d0;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }

  .paid-checkmark.paid {
    background: #6ddc8a;
    border-color: #2a2238;
  }

  .paid-checkmark.paid::after {
    content: '';
    display: block;
    width: 6px;
    height: 11px;
    border-right: 2.5px solid #2a2238;
    border-bottom: 2.5px solid #2a2238;
    transform: rotate(45deg) translate(-1px, -1px);
  }

  .order-actions { text-align: center; padding: 0 8px; }

  .remind-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid #2a2238;
    background: white;
    color: #2a2238;
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(42,34,56,0.2);
    transition: background 0.15s, color 0.15s, box-shadow 0.1s;
    flex-shrink: 0;
  }

  .remind-btn:hover:not(:disabled) {
    background: #ffd23f;
    box-shadow: 0 3px 0 rgba(42,34,56,0.35);
  }

  .remind-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: none;
  }

  .remind-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .remind-btn.sent {
    background: #6ddc8a;
    border-color: #2a2238;
    color: #2a2238;
  }

  /* ── Analytics ── */
  .analytics-panel {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .analytics-totals {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .analytics-section {
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 5px 0 rgba(42,34,56,0.12);
  }

  .analytics-heading-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;
    padding: 18px 22px 14px;
    border-bottom: 2px solid var(--line);
  }

  .analytics-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 20px;
    color: var(--ink);
    margin: 0;
  }

  .analytics-sub {
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    opacity: 0.45;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .analytics-list {
    padding: 12px 0;
  }

  .analytics-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 22px;
  }

  .analytics-row:not(:last-child) {
    border-bottom: 1px solid var(--line);
  }

  .analytics-rank {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 15px;
    color: var(--ink);
    opacity: 0.35;
    width: 28px;
    flex-shrink: 0;
    text-align: right;
  }

  .analytics-label-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .analytics-name {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 15px;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .analytics-bar-track {
    height: 10px;
    background: var(--paper);
    border-radius: 999px;
    overflow: hidden;
  }

  .analytics-bar {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  .analytics-qty {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 18px;
    color: var(--ink);
    flex-shrink: 0;
    min-width: 28px;
    text-align: right;
  }

  .analytics-empty {
    padding: 18px 22px;
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    color: var(--ink);
    opacity: 0.5;
  }

  .history-select {
    margin-left: auto;
    align-self: center;
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 7px 10px;
    font-size: 14px;
    background: var(--paper);
    outline: none;
    font-family: 'Nunito', sans-serif;
  }

  .history-select:focus { border-color: var(--blue); }

  .history-total {
    margin: 0 22px 10px;
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
    opacity: 0.7;
  }

  .history-chart-wrap {
    height: 220px;
    margin: 0 22px 18px;
  }

  .delivery-split {
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .delivery-split-bar {
    display: flex;
    height: 40px;
    border-radius: 999px;
    overflow: hidden;
    background: var(--paper);
  }

  .delivery-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: width 0.4s ease;
    min-width: 0;
    overflow: hidden;
  }

  .ship-segment   { background: var(--blue); }
  .pickup-segment { background: var(--mint); }
  .person-segment { background: var(--orange); }

  .segment-label {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: var(--ink);
    white-space: nowrap;
    padding: 0 10px;
  }

  .delivery-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    flex-shrink: 0;
  }

  .legend-text {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--ink);
    margin-right: 8px;
  }

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

  .field input,
  .field select {
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 14px;
    background: var(--paper);
    outline: none;
    font-family: 'Nunito', sans-serif;
  }

  .field input:focus,
  .field select:focus { border-color: var(--blue); }

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

  .set-row.editing {
    background: transparent;
    border: none;
  }

  .set-row[draggable="true"] { cursor: grab; }
  .set-row[draggable="true"]:active { cursor: grabbing; }

  .set-row.drag-over {
    outline: 2.5px solid var(--blue);
    outline-offset: -2px;
    background: #e8f7ff;
    border-radius: 14px;
  }

  .drag-handle {
    color: var(--ink);
    opacity: 0.3;
    flex-shrink: 0;
    display: flex;
    align-items: center;
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

  .set-meta[data-status="coming_soon"]   { opacity: 1; color: #2d8fd6; }
  .set-meta[data-status="retiring_soon"] { opacity: 1; color: var(--orange); }
  .set-meta[data-status="inactive"]      { opacity: 1; color: var(--pink); }

  .set-row-actions { display: flex; gap: 8px; }

  .row-edit-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    padding: 6px 16px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink);
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
    grid-template-columns: 1fr auto;
    gap: 12px;
    align-items: end;
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

  .sheets-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sheets-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sheet-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 2px solid var(--line);
    border-radius: 12px;
    padding: 14px;
    background: var(--paper-2);
  }

  .sheet-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sheet-col-title {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 15px;
  }

  .add-sheet-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 13px;
    background: var(--blue);
    color: var(--ink);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 5px 14px;
    box-shadow: 0 3px 0 var(--ink);
    cursor: pointer;
    transition: transform 0.1s;
  }
  .add-sheet-btn:hover { transform: translateY(-1px); }

  .remove-sheet-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 12px;
    background: #ffe0e0;
    color: #c0000a;
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    padding: 3px 12px;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .remove-sheet-btn:hover { transform: translateY(-1px); }

  .type-toggle {
    display: flex;
    border: 2px solid var(--ink);
    border-radius: 8px;
    overflow: hidden;
    width: fit-content;
  }
  .type-toggle button {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 7px 16px;
    border: none;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    opacity: 0.5;
  }
  .type-toggle button + button { border-left: 2px solid var(--ink); }
  .type-toggle button.active { background: var(--ink); color: white; opacity: 1; }

  .pyo-config {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 600px) { .pyo-config { grid-template-columns: 1fr 1fr; } }

  .pyo-sheets-hint {
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    opacity: 0.6;
    margin-bottom: 8px;
  }

  .price-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 600px) { .price-row { grid-template-columns: 1fr; } }

  .price-input-wrap {
    display: flex;
    align-items: center;
    border: 2px solid var(--ink);
    border-radius: 8px;
    background: var(--paper);
    overflow: hidden;
  }
  .price-input-wrap input {
    border: none !important;
    border-radius: 0 !important;
    flex: 1;
    padding: 9px 10px;
  }
  .price-prefix {
    padding: 0 10px;
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 15px;
    opacity: 0.6;
  }
  .price-hint {
    font-family: 'Nunito', sans-serif;
    font-weight: 400;
    font-size: 11px;
    opacity: 0.6;
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
    color: var(--ink);
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
    display: inline-block;
    align-self: flex-start;
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

.feedback-panel { padding-top: 8px; }

  .feedback-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .feedback-card {
    background: white;
    border: 2.5px solid var(--ink);
    border-radius: 18px;
    padding: 18px 20px;
    box-shadow: 0 5px 0 var(--ink);
  }

  .feedback-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .feedback-mood { font-size: 28px; line-height: 1; flex-shrink: 0; }

  .feedback-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
  }

  .feedback-from {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 15px;
  }

  .feedback-email {
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    color: var(--blue);
    text-decoration: none;
  }

  .feedback-date {
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    opacity: 0.5;
  }

  .feedback-mood-label {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 13px;
    background: var(--paper-2);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 3px 10px;
  }

  .feedback-topics {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .topic-pill {
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 600;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 3px 10px;
  }

  .feedback-message {
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  /* ── Announcement button ── */
  .announcement-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 16px;
    padding: 12px 24px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--blue);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 5px 0 var(--ink);
    transition: transform 0.08s, box-shadow 0.08s;
  }
  .announcement-btn:hover { transform: translateY(-2px); }
  .announcement-btn:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--ink); }

  /* ── Announcement modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(42, 34, 56, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
  }

  .modal-card {
    background: var(--paper);
    border: 3px solid var(--ink);
    border-radius: 24px;
    box-shadow: 0 10px 0 var(--ink);
    width: 100%;
    max-width: 620px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px 16px;
    border-bottom: 2.5px solid var(--ink);
  }

  .modal-title {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 24px;
    margin: 0;
  }

  .modal-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2.5px solid var(--ink);
    background: var(--paper-2);
    font-size: 14px;
    cursor: pointer;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .modal-body {
    padding: 20px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 4px;
  }

  .send-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 17px;
    padding: 12px 28px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--mint);
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 5px 0 var(--ink);
    transition: transform 0.08s, box-shadow 0.08s;
  }
  .send-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .send-btn:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 2px 0 var(--ink); }
  .send-btn:disabled { opacity: 0.45; cursor: default; }

  .field-hint {
    font-family: 'Fredoka', sans-serif;
    font-weight: 500;
    font-size: 12px;
    opacity: 0.55;
  }

  .recipients-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
    min-height: 32px;
  }

  .recipient-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: white;
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 3px 8px 3px 10px;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
  }

  .chip-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 10px;
    opacity: 0.5;
    padding: 0;
    line-height: 1;
  }
  .chip-remove:hover { opacity: 1; }

  .add-recipient-row {
    display: flex;
    gap: 8px;
  }

  .add-recipient-row input {
    flex: 1;
  }

  .add-recipient-btn {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 999px;
    border: 2px solid var(--ink);
    background: var(--yellow);
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
  }

  .announcement-error {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    color: var(--pink);
    margin: 0;
  }

  /* ── New order item picker ── */
  .picker-sets {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .picker-set {
    border: 2px solid var(--ink);
    border-radius: 14px;
    padding: 10px 12px;
    background: white;
  }

  .picker-set-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .picker-swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1.5px solid var(--ink);
    flex-shrink: 0;
  }

  .picker-set-name {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 700;
  }

  .picker-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .picker-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1.5px solid var(--ink);
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    transition: background 0.1s, transform 0.1s;
  }

  .picker-chip:hover {
    background: var(--yellow);
    transform: translateY(-1px);
  }

  .picker-chip-price {
    opacity: 0.6;
    font-size: 11px;
  }

  /* ── New order cart ── */
  .new-order-cart {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cart-line {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    border: 1.5px solid var(--ink);
    border-radius: 12px;
    padding: 8px 12px;
  }

  .cart-line-name {
    flex: 1;
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cart-line-qty {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 14px;
  }

  .cart-line-qty button {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1.5px solid var(--ink);
    background: var(--paper);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cart-line-qty button:hover { background: var(--yellow); }

  .cart-line-price {
    font-family: 'Fredoka', sans-serif;
    font-weight: 700;
    font-size: 13px;
    white-space: nowrap;
  }

  .new-order-total {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 18px;
    text-align: right;
    margin-top: 6px;
  }

  .new-order-toggles {
    display: flex;
    gap: 24px;
  }

  .ann-img-preview-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .ann-img-preview {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 12px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
  }

  .ann-img-remove {
    font-family: 'Fredoka', sans-serif;
    font-weight: 600;
    font-size: 13px;
    padding: 5px 12px;
    border-radius: 999px;
    border: 2px solid var(--ink);
    background: var(--paper-2);
    cursor: pointer;
    color: var(--ink);
  }
  .ann-img-remove:hover { background: var(--pink); color: white; border-color: var(--pink); }

  /* ── Modal success state ── */
  .modal-success {
    padding: 48px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .success-emoji { font-size: 56px; line-height: 1; }

  .success-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 32px;
    margin: 0;
  }

  .success-sub {
    font-family: 'Caveat', cursive;
    font-size: 20px;
    opacity: 0.75;
    margin: 0 0 16px;
  }

  /* ── Backgrounds tab ── */
  .bg-panel {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    align-items: start;
  }

  @media (max-width: 780px) {
    .bg-panel { grid-template-columns: 1fr; }
  }

  .bg-col-heading {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 22px;
    color: var(--ink);
    margin: 0 0 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bg-cats-col {
    background: white;
    border-radius: 18px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 5px 0 var(--ink);
    padding: 20px;
  }

  .bg-cat-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 20px;
  }

  .bg-cat-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 12px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
    user-select: none;
  }

  .bg-cat-row:hover { background: var(--paper); }
  .bg-cat-row.selected { background: var(--paper); border-color: var(--ink); }

  .bg-set-swatch {
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 1.5px solid var(--ink);
    flex-shrink: 0;
  }

  .bg-sheet-indent {
    width: 16px;
    flex-shrink: 0;
    margin-left: 6px;
  }

  .bg-header-swatch {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid var(--ink);
    flex-shrink: 0;
  }

  .bg-no-sets {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    color: var(--ink);
    opacity: 0.5;
    padding: 12px;
    text-align: center;
  }

  .bg-cat-set {
    font-weight: 700;
  }

  .bg-cat-sheet {
    padding-left: 8px;
    opacity: 0.85;
  }

  .bg-cat-label {
    font-family: 'Fredoka', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bg-cat-count {
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 700;
    background: var(--paper);
    border: 1.5px solid var(--ink);
    border-radius: 999px;
    padding: 1px 8px;
    color: var(--ink);
    opacity: 0.6;
    flex-shrink: 0;
  }

  .bg-input {
    font-family: 'Fredoka', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 10px;
    border: 2px solid rgba(42,34,56,0.2);
    background: var(--paper);
    color: var(--ink);
    flex: 1;
    min-width: 0;
    transition: border-color 0.15s;
  }

  .bg-input:focus { outline: none; border-color: var(--blue); }
  .bg-input.small { flex: none; }

  /* Images column */
  .bg-images-col {
    background: white;
    border-radius: 18px;
    border: 2.5px solid var(--ink);
    box-shadow: 0 5px 0 var(--ink);
    padding: 20px;
    min-height: 300px;
  }

  .bg-no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    gap: 10px;
    opacity: 0.4;
  }

  .bg-no-selection-icon {
    font-size: 36px;
  }

  .bg-no-selection p {
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--ink);
    margin: 0;
  }

  .bg-images-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .bg-img-count {
    font-family: 'Fredoka', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink);
    opacity: 0.5;
  }

  .bg-upload-form {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .bg-empty-images {
    text-align: center;
    padding: 40px 0;
    font-family: 'Caveat', 'Comic Sans MS', cursive;
    font-size: 18px;
    color: var(--ink);
    opacity: 0.45;
  }

  .bg-img-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 14px;
  }

  .bg-img-card {
    border-radius: 12px;
    border: 2px solid var(--ink);
    overflow: hidden;
    box-shadow: 0 3px 0 var(--ink);
    background: white;
  }

  .bg-img-preview-wrap {
    position: relative;
    aspect-ratio: 4/3;
    overflow: hidden;
    background: var(--paper);
  }

  .bg-img-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .bg-img-delete {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    background: white;
    color: var(--ink);
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
  }

  .bg-img-card:hover .bg-img-delete { opacity: 1; }
  .bg-img-delete:hover { background: var(--pink); color: white; border-color: var(--pink); }

  .bg-img-name-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px 4px 8px;
    min-height: 30px;
  }

  .bg-img-name {
    flex: 1;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .bg-img-rename {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1.5px solid transparent;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s, background 0.1s;
  }

  .bg-img-card:hover .bg-img-rename { opacity: 0.6; }
  .bg-img-rename:hover { opacity: 1 !important; background: var(--paper); border-color: rgba(42,34,56,0.2); }

  .bg-img-name-edit {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
  }

  .bg-img-name-input {
    flex: 1;
    min-width: 0;
    font-family: 'Fredoka', sans-serif;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 6px;
    border: 1.5px solid var(--blue);
    border-radius: 6px;
    background: white;
    color: var(--ink);
    outline: none;
  }

  .bg-name-save, .bg-name-cancel {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 1.5px solid var(--ink);
    cursor: pointer;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .bg-name-save { background: var(--mint); color: var(--ink); }
  .bg-name-cancel { background: var(--paper-2); color: var(--ink); }
</style>
