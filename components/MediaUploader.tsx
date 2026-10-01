"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import { adminJson, describeUploadError, formatBytes, IMAGE_MAX_BYTES, VIDEO_MAX_BYTES } from "@/lib/adminApi";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// Supabase serves resumable (TUS) uploads from a dedicated `<project-ref>.storage.supabase.co` host.
const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, "").replace(/\.supabase\.co\/?$/, "");
const TUS_ENDPOINT = PROJECT_REF ? `https://${PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable` : "";

const EXTENSION_BY_MIME: Record<string, string> = { "image/jpeg": "JPG", "image/png": "PNG", "image/webp": "WebP", "video/mp4": "MP4", "video/webm": "WebM" };
const acceptLabel = (accept: string) => accept.split(",").map((rule) => EXTENSION_BY_MIME[rule.trim().toLowerCase()]).filter(Boolean).join(", ").replace(/, ([^,]+)$/, " or $1");

// The native `accept` attribute only filters the picker dialog; drag-and-drop bypasses it.
function isAcceptedFile(name: string, mimeType: string, accept: string) {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const type = (mimeType || "").toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.toLowerCase().endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

type Status = "queued" | "uploading" | "done" | "error";
type QueueItem = { key: string; name: string; size: number; status: Status; progress: number; error: string };
type PublicMediaResult = { publicUrl: string; path: string; fileName: string };
type PrepareResponse = { bucket: string; path: string; token: string; publicUrl: string };

type Props = {
  kind: "image" | "video";
  accept: string;
  label: string;
  mediaUploadUrl: string;
  onUploaded: (result: PublicMediaResult) => void | Promise<void>;
  multiple?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
};

export default function MediaUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(new Map<string, File>());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const formats = acceptLabel(props.accept);

  async function uploadViaTus(file: File, bucket: string, path: string, token: string, onProgress: (pct: number) => void) {
    if (!TUS_ENDPOINT) throw new Error("Upload is misconfigured (missing Supabase URL).");
    await new Promise<void>((resolve, reject) => {
      new tus.Upload(file, {
        endpoint: TUS_ENDPOINT,
        retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: 6 * 1024 * 1024,
        headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}`, "x-signature": token, "x-upsert": "true" },
        metadata: { bucketName: bucket, objectName: path, contentType: file.type || "application/octet-stream", cacheControl: "3600" },
        onError: (error) => reject(error instanceof Error ? error : new Error(String(error))),
        onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(),
      }).start();
    });
  }

  function updateItem(key: string, patch: Partial<QueueItem>) {
    setQueue((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function uploadOne(file: File, key: string) {
    if (!isAcceptedFile(file.name, file.type, props.accept)) {
      updateItem(key, { status: "error", error: `"${file.name}" is not supported here. Use ${formats || props.accept}.` });
      return;
    }
    const limit = file.type.startsWith("video/") ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > limit) {
      updateItem(key, { status: "error", error: `This file is ${formatBytes(file.size)}. The limit for ${file.type.startsWith("video/") ? "videos" : "images"} is ${formatBytes(limit)}.` });
      return;
    }
    if (file.size === 0) {
      updateItem(key, { status: "error", error: "This file is empty." });
      return;
    }
    updateItem(key, { status: "uploading", progress: 0, error: "" });
    try {
      const prep = await adminJson<PrepareResponse>(props.mediaUploadUrl, { contentType: file.type, kind: props.kind, fileName: file.name });
      if (!prep.ok) throw new Error(prep.error);
      await uploadViaTus(file, prep.data.bucket, prep.data.path, prep.data.token, (pct) => updateItem(key, { progress: pct }));
      updateItem(key, { status: "done", progress: 100 });
      await props.onUploaded({ publicUrl: prep.data.publicUrl, path: prep.data.path, fileName: file.name });
    } catch (caught) {
      updateItem(key, { status: "error", error: describeUploadError(caught) });
    }
  }

  async function enqueue(incoming: File[]) {
    if (props.disabled) return;
    const files = props.multiple ? incoming : incoming.slice(0, 1);
    if (!files.length) return;
    const items = files.map((file) => ({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, size: file.size, status: "queued" as Status, progress: 0, error: "" }));
    items.forEach((item, i) => filesRef.current.set(item.key, files[i]));
    setQueue((current) => [...current, ...items]);
    for (let i = 0; i < files.length; i++) await uploadOne(files[i], items[i].key);
  }

  const doneCount = queue.filter((item) => item.status === "done").length;

  return <div
    className={`showreel-dropzone store-uploader${isDragging ? " is-dragging" : ""}${props.disabled ? " is-disabled" : ""}`}
    onDragOver={(event) => { event.preventDefault(); if (!props.disabled) setIsDragging(true); }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={(event) => { event.preventDefault(); setIsDragging(false); void enqueue(Array.from(event.dataTransfer.files || [])); }}
  >
    <i className="bi bi-cloud-upload" aria-hidden="true" />
    <p><strong>{props.label}</strong></p>
    <small className="uploader-hint">{props.disabled ? props.disabledMessage : `${formats}${props.multiple ? " · several files at once" : ""}`}</small>
    <div className="uploader-actions">
      <button className="btn btn-outline-light" type="button" disabled={props.disabled} onClick={() => inputRef.current?.click()}>Select file{props.multiple ? "s" : ""}</button>
    </div>
    <input ref={inputRef} type="file" accept={props.accept} hidden multiple={Boolean(props.multiple)} onChange={(event) => { void enqueue(Array.from(event.target.files || [])); event.target.value = ""; }} />

    {queue.length > 0 && <div className="uploader-queue" aria-live="polite">
      {queue.length > 1 && <small className="analytics-note">{doneCount} of {queue.length} uploaded</small>}
      {queue.map((item) => <div className="uploader-queue-item" key={item.key}>
        <div className="uploader-queue-info"><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div>
        {item.status === "uploading" && <><div className="showreel-progress-bar" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${item.progress}%` }} /></div><small className="analytics-note">{item.progress}%</small></>}
        {item.status === "queued" && <small className="analytics-note">Waiting…</small>}
        {item.status === "done" && <small className="is-ready"><i className="bi bi-check2-circle" /> Uploaded</small>}
        {item.status === "error" && <small className="needs-setup" role="alert"><i className="bi bi-exclamation-triangle" /> {item.error}{filesRef.current.get(item.key) && isAcceptedFile(item.name, filesRef.current.get(item.key)!.type, props.accept) && <button className="btn btn-quiet" type="button" onClick={() => { const file = filesRef.current.get(item.key); if (file) void uploadOne(file, item.key); }}>Retry</button>}</small>}
      </div>)}
    </div>}
  </div>;
}
