"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WishlistButton({ productId, initialWishlisted, signedIn }: { productId: number; initialWishlisted: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [pending, setPending] = useState(false);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!signedIn) { router.push(`/3d-store/account/login/?next=${encodeURIComponent(window.location.pathname)}`); return; }
    if (pending) return;
    setPending(true);
    const next = !wishlisted;
    setWishlisted(next); // optimistic
    try {
      const res = await fetch("/api/store/wishlist/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: productId }) });
      if (!res.ok) throw new Error("failed");
      const body = await res.json();
      setWishlisted(Boolean(body.wishlisted));
    } catch {
      setWishlisted(!next); // rollback on failure — never claim success the server didn't confirm
    } finally {
      setPending(false);
    }
  }

  return <button
    type="button"
    className={`wishlist-button${wishlisted ? " is-active" : ""}`}
    onClick={toggle}
    disabled={pending}
    aria-pressed={wishlisted}
    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
  ><i className={`bi ${wishlisted ? "bi-heart-fill" : "bi-heart"}`} /></button>;
}
