"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StoreUploader from "@/components/StoreUploader";
import { mediaUrl } from "@/lib/supabase";
import type { Category, DashboardPortfolioProject, GalleryItem } from "@/lib/types";

type FormState = {
  title: string; slug: string; category_id: number | null; year: string;
  short_description: string; project_type: string; cover_image: string; cover_video_url: string;
  video_file: string; client: string; role: string; project_duration: string; software_used: string;
  introduction: string; objective: string; creative_approach: string; process: string;
  final_result: string; embedded_video_url: string; before_image: string; after_image: string;
  credits: string; is_featured: boolean; status: "draft" | "published"; order: number;
};

function initialState(project: DashboardPortfolioProject | null): FormState {
  return {
    title: project?.title || "", slug: project?.slug || "", category_id: project?.category_id ?? null,
    year: project ? String(project.year) : String(new Date().getFullYear()),
    short_description: project?.short_description || "", project_type: project?.project_type || "",
    cover_image: project?.cover_image || "", cover_video_url: project?.cover_video_url || "",
    video_file: project?.video_file || "", client: project?.client || "", role: project?.role || "",
    project_duration: project?.project_duration || "", software_used: project?.software_used || "",
    introduction: project?.introduction || "", objective: project?.objective || "",
    creative_approach: project?.creative_approach || "", process: project?.process || "",
    final_result: project?.final_result || "", embedded_video_url: project?.embedded_video_url || "",
    before_image: project?.before_image || "", after_image: project?.after_image || "",
    credits: project?.credits || "", is_featured: project?.is_featured || false,
    status: project?.status || "draft", order: project?.order || 0,
  };
}

const MEDIA_UPLOAD_URL = "/api/dashboard/portfolio/media-upload-url/";

