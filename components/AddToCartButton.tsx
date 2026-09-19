"use client";

import { useEffect, useState } from "react";
import { addToCart, isInCart, removeFromCart } from "@/lib/cart";

export default function AddToCartButton({ productId, labeled = false }: { productId: number; labeled?: boolean }) {
  const [inCart, setInCart] = useState(false);

  // Read after mount only — localStorage isn't available during server rendering, and
  // reading it during the initial client render would fight the server-rendered markup.
  useEffect(() => { setInCart(isInCart(productId)); }, [productId]);

  function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (inCart) { removeFromCart(productId); setInCart(false); }
    else { addToCart(productId); setInCart(true); }
  }

  if (labeled) {
    return <button type="button" className={`btn ${inCart ? "btn-outline-light" : "btn-outline-light"} add-to-cart-btn`} onClick={toggle}>
      <i className={`bi ${inCart ? "bi-cart-check-fill" : "bi-cart-plus"}`} />{inCart ? "In Cart" : "Add to Cart"}
    </button>;
  }

  return <button type="button" className={`cart-toggle-button${inCart ? " is-active" : ""}`} onClick={toggle} aria-pressed={inCart} aria-label={inCart ? "Remove from cart" : "Add to cart"} title={inCart ? "Remove from cart" : "Add to cart"}>
    <i className={`bi ${inCart ? "bi-cart-check-fill" : "bi-cart-plus"}`} />
  </button>;
}
