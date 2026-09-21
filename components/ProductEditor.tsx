"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StoreUploader from "@/components/StoreUploader";
import { PREVIEW_FILE_ACCEPT, PREVIEW_FILE_EXTENSIONS, PRODUCT_FILE_ACCEPT, PRODUCT_FILE_EXTENSIONS } from "@/lib/fileFormats";
import { mediaUrl } from "@/lib/supabase";
import type { DashboardStoreProduct, ProductCategory, ProductFile, ProductMedia } from "@/lib/types";

type FormState = {
  title: string; slug: string; short_description: string; description: string;
  category_id: number | null; price_usd: string; price_khr: string; tags: string;
  software: string; file_formats: string; polygon_count: string; texture_info: string;
  dimensions: string; file_size: string; version: string; license: string;
  compatibility: string; requirements: string; notes: string;
  cover_image: string; preview_video: string; viewer_model: string;
  is_featured: boolean; status: "draft" | "published"; order: number;
};

function initialState(product: DashboardStoreProduct | null): FormState {
  return {
    title: product?.title || "", slug: product?.slug || "", short_description: product?.short_description || "",
    description: product?.description || "", category_id: product?.category_id ?? null,
    price_usd: product ? String(product.price_usd) : "", price_khr: product ? String(product.price_khr) : "",
    tags: product?.tags || "", software: product?.software || "", file_formats: product?.file_formats || "",
    polygon_count: product?.polygon_count || "", texture_info: product?.texture_info || "", dimensions: product?.dimensions || "",
    file_size: product?.file_size || "", version: product?.version || "", license: product?.license || "",
    compatibility: product?.compatibility || "", requirements: product?.requirements || "", notes: product?.notes || "",
    cover_image: product?.cover_image || "", preview_video: product?.preview_video || "", viewer_model: product?.viewer_model || "",
    is_featured: product?.is_featured || false, status: product?.status || "draft", order: product?.order || 0,
  };
}

