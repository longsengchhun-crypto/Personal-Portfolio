"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Film, GripVertical, Pencil, Play, Trash2 } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import type { GalleryItem } from "@/lib/types";
import MediaUploader from "./MediaUploader";

const GALLERY_API = "/api/dashboard/portfolio/gallery/";
const UNDO_WINDOW_MS = 6000;

// The visual arrangement of a project's stills: drag to reorder, edit caption / alt text / shape,
// remove with a short undo window. Everything saves as you go.
export default function GalleryManager({ projectId, items, onChange, disabledMessage }: { projectId: number | null; items: GalleryItem[]; onChange: (items: GalleryItem[]) => void; disabledMessage: string }) {
  const toast = useToast();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [editing, setEditing] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const pending = useRef(new Map<number, number>());
  const [link, setLink] = useState("");
  const [linking, setLinking] = useState(false);

  // If the tab is closed during an undo window, the removal the admin already confirmed still happens.
  useEffect(() => {
    const flush = () => pending.current.forEach((timer, id) => {
      window.clearTimeout(timer);
      navigator.sendBeacon(GALLERY_API, new Blob([JSON.stringify({ action: "delete", id })], { type: "application/json" }));
    });
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  async function persistOrder(next: GalleryItem[]) {
    const res = await adminJson(GALLERY_API, { action: "reorder", ids: next.map((item) => item.id) });
    if (!res.ok) toast({ tone: "error", title: "Could not save the new order", message: res.error });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= itemsRef.current.length || from === to) return;
    const next = [...itemsRef.current];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    const ordered = next.map((entry, index) => ({ ...entry, order: index }));
    onChange(ordered);
    void persistOrder(ordered);
  }

  async function addImage(result: { path: string }) {
    if (!projectId) return;
    const res = await adminJson<{ id: number }>(GALLERY_API, { project_id: projectId, item_type: "image", image: result.path, layout: "landscape", order: itemsRef.current.length });
    if (!res.ok) { toast({ tone: "error", title: "The image uploaded but could not be added to the gallery", message: res.error }); return; }
    const entry: GalleryItem = { id: res.data.id, project_id: projectId, item_type: "image", image: result.path, video_url: "", video_file: "", caption: "", alt_text: "", layout: "landscape", order: itemsRef.current.length };
    onChange([...itemsRef.current, entry]);
  }

  async function addVideoFile(result: { path: string }) {
    if (!projectId) return;
    const res = await adminJson<{ id: number }>(GALLERY_API, { project_id: projectId, item_type: "video", video_file: result.path, layout: "full", order: itemsRef.current.length });
    if (!res.ok) { toast({ tone: "error", title: "The video uploaded but could not be added to the gallery", message: res.error }); return; }
    onChange([...itemsRef.current, { id: res.data.id, project_id: projectId, item_type: "video", image: "", video_url: "", video_file: result.path, caption: "", alt_text: "", layout: "full", order: itemsRef.current.length }]);
  }

  async function addVideoLink() {
    if (!projectId || !link.trim()) return;
    setLinking(true);
    const resolved = await adminJson<{ canonicalUrl: string; thumbnailPath: string; vertical: boolean }>("/api/dashboard/video-link/", { url: link });
    if (!resolved.ok) { setLinking(false); toast({ tone: "error", title: "That link can't be added", message: resolved.error }); return; }
    const res = await adminJson<{ id: number }>(GALLERY_API, { project_id: projectId, item_type: "video", video_url: resolved.data.canonicalUrl, image: resolved.data.thumbnailPath, layout: resolved.data.vertical ? "portrait" : "full", order: itemsRef.current.length });
    setLinking(false);
    if (!res.ok) { toast({ tone: "error", title: "Could not add the video", message: res.error }); return; }
    onChange([...itemsRef.current, { id: res.data.id, project_id: projectId, item_type: "video", image: resolved.data.thumbnailPath, video_url: resolved.data.canonicalUrl, video_file: "", caption: "", alt_text: "", layout: resolved.data.vertical ? "portrait" : "full", order: itemsRef.current.length }]);
    setLink("");
    toast({ title: "Video added to the gallery" });
  }

  async function patchItem(id: number, patch: Partial<GalleryItem>) {
    const before = itemsRef.current.find((item) => item.id === id);
    if (!before) return;
    const next = { ...before, ...patch };
    onChange(itemsRef.current.map((item) => (item.id === id ? next : item)));
    const res = await adminJson(GALLERY_API, { action: "update", id, caption: next.caption, alt_text: next.alt_text, layout: next.layout, order: next.order });
    if (!res.ok) { onChange(itemsRef.current.map((item) => (item.id === id ? before : item))); toast({ tone: "error", title: "Could not save the change", message: res.error }); }
  }

  function remove(item: GalleryItem, index: number) {
    const before = itemsRef.current;
    onChange(before.filter((entry) => entry.id !== item.id));
    setEditing(null);
    const timer = window.setTimeout(async () => {
      pending.current.delete(item.id);
      const res = await adminJson(GALLERY_API, { action: "delete", id: item.id });
      if (!res.ok) { onChange([...itemsRef.current, item].sort((a, b) => a.order - b.order)); toast({ tone: "error", title: "Could not remove the image", message: res.error }); }
    }, UNDO_WINDOW_MS);
    pending.current.set(item.id, timer);
    toast({ title: "Removed from the gallery", duration: UNDO_WINDOW_MS, action: { label: "Undo", run: () => {
      window.clearTimeout(timer);
      pending.current.delete(item.id);
      const restored = [...itemsRef.current];
      restored.splice(Math.min(index, restored.length), 0, item);
      onChange(restored);
    } } });
  }

  return <div className="gm">
    {items.length > 0 && <ul className="gm__grid" aria-label="Gallery, drag to reorder">
      {items.map((item, index) => <li key={item.id}
        className={`gm__item${dragIndex === index ? " is-dragging" : ""}${overIndex === index && dragIndex !== index ? " is-over" : ""}`}
        draggable onDragStart={(event) => { setDragIndex(index); event.dataTransfer.effectAllowed = "move"; }}
        onDragOver={(event) => { event.preventDefault(); setOverIndex(index); }}
        onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
        onDrop={(event) => { event.preventDefault(); if (dragIndex !== null) move(dragIndex, index); setDragIndex(null); setOverIndex(null); }}>
        <div className="gm__thumb">
          {item.image ? <Picture src={item.image} alt={item.alt_text || item.caption || `Gallery image ${index + 1}`} fill sizes="200px" quality={75} /> : <span className="gm__video"><Film aria-hidden="true" /></span>}
          <span className="gm__index tabular">{index + 1}</span>{item.item_type === "video" && <span className="gm__play" aria-label="Video"><Play aria-hidden="true" /></span>}
          <span className="gm__grip" aria-hidden="true"><GripVertical /></span>
        </div>
        <div className="gm__bar">
          <span className="badge badge--plain">{item.layout === "full" ? "Full width" : item.layout === "portrait" ? "Portrait" : "Landscape"}</span>
          <span className="gm__tools">
            <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={`Move image ${index + 1} earlier`} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowLeft /></button>
            <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={`Move image ${index + 1} later`} disabled={index === items.length - 1} onClick={() => move(index, index + 1)}><ArrowRight /></button>
            <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={`Edit details for image ${index + 1}`} aria-expanded={editing === item.id} onClick={() => setEditing(editing === item.id ? null : item.id)}><Pencil /></button>
            <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={`Remove image ${index + 1}`} onClick={() => remove(item, index)}><Trash2 /></button>
          </span>
        </div>
        {editing === item.id && <div className="gm__edit">
          <div className="field"><label htmlFor={`cap-${item.id}`}>Caption</label><input id={`cap-${item.id}`} className="input input--sm" defaultValue={item.caption} maxLength={300} onBlur={(event) => { if (event.target.value !== item.caption) void patchItem(item.id, { caption: event.target.value }); }} /></div>
          <div className="field"><label htmlFor={`alt-${item.id}`}>Alt text <span className="caption">(for screen readers and search)</span></label><input id={`alt-${item.id}`} className="input input--sm" defaultValue={item.alt_text} maxLength={300} onBlur={(event) => { if (event.target.value !== item.alt_text) void patchItem(item.id, { alt_text: event.target.value }); }} /></div>
          <div className="field"><label htmlFor={`lay-${item.id}`}>Shape on the site</label><select id={`lay-${item.id}`} className="select select--sm" value={item.layout} onChange={(event) => void patchItem(item.id, { layout: event.target.value as GalleryItem["layout"] })}><option value="landscape">Landscape (pairs side by side)</option><option value="portrait">Portrait (pairs side by side)</option><option value="full">Full width</option></select></div>
          <Button size="sm" variant="glass" onClick={() => setEditing(null)}>Done</Button>
        </div>}
      </li>)}
    </ul>}
    <div className="gm__video-add">
      <div className="field"><label htmlFor="gm-link">Add a video by link</label>
        <div className="gm__link"><input id="gm-link" className="input input--sm" value={link} disabled={!projectId} onChange={(event) => setLink(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addVideoLink(); } }} placeholder="Paste a TikTok, YouTube or Vimeo link" /><Button size="sm" variant="glass" disabled={!projectId || !link.trim()} state={linking ? "loading" : undefined} onClick={addVideoLink}>Add video</Button></div>
      </div>
      <MediaUploader kind="video" compact disabled={!projectId} disabledMessage={disabledMessage} accept="video/mp4" label="Or upload a video file (MP4)" uploadUrl="/api/dashboard/portfolio/media-upload-url/" onUploaded={addVideoFile} />
    </div>
    <MediaUploader kind="image" multiple disabled={!projectId} disabledMessage={disabledMessage} accept="image/jpeg,image/png,image/webp" label={items.length ? "Add more images" : "Add gallery images"} uploadUrl="/api/dashboard/portfolio/media-upload-url/" onUploaded={addImage} compact={items.length > 0} />
  </div>;
}
