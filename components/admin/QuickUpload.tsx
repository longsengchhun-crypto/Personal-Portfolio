"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import type { Category } from "@/lib/types";
import MediaUploader from "./MediaUploader";

const VIDEO_EXTENSIONS = new Set(["mp4"]);
const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function titleFromFile(fileName: string) {
  const base = fileName.split("/").pop()!.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Untitled").replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 120);
}

const create = (body: Record<string, unknown>) => adminJson<{ id: number }>("/api/dashboard/portfolio/", body);

// Drop one or many posters or reels: each becomes a project card straight away. The title comes
// from the file name and can be edited later; the category is chosen once for the whole batch.
export default function QuickUpload({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [categoryId, setCategoryId] = useState<number | "">(categories[0]?.id ?? "");
  const [publish, setPublish] = useState(false);
  const [created, setCreated] = useState(0);
  const chain = useRef(Promise.resolve());

  function handleUploaded({ path, fileName }: { path: string; fileName: string }) {
    // Chained so slugs and order stay deterministic when several files finish together.
    chain.current = chain.current.then(async () => {
      if (!categoryId) { toast({ tone: "error", title: "Pick a category first", message: "The file uploaded, but no project was created because no category was selected." }); return; }
      const title = titleFromFile(fileName);
      const isVideo = VIDEO_EXTENSIONS.has(fileName.split(".").pop()?.toLowerCase() || "");
      const base = { title, category_id: categoryId, year: new Date().getFullYear(), cover_image: isVideo ? "" : path, video_file: isVideo ? path : "", is_featured: false, status: publish ? "published" : "draft", order: 0 };
      let res = await create({ ...base, slug: slugify(title) });
      // Same title as an existing project means a slug collision: retry once with a short suffix.
      if (!res.ok && res.status !== 401) res = await create({ ...base, slug: `${slugify(title)}-${Date.now().toString(36).slice(-4)}` });
      if (!res.ok) { toast({ tone: "error", title: `Could not create “${title}”`, message: res.error }); return; }
      setCreated((count) => count + 1);
      router.refresh();
    });
  }

  return <Dialog open={open} onClose={() => { setCreated(0); onClose(); }} title="Quick add" wide actions={<Button variant="primary" onClick={() => { setCreated(0); onClose(); }}>Done</Button>}>
    <p className="adm-hint">Drop posters or reels. Each file becomes its own project that you can rename and refine afterwards.</p>
    <div className="adm-form-row">
      <div className="field"><label htmlFor="qu-category">Category for this batch</label>
        <select id="qu-category" className="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : "")}>
          {categories.length === 0 && <option value="">Add a category first</option>}
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
      </div>
      <label className="switch"><input type="checkbox" checked={publish} onChange={(event) => setPublish(event.target.checked)} /> Publish immediately</label>
    </div>
    <MediaUploader kind="image" multiple disabled={!categoryId} disabledMessage="Add a category first, then upload." accept="image/jpeg,image/png,image/webp,video/mp4" label="Drop posters or reels here" uploadUrl="/api/dashboard/portfolio/media-upload-url/" onUploaded={handleUploaded} />
    {created > 0 && <p className="notice notice--success" role="status">{created} project{created === 1 ? "" : "s"} added{publish ? " and live" : " as draft"}.</p>}
  </Dialog>;
}
