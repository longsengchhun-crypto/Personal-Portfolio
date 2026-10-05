"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import type { HeroSlide } from "@/lib/heroSlides";
import MediaUploader from "./MediaUploader";

// Every change saves immediately, so there is no separate Save button to forget.
export default function HeroSlides({ initial, isDefault }: { initial: HeroSlide[]; isDefault: boolean }) {
  const toast = useToast();
  const [slides, setSlides] = useState(initial);
  const latest = useRef(slides);

  async function persist(next: HeroSlide[], message: string, action?: { label: string; run: () => void }) {
    const previous = latest.current;
    latest.current = next;
    setSlides(next);
    const res = await adminJson("/api/dashboard/hero-slides/", { slides: next });
    if (!res.ok) { latest.current = previous; setSlides(previous); toast({ tone: "error", title: "Slides were not saved", message: res.error }); return; }
    toast({ title: message, message: "Live on the homepage within a minute.", action, duration: action ? 6000 : undefined });
  }

  function added({ path, fileName }: { path: string; fileName: string }) {
    const label = fileName.split("/").pop()!.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
    // The first upload replaces the built-in sample slides rather than joining them.
    const base = latest.current.every((slide) => slide.id.startsWith("default-")) ? [] : latest.current;
    void persist([...base, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, image: path, label }], "Slide added");
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    void persist(next, "Order saved");
  }

  const remove = (slide: HeroSlide, index: number) => {
    const undo = () => { const restored = [...latest.current]; restored.splice(Math.min(index, restored.length), 0, slide); void persist(restored, "Slide restored"); };
    void persist(slides.filter((entry) => entry.id !== slide.id), "Slide removed", { label: "Undo", run: undo });
  };

  return <div className="adm-stack">
    {isDefault && <div className="notice"><span>These are the built-in sample slides. Upload your own images and they replace the samples.</span></div>}
    <MediaUploader kind="image" multiple accept="image/jpeg,image/png,image/webp" label="Drop hero images here" uploadUrl="/api/dashboard/portfolio/media-upload-url/" onUploaded={added} />
    <p className="field__hint">Best: wide images, 1920×1080 or larger. Slides cross-fade in this order.</p>
    {slides.length === 0 && <p className="adm-empty-line">No slides. The homepage hero will be empty. Upload at least one image.</p>}
    <ul className="adm-slides">{slides.map((slide, index) => <li key={slide.id} className="adm-slide">
      <div className="adm-slide__thumb"><Picture src={slide.image} alt="" fill sizes="240px" quality={75} /><span className="gm__index tabular">{index + 1}</span></div>
      <div className="field"><label htmlFor={`slide-${slide.id}`}>Caption</label><input id={`slide-${slide.id}`} className="input input--sm" defaultValue={slide.label} maxLength={80} onBlur={(event) => { const label = event.target.value.trim(); if (label !== slide.label) void persist(slides.map((entry) => (entry.id === slide.id ? { ...entry, label } : entry)), "Caption saved"); }} /></div>
      <div className="adm-slide__tools">
        <Button size="sm" variant="ghost" icon aria-label="Move earlier" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button>
        <Button size="sm" variant="ghost" icon aria-label="Move later" disabled={index === slides.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button>
        <Button size="sm" variant="ghost" icon aria-label="Remove slide" onClick={() => remove(slide, index)}><Trash2 /></Button>
      </div>
    </li>)}</ul>
  </div>;
}
