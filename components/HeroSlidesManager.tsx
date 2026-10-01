"use client";

import { useRef, useState } from "react";
import MediaUploader from "@/components/MediaUploader";
import { adminJson } from "@/lib/adminApi";
import { mediaUrl } from "@/lib/supabase";
import type { HeroSlide } from "@/lib/heroSlides";

const MEDIA_UPLOAD_URL = "/api/dashboard/portfolio/media-upload-url/";

export default function HeroSlidesManager({ initial, isDefault }: { initial: HeroSlide[]; isDefault: boolean }) {
  const [slides, setSlides] = useState<HeroSlide[]>(initial);
  const [notice, setNotice] = useState(isDefault ? "These are the built-in sample slides. Upload your own images to replace them." : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const latest = useRef(slides);

  // Every change saves immediately (there is no separate Save button to forget).
  async function persist(next: HeroSlide[], message = "Saved. Live on the home page within a minute.") {
    const previous = latest.current;
    latest.current = next;
    setSlides(next);
    setSaving(true); setError("");
    const res = await adminJson("/api/dashboard/hero-slides/", { slides: next });
    setSaving(false);
    if (!res.ok) {
      latest.current = previous; setSlides(previous); setError(res.error);
      return;
    }
    setNotice(message);
  }

  function handleUploaded({ path, fileName }: { path: string; fileName: string }) {
    const label = fileName.split("/").pop()!.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
    // The very first upload replaces the built-in samples rather than being added after them.
    const base = latest.current.every((s) => s.id.startsWith("default-")) ? [] : latest.current;
    void persist([...base, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, image: path, label }]);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    void persist(next);
  }

  return <div className="product-editor">
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {notice && !error && <div className="alert alert-success" role="status">{saving ? "Saving…" : notice}</div>}

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Upload slides</h2></div><small>Best: wide images, 1920×1080 or larger (JPG, PNG, WebP)</small></div>
      <div className="inquiry-form"><MediaUploader kind="image" multiple accept="image/jpeg,image/png,image/webp" label="Drop hero images here" mediaUploadUrl={MEDIA_UPLOAD_URL} onUploaded={handleUploaded} /></div>
    </section>

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Slides ({slides.length})</h2></div><small>Crossfades on the home page in this order</small></div>
      <div className="content-item-list">
        {slides.length === 0 && <p className="analytics-note">No slides. The slider is hidden on the home page.</p>}
        {slides.map((slide, index) => <div className="content-item-form" key={slide.id}>
          <img src={mediaUrl(slide.image, { width: 240 })} alt="" style={{ width: 140, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 6 }} />
          <div className="form-field"><label>Caption (shown on the slide)</label><input className="form-control" defaultValue={slide.label} maxLength={80} onBlur={(e) => { const label = e.target.value.trim(); if (label !== slide.label) void persist(slides.map((s) => (s.id === slide.id ? { ...s, label } : s))); }} /></div>
          <div className="content-item-actions">
            <button className="btn btn-outline-light" type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move earlier"><i className="bi bi-arrow-up" /></button>
            <button className="btn btn-outline-light" type="button" disabled={index === slides.length - 1} onClick={() => move(index, 1)} aria-label="Move later"><i className="bi bi-arrow-down" /></button>
            <button className="btn btn-outline-danger" type="button" onClick={() => { if (window.confirm("Remove this slide?")) void persist(slides.filter((s) => s.id !== slide.id), "Slide removed."); }}>Remove</button>
          </div>
        </div>)}
      </div>
    </section>
  </div>;
}