export default function ProductEditor({ product, categories }: { product: DashboardStoreProduct | null; categories: ProductCategory[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState(product));
  const [productId, setProductId] = useState<number | null>(product?.id ?? null);
  const [media, setMedia] = useState<ProductMedia[]>(product?.media || []);
  const [files, setFiles] = useState<ProductFile[]>(product?.files || []);
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
    const payload = { ...form, status: nextStatus || form.status, id: productId, price_usd: Number(form.price_usd) || 0, price_khr: Number(form.price_khr) || 0 };
    const res = await fetch("/api/dashboard/store/products/", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    }).then((r) => r.json());
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    if (nextStatus) setForm((prev) => ({ ...prev, status: nextStatus }));
    if (!productId) {
      setProductId(res.id);
      router.replace(`/dashboard/store/products/${res.id}/`);
    }
    setSavedNotice(nextStatus === "published" ? "Published." : "Saved.");
    window.setTimeout(() => setSavedNotice(""), 3000);
  }

  async function addMedia(mediaType: "image" | "video", result: { publicUrl: string; path: string }) {
    if (!productId) return;
    const res = await fetch("/api/dashboard/store/products/media/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, media_type: mediaType, file_path: result.path, order: media.length }),
    }).then((r) => r.json());
    if (res.id) setMedia((prev) => [...prev, { id: res.id, product_id: productId, media_type: mediaType, file_path: result.path, caption: "", order: prev.length }]);
  }

  async function removeMedia(id: number) {
    await fetch("/api/dashboard/store/products/media/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }

  const SOFTWARE_BY_EXTENSION: Record<string, string> = {
    ztl: "ZBrush", zpr: "ZBrush", blend: "Blender", max: "3ds Max", ma: "Maya", mb: "Maya",
    c4d: "Cinema 4D", spp: "Substance Painter", sbsar: "Substance Designer",
  };
  const UNIVERSAL_EXTENSIONS = new Set(["fbx", "obj", "glb", "gltf", "dae", "abc", "3ds", "stl"]);

  function syncFileMeta(nextFiles: ProductFile[]) {
    const rawExtensions = [...new Set(nextFiles.map((f) => f.file_name.split(".").pop()?.toLowerCase()).filter((ext): ext is string => Boolean(ext)))];
    const totalBytes = nextFiles.reduce((sum, f) => sum + (f.file_size || 0), 0);

    // Best-effort auto-detect: only fills software if the field is still empty, so it never
    // overwrites something the admin already typed. Detection is purely from file extension —
    // it can name known-proprietary formats (ZBrush, Blender, etc.) but can't verify content,
    // and it can't infer anything for formats like ZIP that don't imply one app.
    const detectedSoftware = [...new Set(rawExtensions.map((ext) => SOFTWARE_BY_EXTENSION[ext]).filter(Boolean))];
    const hasUniversal = rawExtensions.some((ext) => UNIVERSAL_EXTENSIONS.has(ext));
    if (hasUniversal) detectedSoftware.push("Universal (FBX/OBJ/glTF compatible)");

    setForm((prev) => ({
      ...prev,
      file_formats: rawExtensions.map((ext) => ext.toUpperCase()).join(", "),
      file_size: totalBytes > 0 ? (totalBytes >= 1024 * 1024 * 1024 ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` : `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`) : "",
      software: prev.software || detectedSoftware.join(", "),
    }));
  }

  async function addFile(result: { path: string; fileName: string; fileSize: number }) {
    if (!productId) return;
    const res = await fetch("/api/dashboard/store/products/files/", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, file_name: result.fileName, file_path: result.path, file_size: result.fileSize, order: files.length }),
    }).then((r) => r.json());
    if (res.id) {
      const nextFiles = [...files, { id: res.id, product_id: productId, file_name: result.fileName, file_path: result.path, file_size: result.fileSize, order: files.length, created_at: new Date().toISOString() }];
      setFiles(nextFiles);
      syncFileMeta(nextFiles);
    }
  }

  async function removeFile(id: number) {
    await fetch("/api/dashboard/store/products/files/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
    const nextFiles = files.filter((f) => f.id !== id);
    setFiles(nextFiles);
    syncFileMeta(nextFiles);
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
        <div className="form-field wide"><label>Full description</label><textarea className="form-control" rows={5} {...field("description")} /></div>
        <div className="form-field"><label>Category</label><select className="form-select" value={form.category_id ?? ""} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value ? Number(e.target.value) : null }))}><option value="">Uncategorized</option>{categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
        <div className="form-field"><label>Tags (comma separated)</label><input className="form-control" {...field("tags")} placeholder="modern, chair, furniture" /></div>
        <div className="form-field"><label>Order</label><input className="form-control" type="number" min={0} value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) || 0 }))} /></div>
        <label className="review-toggle"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} /> Featured</label>
      </div></div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Pricing</h2></div></div>
      <div className="inquiry-form"><div className="form-grid">
        <div className="form-field"><label>Price USD ($)</label><input className="form-control" type="number" step="0.01" min="0" {...field("price_usd")} /></div>
        <div className="form-field"><label>Price KHR (៛)</label><input className="form-control" type="number" step="1" min="0" {...field("price_khr")} /></div>
      </div></div>
    </section>

    <section className="console-panel content-editor-panel product-files-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Product Files</h2></div><small>Private — what the customer actually buys, released only after a paid order</small></div>
      <div className="inquiry-form">
        {productId ? <>
          {files.length > 0 && <div className="content-item-list">{files.map((file) => <div className="content-item-form" key={file.id}><div className="form-field"><label>File</label><strong>{file.file_name}</strong>{file.file_size ? <small style={{ color: "var(--muted)" }}>{(file.file_size / (1024 * 1024)).toFixed(1)} MB</small> : null}</div><div className="content-item-actions"><button className="btn btn-outline-danger" type="button" onClick={() => removeFile(file.id)}>Remove</button></div></div>)}</div>}
          <StoreUploader mode="file" accept={PRODUCT_FILE_ACCEPT} label="Drag &amp; drop product files, ZIP packages, or a whole folder here" onUploaded={addFile} multiple allowFolder />
          <p className="analytics-note" style={{ marginTop: 10 }}>Supported: {PRODUCT_FILE_EXTENSIONS.join(" · ").toUpperCase()}. This is the ORIGINAL file the customer downloads — no conversion needed, and a GLB is never required to sell a product.</p>
        </> : <p className="analytics-note">Save the product first to add product files.</p>}
      </div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Preview Media</h2></div><small>Public — visitors will see these</small></div>
      <div className="inquiry-form">
        <div className="form-grid">
          <div className="form-field"><label>Cover image</label>{form.cover_image && <img src={mediaUrl(form.cover_image, { width: 300 })} alt="" style={{ maxWidth: 160, marginBottom: 10, display: "block" }} />}<StoreUploader mode="media" kind="image" accept="image/jpeg,image/png,image/webp" label="Drop cover image" onUploaded={(r) => setForm((p) => ({ ...p, cover_image: r.path }))} /></div>
          <div className="form-field"><label>Preview video (optional)</label>{form.preview_video && <small>Uploaded ✓</small>}<StoreUploader mode="media" kind="video" accept="video/mp4,video/webm" label="Drop preview video" onUploaded={(r) => setForm((p) => ({ ...p, preview_video: r.path }))} /></div>
        </div>

        <div className="form-field wide" style={{ marginTop: 18 }}>
          <label>Gallery images / video</label>
          {productId ? <>
            <div className="content-item-list">{media.map((item) => <div className="content-item-form" key={item.id}><span>{item.media_type === "image" ? <img src={mediaUrl(item.file_path, { width: 200 })} alt="" style={{ maxWidth: 100 }} /> : "Video"}</span><div className="content-item-actions"><button className="btn btn-outline-danger" type="button" onClick={() => removeMedia(item.id)}>Remove</button></div></div>)}</div>
            <StoreUploader mode="media" kind="image" accept="image/jpeg,image/png,image/webp" label="Add gallery image" onUploaded={(r) => addMedia("image", r)} />
          </> : <p className="analytics-note">Save the product first to add gallery media.</p>}
        </div>
      </div>
    </section>

    <section className="console-panel content-editor-panel optional-preview-panel">
      <div className="console-panel-head"><div><span className="status-dot muted-dot" /><h2>Interactive 3D Preview <span className="optional-badge">Optional</span></h2></div></div>
      <div className="inquiry-form">
        <p className="analytics-note">Lets customers rotate, zoom, and inspect the model directly in the browser before buying. <strong>Not required to sell a product</strong> — plenty of products sell fine with just the cover image and gallery above. Only {PREVIEW_FILE_EXTENSIONS.join("/").toUpperCase()} can preview live in a browser; proprietary formats (ZTL, ZPR, BLEND, MAX, MA/MB, C4D) can't — export one from your 3D software first if you want this.</p>
        {form.viewer_model ? <small className="is-ready"><i className="bi bi-check2-circle" /> Uploaded — the rotate/zoom preview is live on the product page automatically.</small> : null}
        <StoreUploader mode="media" kind="model" accept={PREVIEW_FILE_ACCEPT} label="Drop a GLB/GLTF preview here (optional)" onUploaded={(r) => setForm((p) => ({ ...p, viewer_model: r.path }))} />
      </div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Product Details</h2></div></div>
      <div className="inquiry-form"><div className="form-grid">
        <div className="form-field"><label>Software</label><input className="form-control" {...field("software")} placeholder="Blender, 3ds Max" /><small>Auto-suggested from uploaded file types — edit anytime</small></div>
        <div className="form-field"><label>File formats</label><input className="form-control" {...field("file_formats")} placeholder="FBX, OBJ, GLB" /><small>Auto-filled from uploaded files below — edit anytime</small></div>
        <div className="form-field"><label>Polygon count</label><input className="form-control" {...field("polygon_count")} placeholder="e.g. 48,200 tris" /><small>Not auto-detectable in-browser for most formats — check your 3D software's stats panel</small></div>
        <div className="form-field"><label>Texture info</label><input className="form-control" {...field("texture_info")} /></div>
        <div className="form-field"><label>Dimensions</label><input className="form-control" {...field("dimensions")} /></div>
        <div className="form-field"><label>File size</label><input className="form-control" {...field("file_size")} /><small>Auto-filled from uploaded files below — edit anytime</small></div>
        <div className="form-field"><label>Version</label><input className="form-control" {...field("version")} /></div>
      </div></div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>License &amp; Compatibility</h2></div></div>
      <div className="inquiry-form"><div className="form-grid">
        <div className="form-field wide"><label>License</label><textarea className="form-control" rows={3} {...field("license")} /></div>
        <div className="form-field"><label>Compatibility</label><input className="form-control" {...field("compatibility")} /></div>
        <div className="form-field"><label>Requirements</label><input className="form-control" {...field("requirements")} /></div>
        <div className="form-field wide"><label>Internal notes (private)</label><textarea className="form-control" rows={3} {...field("notes")} /></div>
      </div></div>
    </section>

    <div className="decision-actions">
      <button className="btn btn-outline-light" type="button" disabled={saving} onClick={() => save("draft")}>Save Draft</button>
      <button className="btn btn-accent" type="button" disabled={saving} onClick={() => save("published")}>{form.status === "published" ? "Save & Keep Published" : "Publish"}</button>
      {form.status === "published" && <button className="btn btn-quiet" type="button" disabled={saving} onClick={() => { setForm((p) => ({ ...p, status: "draft" })); save("draft"); }}>Unpublish</button>}
    </div>
  </div>;
}
