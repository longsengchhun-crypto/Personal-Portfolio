"use client";

// Client-only cart: a set of distinct product ids in localStorage. These are unique
// digital goods (buying the same 3D model twice makes no sense), so there's no quantity
// concept — just "in the cart" or not. Guest carts live entirely in the browser; nothing
// is created server-side until checkout actually submits.

const CART_KEY = "3d-store-cart";
const CART_EVENT = "cart-changed";

function readCart(): number[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function writeCart(ids: number[]) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  } catch {
    // Storage unavailable (private mode, quota, etc.) — the cart simply won't persist.
  }
}

export function getCartIds(): number[] {
  if (typeof window === "undefined") return [];
  return readCart();
}

export function isInCart(productId: number): boolean {
  return getCartIds().includes(productId);
}

export function addToCart(productId: number) {
  const current = readCart();
  if (!current.includes(productId)) writeCart([...current, productId]);
}

export function removeFromCart(productId: number) {
  writeCart(readCart().filter((id) => id !== productId));
}

export function clearCart() {
  writeCart([]);
}

export function onCartChange(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CART_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
