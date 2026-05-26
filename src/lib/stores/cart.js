import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'sticker-stop-cart';

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
