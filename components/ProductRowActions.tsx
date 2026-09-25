"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductRowActions({ productId }: { productId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this product? If customers have already ordered it, it will be hidden from the store (set to Draft) instead, so their order history and downloads keep working.")) return;
    setBusy(true);
    const res = await fetch("/api/dashboard/store/products/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: productId }),
    });
    const body = await res.json().catch(() => ({} as { error?: string; archived?: boolean }));
    setBusy(false);
    if (res.ok) {
      if (body.archived) window.alert("This product has customer orders, so it was hidden from the store (set to Draft) instead of erased. Orders and downloads are unaffected.");
      router.refresh();
    } else window.alert(body.error || "Could not delete this product.");
  }

  return <button className="btn btn-outline-danger" type="button" onClick={handleDelete} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button>;
}
