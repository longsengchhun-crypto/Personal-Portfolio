"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mediaUrl } from "@/lib/supabase";
import type { Project } from "@/lib/types";

// One project row with the everyday edits inline (rename, publish/unpublish, feature, delete).
// Anything deeper (case study, gallery…) stays on the full editor behind "More".
export default function ProjectQuickRow({ project, categoryName }: { project: Project; categoryName: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(patch: Partial<Project>) {
    setBusy(true); setError("");
    const res = await fetch("/api/dashboard/portfolio/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...project, ...patch }),
    }).then((r) => r.json()).catch(() => ({ error: "Network error." }));
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete "${project.title}" permanently?`)) return;
    setBusy(true);
    const res = await fetch("/api/dashboard/portfolio/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: project.id }) });
    setBusy(false);
    if (res.ok) router.refresh(); else setError("Could not delete.");
  }

  const published = project.status === "published";
  const thumb = project.cover_image ? mediaUrl(project.cover_image, { width: 160 }) : "";

  return <tr>
    <td style={{ width: 84 }}>{thumb ? <img src={thumb} alt="" width={64} height={80} style={{ objectFit: "cover", borderRadius: 6, display: "block" }} /> : <span className="status-badge status-new">{project.video_file ? "Reel" : "No image"}</span>}</td>
    <td>
      <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => { const next = title.trim(); if (next && next !== project.title) void save({ title: next }); else setTitle(project.title); }} aria-label="Title" disabled={busy} />
      <small>{categoryName} · {project.year}{project.video_file ? " · video" : ""}</small>
      {error && <small className="needs-setup"> {error}</small>}
    </td>
    <td><button className={`btn ${published ? "btn-accent" : "btn-outline-light"}`} type="button" disabled={busy} onClick={() => save({ status: published ? "draft" : "published" })}>{published ? "Live" : "Draft"}</button></td>
    <td><button className="btn btn-outline-light" type="button" disabled={busy} aria-label={project.is_featured ? "Remove from featured" : "Feature"} onClick={() => save({ is_featured: !project.is_featured })}><i className={`bi ${project.is_featured ? "bi-star-fill" : "bi-star"}`} style={project.is_featured ? { color: "var(--accent)" } : undefined} /></button></td>
    <td><div className="request-actions"><Link className="btn btn-outline-light" href={`/dashboard/portfolio/${project.id}/`}>More</Link><button className="btn btn-outline-danger" type="button" disabled={busy} onClick={remove}>Delete</button></div></td>
  </tr>;
}
