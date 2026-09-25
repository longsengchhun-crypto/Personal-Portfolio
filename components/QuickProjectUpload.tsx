"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StoreUploader from "@/components/StoreUploader";
import type { Category } from "@/lib/types";

const MEDIA_UPLOAD_URL = "/api/dashboard/portfolio/media-upload-url/";
const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);

function titleFromFile(fileName: string) {
  const base = fileName.split("/").pop()!.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Untitled").replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 120);
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function createProject(body: Record<string, unknown>) {
  return fetch("/api/dashboard/portfolio/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
}

// Drop one or many posters / reels → each becomes a published project card instantly. Title comes
// from the file name (editable inline afterwards), category is picked once for the whole batch.
export default function QuickProjectUpload({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<number | "">(categories[0]?.id ?? "");
  const [featured, setFeatured] = useState(false);
  const [publish, setPublish] = useState(true);
  const [created, setCreated] = useState(0);
  const [error, setError] = useState("");
  const pending = useRef(Promise.resolve());

  function handleUploaded({ path, fileName }: { path: string; fileName: string }) {
    // Chain creations so slugs/order stay deterministic when several files finish together.
    pending.current = pending.current.then(async () => {
      if (!categoryId) { setError("Pick a category first, then upload again."); return; }
      setError("");
      const title = titleFromFile(fileName);
      const isVideo = VIDEO_EXTENSIONS.has(fileName.split(".").pop()?.toLowerCase() || "");
      const base = {
        title, category_id: categoryId, year: new Date().getFullYear(),
        cover_image: isVideo ? "" : path, video_file: isVideo ? path : "",
        is_featured: featured, status: publish ? "published" : "draft", order: 0,
      };
      let res = await createProject({ ...base, slug: slugify(title) });
      // Same title as an existing project → slug collision; retry once with a short unique suffix.
      if (res.error) res = await createProject({ ...base, slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}` });
      if (res.error) { setError(res.error); return; }
      setCreated((n) => n + 1);
      router.refresh();
    });
  }

  return <section className="console-panel content-editor-panel">
    <div className="console-panel-head"><div><span className="status-dot" /><h2>Quick Upload</h2></div><small>Drop posters or reels — each becomes a card on your site</small></div>
    <div className="inquiry-form">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {created > 0 && !error && <div className="alert alert-success" role="status">{created} added{publish ? " and live" : " as draft"}. Rename or reorder them in the list below.</div>}
      <div className="form-grid">
        <div className="form-field"><label>Category for this batch</label>
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
            {categories.length === 0 && <option value="">Add a category first</option>}
            {categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="form-field"><label>Options</label>
          <label className="review-toggle"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publish immediately</label>
          <label className="review-toggle"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Mark as featured (shows on Showreel page)</label>
        </div>
      </div>
      <StoreUploader mode="media" kind="image" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" label="Drop posters (JPG, PNG, WebP) or reels (MP4, WebM) here" mediaUploadUrl={MEDIA_UPLOAD_URL} onUploaded={handleUploaded} />
    </div>
  </section>;
}
