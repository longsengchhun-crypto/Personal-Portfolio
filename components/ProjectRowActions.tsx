"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectRowActions({ projectId }: { projectId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this project permanently? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch("/api/dashboard/portfolio/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: projectId }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else window.alert("Could not delete this project.");
  }

  return <button className="btn btn-outline-danger" type="button" onClick={handleDelete} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button>;
}