export default function ProjectEditor({ project, categories }: { project: DashboardPortfolioProject | null; categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState(project));
  const [projectId, setProjectId] = useState<number | null>(project?.id ?? null);
  const [gallery, setGallery] = useState<GalleryItem[]>(project?.gallery_items || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");

  const field = <K extends keyof FormState>(key: K) => ({
    value: form[key] as never,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    },
  });

  async function save(nextStatus?: "draft" | "published") {
    setSaving(true);
    setError("");
    const payload = { ...form, status: nextStatus || form.status, id: projectId, year: Number(form.year) || new Date().getFullYear() };
    const res = await fetch("/api/dashboard/portfolio/", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then((r) => r.json());
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    if (nextStatus) setForm((prev) => ({ ...prev, status: nextStatus }));
    if (!projectId) {
      setProjectId(res.id);
      router.replace(`/dashboard/portfolio/${res.id}/`);
    }
    setSavedNotice(nextStatus === "published" ? "Published." : "Saved.");
    window.setTimeout(() => setSavedNotice(""), 3000);
  }

  async function addGalleryImage(result: { publicUrl: string; path: string }) {
    if (!projectId) return;
    const res = await fetch("/api/dashboard/portfolio/gallery/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, item_type: "image", image: result.path, layout: "landscape", order: gallery.length }),
    }).then((r) => r.json());
    if (res.id) {
      setGallery((prev) => [...prev, { id: res.id, project_id: projectId, item_type: "image", image: result.path, video_url: "", video_file: "", caption: "", alt_text: "", layout: "landscape", order: prev.length }]);
    } else {
      setError(res.error || "Uploaded, but saving it to the project failed. Try adding it again.");
    }
  }

  async function updateGalleryItem(id: number, patch: Partial<GalleryItem>) {
    const item = gallery.find((g) => g.id === id);
    if (!item) return;
    const next = { ...item, ...patch };
    setGallery((prev) => prev.map((g) => (g.id === id ? next : g)));
    await fetch("/api/dashboard/portfolio/gallery/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: next.project_id, item_type: next.item_type, image: next.image, video_url: next.video_url, video_file: next.video_file, caption: next.caption, alt_text: next.alt_text, layout: next.layout, order: next.order, id }),
    });
  }

  async function removeGalleryItem(id: number) {
    const res = await fetch("/api/dashboard/portfolio/gallery/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) }).then((r) => r.json());
    if (res.error) { setError(res.error); return; }
    setGallery((prev) => prev.filter((g) => g.id !== id));
  }

  return <div className="product-editor">
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {savedNotice && <div className="alert alert-success" role="alert">{savedNotice}</div>}

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Basic Info</h2></div><span className={`status-badge status-${form.status === "published" ? "accepted" : "new"}`}>{form.status}</span></div>
      <div className="inquiry-form"><div className="form-grid">
        <div className="form-field"><label>Title</label><input className="form-control" {...field("title")} onBlur={() => { if (!form.slug) setForm((p) => ({ ...p, slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })); }} required /></div>
        <div className="form-field"><label>Slug (URL)</label><input className="form-control" {...field("slug")} placeholder="auto-generated-from-title" /></div>
        <div className="form-field wide"><label>Short description</label><input className="form-control" {...field("short_description")} maxLength={420} /></div>
        <div className="form-field"><label>Category</label><select className="form-select" value={form.category_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value ? Number(e.target.value) : null }))}><option value="">Uncategorized</option>{categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
        <div className="form-field"><label>Project type</label><input className="form-control" {...field("project_type")} placeholder="Poster Design, Video Editing…" /></div>
        <div className="form-field"><label>Year</label><input className="form-control" type="number" {...field("year")} /></div>
        <div className="form-field"><label>Order</label><input className="form-control" type="number" min={0} value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) || 0 }))} /></div>
        <label className="review-toggle"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} /> Featured</label>
      </div></div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Cover Media</h2></div><small>Shown on the Work grid and at the top of the project page</small></div>
      <div className="inquiry-form"><div className="form-grid">
        <div className="form-field"><label>Cover image</label>{form.cover_image && <img src={mediaUrl(form.cover_image, { width: 300 })} alt="" style={{ maxWidth: 160, marginBottom: 10, display: "block" }} />}<StoreUploader mode="media" kind="image" accept="image/jpeg,image/png,image/webp" label="Drop cover image" mediaUploadUrl={MEDIA_UPLOAD_URL} onUploaded={(r) => setForm((p) => ({ ...p, cover_image: r.path }))} /></div>
        <div className="form-field"><label>Cover video (optional)</label>{form.video_file && <small className="is-ready"><i className="bi bi-check2-circle" /> Uploaded</small>}<StoreUploader mode="media" kind="video" accept="video/mp4,video/webm" label="Drop cover video" mediaUploadUrl={MEDIA_UPLOAD_URL} onUploaded={(r) => setForm((p) => ({ ...p, video_file: r.path }))} /><small>If set, this plays instead of the cover image on the Work grid</small></div>
        <div className="form-field"><label>Embedded video URL (optional)</label><input className="form-control" {...field("embedded_video_url")} placeholder="YouTube or Vimeo link" /></div>
      </div></div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Production Gallery</h2></div><small>Stills and supporting footage on the project page</small></div>
      <div className="inquiry-form">
        {projectId ? <>
          {gallery.length > 0 && <div className="content-item-list">{gallery.map((item) => <div className="content-item-form" key={item.id}>
            <img src={mediaUrl(item.image, { width: 120 })} alt="" style={{ maxWidth: 80 }} />
            <div className="form-field"><label>Caption</label><input className="form-control" defaultValue={item.caption} onBlur={(e) => updateGalleryItem(item.id, { caption: e.target.value })} /></div>
            <div className="form-field"><label>Layout</label><select className="form-select" defaultValue={item.layout} onChange={(e) => updateGalleryItem(item.id, { layout: e.target.value as GalleryItem["layout"] })}><option value="landscape">Landscape</option><option value="portrait">Portrait</option><option value="full">Full width</option></select></div>
            <div className="content-item-actions"><button className="btn btn-outline-danger" type="button" onClick={() => removeGalleryItem(item.id)}>Remove</button></div>
          </div>)}</div>}
          <StoreUploader mode="media" kind="image" accept="image/jpeg,image/png,image/webp" label="Add gallery image" mediaUploadUrl={MEDIA_UPLOAD_URL} onUploaded={addGalleryImage} />
        </> : <p className="analytics-note">Save the project first to add gallery images.</p>}
      </div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Case Study</h2></div><small>Shown as sections on the project page — leave any blank to skip that section</small></div>
      <div className="inquiry-form"><div className="form-grid">
        <div className="form-field wide"><label>Introduction</label><textarea className="form-control" rows={3} {...field("introduction")} /></div>
        <div className="form-field wide"><label>Objective</label><textarea className="form-control" rows={3} {...field("objective")} /></div>
        <div className="form-field wide"><label>Creative approach</label><textarea className="form-control" rows={3} {...field("creative_approach")} /></div>
        <div className="form-field wide"><label>Process</label><textarea className="form-control" rows={3} {...field("process")} /></div>
        <div className="form-field wide"><label>Final result</label><textarea className="form-control" rows={3} {...field("final_result")} /></div>
        <div className="form-field wide"><label>Credits</label><textarea className="form-control" rows={2} {...field("credits")} /></div>
      </div></div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Project Details</h2></div></div>
      <div className="inquiry-form"><div className="form-grid">
        <div className="form-field"><label>Client</label><input className="form-control" {...field("client")} /></div>
        <div className="form-field"><label>Role</label><input className="form-control" {...field("role")} /></div>
        <div className="form-field"><label>Duration</label><input className="form-control" {...field("project_duration")} placeholder="e.g. 2 weeks" /></div>
        <div className="form-field"><label>Software used</label><input className="form-control" {...field("software_used")} placeholder="Photoshop, After Effects…" /></div>
      </div></div>
    </section>

    <div className="decision-actions">
      <button className="btn btn-outline-light" type="button" disabled={saving} onClick={() => save("draft")}>Save Draft</button>
      <button className="btn btn-accent" type="button" disabled={saving} onClick={() => save("published")}>{form.status === "published" ? "Save & Keep Published" : "Publish"}</button>
      {form.status === "published" && <button className="btn btn-quiet" type="button" disabled={saving} onClick={() => { setForm((p) => ({ ...p, status: "draft" })); save("draft"); }}>Unpublish</button>}
    </div>
  </div>;
}
