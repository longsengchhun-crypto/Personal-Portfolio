"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// Supabase serves resumable (TUS) uploads from a dedicated `<project-ref>.storage.supabase.co` host.
const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, "").replace(/\.supabase\.co\/?$/, "");
const TUS_ENDPOINT = PROJECT_REF ? `https://${PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable` : "";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

type Props = {
  kind: "image" | "video";
  accept: string;
  label: string;
  mediaUploadUrl: string;
  onUploaded: (result: PublicMediaResult) => void;
  multiple?: boolean;
};

export default function MediaUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(new Map<string, File>());
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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
      updateItem(key, { status: "error", error: `Not a supported file type (${props.accept}).` });
      return;
    }
    updateItem(key, { status: "uploading", progress: 0, error: "" });
    try {
      const prep = await fetch(props.mediaUploadUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, kind: props.kind, fileName: file.name }),
      }).then((res) => res.json());
      if (prep.error) throw new Error(prep.error);
      await uploadViaTus(file, prep.bucket, prep.path, prep.token, (pct) => updateItem(key, { progress: pct }));
      updateItem(key, { status: "done", progress: 100 });
      props.onUploaded({ publicUrl: prep.publicUrl, path: prep.path, fileName: file.name });
    } catch (caught) {
      updateItem(key, { status: "error", error: caught instanceof Error ? caught.message : "Upload failed." });
    }
  }

  async function enqueue(incoming: File[]) {
    const files = props.multiple ? incoming : incoming.slice(0, 1);
    if (!files.length) return;
    const items = files.map((file) => ({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, size: file.size, status: "queued" as Status, progress: 0, error: "" }));
    items.forEach((item, i) => filesRef.current.set(item.key, files[i]));
    setQueue((current) => [...current, ...items]);
    for (let i = 0; i < files.length; i++) await uploadOne(files[i], items[i].key);
  }

  return <div
    className={`showreel-dropzone store-uploader${isDragging ? " is-dragging" : ""}`}
    onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={(event) => { event.preventDefault(); setIsDragging(false); void enqueue(Array.from(event.dataTransfer.files || [])); }}
  >
    <i className="bi bi-cloud-upload" aria-hidden="true" />
    <p><strong>{props.label}</strong></p>
    <div className="uploader-actions">
      <button className="btn btn-outline-light" type="button" onClick={() => inputRef.current?.click()}>Select File{props.multiple ? "s" : ""}</button>
    </div>
    <input ref={inputRef} type="file" accept={props.accept} hidden multiple={Boolean(props.multiple)} onChange={(event) => { void enqueue(Array.from(event.target.files || [])); event.target.value = ""; }} />

    {queue.length > 0 && <div className="uploader-queue">
      {queue.map((item) => <div className="uploader-queue-item" key={item.key}>
        <div className="uploader-queue-info"><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div>
        {item.status === "uploading" && <div className="showreel-progress-bar"><div style={{ width: `${item.progress}%` }} /></div>}
        {item.status === "queued" && <small className="analytics-note">Waiting…</small>}
        {item.status === "done" && <small className="is-ready"><i className="bi bi-check2-circle" /> Uploaded</small>}
        {item.status === "error" && <small className="needs-setup"><i className="bi bi-exclamation-triangle" /> {item.error}<button className="btn btn-quiet" type="button" onClick={() => { const file = filesRef.current.get(item.key); if (file) void uploadOne(file, item.key); }}>Retry</button></small>}
      </div>)}
    </div>}
  </div>;
}
