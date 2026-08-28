"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductRowActions({ productId }: { productId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this product permanently? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch("/api/dashboard/store/products/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: productId }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else window.alert("Could not delete this product.");
  }

  return <button className="btn btn-outline-danger" type="button" onClick={handleDelete} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button>;
}
