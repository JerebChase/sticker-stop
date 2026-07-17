import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'sticker-stop-cart';

function mergeSheets(existing, incoming) {
  const merged = existing.map(s => ({ ...s }));
  for (const sheet of incoming) {
    const found = merged.find(s => s.id === sheet.id);
    if (found) found.qty += sheet.qty;
    else merged.push({ ...sheet });
  }
  return merged;
}

function calcPyoTotals(selectedSheets, pickCount, freeCount, price) {
  const totalPicks = selectedSheets.reduce((s, x) => s + x.qty, 0);
  const cycleSize   = pickCount + freeCount;
  const free = Math.floor(totalPicks / cycleSize) * freeCount +
    Math.max(0, (totalPicks % cycleSize) - pickCount);
  const paid = totalPicks - free;
  return { sheetCount: totalPicks, paidCount: paid, freeCount: free, price: paid * price };
}

function createCart() {
  const initial = browser
    ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    : [];

  const { subscribe, set, update } = writable(initial);

  if (browser) {
    subscribe(value => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    });
  }

  return {
    subscribe,
    add(item, qty = 1) {
      update(cart => {
        const idx = cart.findIndex(p => p.sheetId === item.sheetId);
        if (idx >= 0) {
          const next = [...cart];
          next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          return next;
        }
        return [...cart, { ...item, qty }];
      });
    },
    addPyo({ setId, name, pyoPickCount, pyoFreeCount, pyoPrice, selectedSheets, qty = 1 }) {
      const incoming = selectedSheets.map(s => ({ ...s, qty: s.qty * qty }));
      const sheetId = `${setId}-pyo`;
      update(cart => {
        const idx = cart.findIndex(p => p.sheetId === sheetId);
        const combined = idx >= 0 ? mergeSheets(cart[idx].selectedSheets, incoming) : incoming;
        const totals = calcPyoTotals(combined, pyoPickCount, pyoFreeCount, pyoPrice);
        const item = {
          kind:   'pyo',
          setId,
          sheetId,
          name,
          qty:    1,
          selectedSheets: combined,
          image:  combined[0]?.image || '',
          image2: combined[1]?.image || '',
          image3: combined[2]?.image || '',
          ...totals,
        };
        if (idx >= 0) {
          const next = [...cart];
          next[idx] = item;
          return next;
        }
        return [...cart, item];
      });
    },
    setQty(sheetId, qty) {
      update(cart => {
        if (qty < 1) return cart.filter(p => p.sheetId !== sheetId);
        return cart.map(p => p.sheetId === sheetId ? { ...p, qty } : p);
      });
    },
    remove(sheetId) {
      update(cart => cart.filter(p => p.sheetId !== sheetId));
    },
    clear() {
      set([]);
    },
  };
}

export const cart = createCart();
