"use client";

import { useEffect, useRef, useState } from "react";
import { adminJson, describeUploadError, formatBytes, IMAGE_MAX_BYTES, VIDEO_MAX_BYTES } from "@/lib/adminApi";
import { uploadViaTus, type PreparedUpload } from "@/lib/tusUpload";
import { AlertTriangle, CheckCircle2, Film, Loader2, Upload } from "@/components/ui/Icon";

const EXTENSION_BY_MIME: Record<string, string> = { "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WebP", "video/mp4": "MP4", "video/webm": "WebM", "video/quicktime": "MOV" };
const TYPE_BY_EXTENSION: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const acceptLabel = (accept: string) => [...new Set(accept.split(",").map((rule) => EXTENSION_BY_MIME[rule.trim().toLowerCase()]).filter(Boolean))].join(", ").replace(/, ([^,]+)$/, " or $1");

// The native `accept` attribute only filters the picker; drag-and-drop bypasses it.
function isAcceptedFile(name: string, mimeType: string, accept: string) {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const type = (mimeType || TYPE_BY_EXTENSION[name.split(".").pop()?.toLowerCase() || ""] || "").toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.toLowerCase().endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

type Status = "queued" | "uploading" | "done" | "error";
type QueueItem = { key: string; name: string; size: number; status: Status; progress: number; error: string; preview: string; isVideo: boolean };
export type UploadResult = { publicUrl: string; path: string; fileName: string };

type Props = {
  kind: "image" | "video";
  accept: string;
  label: string;
  /** Endpoint that returns a signed upload URL (see /api/dashboard/portfolio/media-upload-url/). */
  uploadUrl: string;
  onUploaded: (result: UploadResult) => void | Promise<void>;
  multiple?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  /** Smaller single-line drop target for tight layouts. */
  compact?: boolean;
  cacheControl?: string;
  maxBytes?: number;
};

export default function MediaUploader({ kind, accept, label, uploadUrl, onUploaded, multiple, disabled, disabledMessage, compact, cacheControl, maxBytes }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(new Map<string, File>());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const formats = acceptLabel(accept);

  useEffect(() => () => { filesRef.current.clear(); }, []);
  const patch = (key: string, changes: Partial<QueueItem>) => setQueue((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  async function uploadOne(file: File, key: string) {
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
    const contentType = file.type || TYPE_BY_EXTENSION[file.name.split(".").pop()?.toLowerCase() || ""] || "";
    if (!isAcceptedFile(file.name, file.type, accept)) return patch(key, { status: "error", error: `"${file.name}" isn't supported here. Use ${formats || accept}.` });
    const limit = maxBytes ?? (isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES);
    if (file.size > limit) return patch(key, { status: "error", error: `This file is ${formatBytes(file.size)}; the limit is ${formatBytes(limit)}. Compress it and try again.` });
    if (file.size === 0) return patch(key, { status: "error", error: "This file is empty." });
    patch(key, { status: "uploading", progress: 0, error: "" });
    try {
      const prepared = await adminJson<PreparedUpload>(uploadUrl, { contentType, kind: isVideo ? "video" : kind, fileName: file.name });
      if (!prepared.ok) throw new Error(prepared.error);
      await uploadViaTus(file, prepared.data, { contentType, cacheControl, onProgress: (progress) => patch(key, { progress }) });
      patch(key, { status: "done", progress: 100 });
      await onUploaded({ publicUrl: prepared.data.publicUrl, path: prepared.data.path, fileName: file.name });
    } catch (caught) {
      patch(key, { status: "error", error: describeUploadError(caught) });
    }
  }

  async function enqueue(incoming: File[]) {
    if (disabled) return;
    const files = multiple ? incoming : incoming.slice(0, 1);
    if (!files.length) return;
    const items: QueueItem[] = files.map((file) => ({
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, size: file.size, status: "queued", progress: 0, error: "",
      isVideo: file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name), preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    items.forEach((item, index) => filesRef.current.set(item.key, files[index]));
    setQueue((current) => [...current.filter((item) => item.status !== "done"), ...items]);
    for (let i = 0; i < files.length; i++) await uploadOne(files[i], items[i].key);
  }

  const done = queue.filter((item) => item.status === "done").length;
  const busy = queue.some((item) => item.status === "uploading" || item.status === "queued");

  return <div className={`drop${dragging ? " is-dragging" : ""}${disabled ? " is-disabled" : ""}${compact ? " drop--compact" : ""}`} data-dropzone
    onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
    onDrop={(event) => { event.preventDefault(); setDragging(false); void enqueue(Array.from(event.dataTransfer.files || [])); }}>
    <button type="button" className="drop__target" disabled={disabled || (!multiple && busy)} onClick={() => inputRef.current?.click()}>
      <span className="drop__icon" aria-hidden="true">{kind === "video" ? <Film /> : <Upload />}</span>
      <span className="drop__text"><strong>{label}</strong><small>{disabled ? disabledMessage : `${formats}${multiple ? " · drop several at once" : ""} · or click to browse`}</small></span>
    </button>
    <input ref={inputRef} type="file" accept={accept} hidden multiple={Boolean(multiple)} onChange={(event) => { void enqueue(Array.from(event.target.files || [])); event.target.value = ""; }} />

    {queue.length > 0 && <ul className="drop__queue" aria-live="polite">
      {queue.length > 1 && <li className="caption">{done} of {queue.length} uploaded</li>}
      {queue.map((item) => <li key={item.key} className={`drop__item drop__item--${item.status}`}>
        <span className="drop__thumb" aria-hidden="true">{item.preview ? <img src={item.preview} alt="" /> : item.isVideo ? <Film /> : <Upload />}</span>
        <span className="drop__meta"><strong>{item.name}</strong><small>{formatBytes(item.size)}{item.status === "uploading" ? ` · ${item.progress}%` : ""}</small>
          {item.status === "uploading" && <span className="drop__bar" role="progressbar" aria-label={`Uploading ${item.name}`} aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${item.progress}%` }} /></span>}
          {item.status === "error" && <small className="drop__error" role="alert">{item.error}</small>}
        </span>
        <span className="drop__state">
          {item.status === "uploading" && <Loader2 className="spin" aria-label="Uploading" />}
          {item.status === "queued" && <small>Waiting</small>}
          {item.status === "done" && <CheckCircle2 aria-label="Uploaded" />}
          {item.status === "error" && <><AlertTriangle aria-hidden="true" />{filesRef.current.get(item.key) && isAcceptedFile(item.name, filesRef.current.get(item.key)!.type, accept) && <button type="button" className="btn btn--glass btn--sm" onClick={() => { const file = filesRef.current.get(item.key); if (file) void uploadOne(file, item.key); }}>Retry</button>}</>}
        </span>
      </li>)}
    </ul>}
  </div>;
}
