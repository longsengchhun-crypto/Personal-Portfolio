"use client";

import { useEffect, useState } from "react";
import StoreProductCard from "@/components/StoreProductCard";
import { getSupabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

const PRODUCT_CARD_SELECT = "id, slug, title, short_description, price_usd, price_khr, cover_image, file_formats, is_featured, category:product_categories(*)";
// `!inner` is required for `.eq("category.slug", …)` to actually restrict the parent row set —
// a plain left-joined embed only filters which embedded row comes back (PostgREST semantics).
const PRODUCT_CARD_SELECT_BY_CATEGORY = PRODUCT_CARD_SELECT.replace("category:product_categories(*)", "category:product_categories!inner(*)");

export default function StoreLiveGrid({ initialProducts, category, search, signedIn = false, wishlistIds = [] }: { initialProducts: Product[]; category: string; search: string; signedIn?: boolean; wishlistIds?: number[] }) {
  const wishlistSet = new Set(wishlistIds);
  const [products, setProducts] = useState(initialProducts);

  // Server-rendered props change on filter/search navigation — resync local state to match.
  useEffect(() => { setProducts(initialProducts); }, [initialProducts]);

  useEffect(() => {
    const supabase = getSupabase();
    let wasLive = false;

    function matchesFilters(product: Product) {
      if (category && product.category?.slug !== category) return false;
      if (search) {
        const term = search.toLowerCase();
        const haystack = `${product.title} ${product.short_description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    }

    async function upsertById(id: number) {
      // Re-fetch the full joined row rather than trusting the raw change payload — RLS
      // already means a row we can't SELECT here (e.g. unpublished) simply won't come back,
      // which is also how a product that gets unpublished falls out of the live list.
      const { data } = await supabase.from("products").select(PRODUCT_CARD_SELECT).eq("id", id).eq("status", "published").maybeSingle();
      const product = data as unknown as Product | null;
      // Functional update, not a captured snapshot — INSERT/UPDATE events can resolve their
      // fetches out of order, and reading a ref here would let a later-resolving handler
      // silently overwrite an earlier one's result with stale state.
      setProducts((current) => {
        const exists = current.some((p) => p.id === id);
        if (!product || !matchesFilters(product)) return exists ? current.filter((p) => p.id !== id) : current;
        return exists ? current.map((p) => (p.id === id ? product : p)) : [product, ...current];
      });
    }

    async function resync() {
      let query = supabase.from("products").select(category ? PRODUCT_CARD_SELECT_BY_CATEGORY : PRODUCT_CARD_SELECT).eq("status", "published");
      if (category) query = query.eq("category.slug", category);
      const { data } = await query;
      if (data) setProducts((data as unknown as Product[]).filter(matchesFilters));
    }

    const channel = supabase
      .channel("store-products")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, (payload) => upsertById((payload.new as { id: number }).id))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, (payload) => upsertById((payload.new as { id: number }).id))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "products" }, (payload) => {
        const oldId = (payload.old as { id?: number }).id;
        if (typeof oldId === "number") setProducts((current) => current.filter((p) => p.id !== oldId));
      })
      .subscribe((status) => {
        const isLive = status === "SUBSCRIBED";
        // A fresh (re)subscription — including after a dropped connection reconnects — may
        // have missed events while it was down, so do one safe targeted refetch to resync.
        if (isLive && !wasLive) resync();
        wasLive = isLive;
      });

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  // No visible "Live" badge — the sync happens silently in the background.
  return <>
    {products.length ? <div className="project-grid editorial-grid">{products.map((product) => <StoreProductCard product={product} signedIn={signedIn} isWishlisted={wishlistSet.has(product.id)} key={product.id} />)}</div> : <div className="empty-state portfolio-empty"><i className="bi bi-box-seam" /><h2>No models yet</h2><p>New 3D assets are on the way — check back soon.</p></div>}
  </>;
}
