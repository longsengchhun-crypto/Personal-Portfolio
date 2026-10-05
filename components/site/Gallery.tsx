"use client";

import { useCallback, useEffect, useState } from "react";
import Dialog from "@/components/ui/Dialog";
import { ChevronLeft, ChevronRight } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";

export type GalleryEntry = { id: number; kind: "image" | "video" | "embed"; src: string; alt: string; caption: string; layout: "landscape" | "portrait" | "full"; vertical?: boolean };

// Rows: a "full" frame is alone; other frames pair up so every row is balanced.
export function galleryRows(entries: GalleryEntry[]) {
  const rows: GalleryEntry[][] = [];
  let pending: GalleryEntry[] = [];
  const flush = () => { if (pending.length) rows.push(pending); pending = []; };
  for (const entry of entries) {
    if (entry.layout === "full") { flush(); rows.push([entry]); continue; }
    pending.push(entry);
    if (pending.length === 2) flush();
  }
  flush();
  return rows;
}

export default function Gallery({ entries, title }: { entries: GalleryEntry[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const images = entries.filter((entry) => entry.kind === "image");
  const current = open === null ? null : images[open];
  const step = useCallback((delta: number) => setOpen((value) => (value === null ? value : (value + delta + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "ArrowRight") step(1); if (event.key === "ArrowLeft") step(-1); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, step]);

  return <>
    <div className="gallery">
      {galleryRows(entries).map((row, rowIndex) => <div key={rowIndex} className={`gallery__row gallery__row--${row.length === 1 ? (row[0].layout === "full" ? "full" : "single") : "pair"}`}>
        {row.map((entry) => <figure key={entry.id} className={`gallery__item gallery__item--${entry.layout}`} data-r>
          {entry.kind === "image" && <button type="button" className="gallery__open" data-cursor="Expand" onClick={() => setOpen(images.findIndex((image) => image.id === entry.id))} aria-label={`Enlarge: ${entry.alt}`}>
            <Picture src={entry.src} alt={entry.alt} fill sizes={entry.layout === "full" ? "100vw" : "(min-width: 900px) 50vw, 100vw"} className="gallery__img" />
          </button>}
          {entry.kind === "video" && <video className="gallery__video" src={entry.src} controls playsInline preload="metadata" />}
          {entry.kind === "embed" && <div className={`gallery__embed${entry.vertical ? " gallery__embed--vertical" : ""}`}><iframe src={entry.src} title={entry.alt} loading="lazy" allowFullScreen /></div>}
          {entry.caption && <figcaption className="caption">{entry.caption}</figcaption>}
        </figure>)}
      </div>)}
    </div>
    <Dialog open={current !== null && current !== undefined} onClose={() => setOpen(null)} title={current ? current.alt || title : title} hideTitle wide>
      {current && <div className="lightbox">
        <div className="lightbox__stage"><Picture src={current.src} alt={current.alt} fill sizes="90vw" quality={85} className="lightbox__img" /></div>
        <div className="lightbox__bar">
          <p className="caption">{current.caption || title}</p>
          {images.length > 1 && <div className="lightbox__nav">
            <button type="button" className="btn btn--glass btn--icon btn--sm" onClick={() => step(-1)} aria-label="Previous image"><ChevronLeft /></button>
            <span className="caption tabular">{(open ?? 0) + 1} / {images.length}</span>
            <button type="button" className="btn btn--glass btn--icon btn--sm" onClick={() => step(1)} aria-label="Next image"><ChevronRight /></button>
          </div>}
        </div>
      </div>}
    </Dialog>
  </>;
}
