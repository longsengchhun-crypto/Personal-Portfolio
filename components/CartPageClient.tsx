"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCart, getCartIds, onCartChange, removeFromCart } from "@/lib/cart";
import { getSupabase } from "@/lib/supabase";
import { mediaUrl } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const CART_PRODUCT_SELECT = "id, slug, title, short_description, price_usd, price_khr, cover_image, status";

export default function CartPageClient({ signedIn, defaultName, defaultEmail, alreadyOwnedIds }: { signedIn: boolean; defaultName: string; defaultEmail: string; alreadyOwnedIds: number[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ownedSet = new Set(alreadyOwnedIds);

  async function loadItems() {
    const ids = getCartIds();
    if (ids.length === 0) { setItems([]); return; }
    const { data } = await getSupabase().from("products").select(CART_PRODUCT_SELECT).in("id", ids).eq("status", "published");
    const found = (data as unknown as Product[]) || [];
    // Preserve the order items were added, and silently drop anything removed/unpublished
    // since it was added — the customer sees the current cart, not a stale one.
    setItems(ids.map((id) => found.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)));
  }

  useEffect(() => {
    loadItems();
    return onCartChange(loadItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purchasable = (items || []).filter((item) => !ownedSet.has(item.id));
  const total = purchasable.reduce((sum, item) => sum + item.price_usd, 0);
  const totalKhr = purchasable.reduce((sum, item) => sum + item.price_khr, 0);

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const productIds = purchasable.map((item) => item.id);
    if (productIds.length === 0) { setError("Your cart has nothing left to check out."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/store/cart/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: productIds,
          customer_name: form.get("customer_name"),
          customer_email: form.get("customer_email"),
          customer_phone: form.get("customer_phone"),
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.token) { setError(body.error === "rate_limited" ? "Please wait a few minutes before trying again." : "Something went wrong — please check your details and try again."); setSubmitting(false); return; }
      clearCart();
      router.push(`/3d-store/orders/${body.token}/`);
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  if (items === null) return <p className="analytics-note">Loading your cart…</p>;

  if (items.length === 0) return <div className="empty-state portfolio-empty"><i className="bi bi-cart3" /><h2>Your cart is empty</h2><p>Add a few models and check out together in one payment.</p><Link className="btn btn-accent" href="/3d-store/" style={{ marginTop: 14 }}>Browse the Store</Link></div>;

  return <div className="cart-layout">
    <div className="cart-items">
      {items.map((item) => {
        const owned = ownedSet.has(item.id);
        return <article className={`cart-item${owned ? " is-owned" : ""}`} key={item.id}>
          <div className="cart-item-media">{item.cover_image ? <img src={mediaUrl(item.cover_image, { width: 200 })} alt={item.title} /> : <div className="project-placeholder"><span>3D</span></div>}</div>
          <div className="cart-item-body">
            <h3><Link href={`/3d-store/${item.slug}/`}>{item.title}</Link></h3>
            {owned ? <p className="analytics-note">You already own this model — <Link href="/3d-store/account/">view it in your library</Link>.</p> : <p className="cart-item-price">${item.price_usd.toFixed(2)}{item.price_khr > 0 && <span> · {item.price_khr.toLocaleString()}៛</span>}</p>}
          </div>
          <button type="button" className="btn btn-quiet" onClick={() => removeFromCart(item.id)}><i className="bi bi-trash" /> Remove</button>
        </article>;
      })}
    </div>

    <aside className="product-buy-panel cart-summary">
      <div className="product-price"><strong>${total.toFixed(2)}</strong>{totalKhr > 0 && <span>{totalKhr.toLocaleString()}៛</span>}</div>
      <p className="analytics-note">{purchasable.length} model{purchasable.length === 1 ? "" : "s"} to purchase{items.length !== purchasable.length ? ` (${items.length - purchasable.length} already owned, excluded)` : ""}.</p>

      {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error}</div>}

      <form onSubmit={checkout}>
        <div className="form-field"><label htmlFor="customer_name">Your name</label><input className="form-control" id="customer_name" name="customer_name" defaultValue={defaultName} required maxLength={120} /></div>
        <div className="form-field"><label htmlFor="customer_email">Email</label><input className="form-control" id="customer_email" name="customer_email" type="email" defaultValue={defaultEmail} required /></div>
        <div className="form-field"><label htmlFor="customer_phone">Phone / Telegram (optional)</label><input className="form-control" id="customer_phone" name="customer_phone" /></div>
        <button className="btn btn-accent" type="submit" disabled={submitting || purchasable.length === 0} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}><i className="bi bi-bag-check" />{submitting ? "Placing order…" : "Checkout"}</button>
      </form>
      <p className="analytics-note" style={{ marginTop: 12 }}>{signedIn ? "This order will be saved to your account automatically." : <>Have an account? <Link href={`/3d-store/account/login/?next=${encodeURIComponent("/3d-store/cart/")}`}>Sign in</Link> so it saves to it.</>} You'll pay everything together via one ABA QR code.</p>
    </aside>
  </div>;
}
