"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// Supabase's storage gateway serves resumable (TUS) uploads from a dedicated
// `<project-ref>.storage.supabase.co` host, not the regular `<project-ref>.supabase.co` API host.
const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, "").replace(/\.supabase\.co\/?$/, "");
const TUS_ENDPOINT = PROJECT_REF ? `https://${PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable` : "";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The browser's native `accept` attribute only filters the file-picker dialog — drag-and-drop
// bypasses it entirely, so a JPG dropped onto the "GLB preview" slot uploads with no complaint.
// This checks the real file against the same accept list on both paths. Checks both the
// filename extension (relativePath, so a folder-nested file is judged on its own name, not the
// folder's) and the browser-reported MIME type, since the image/video uploaders use MIME-style
// accept rules ("image/jpeg") rather than extensions.
function isAcceptedFile(relativePath: string, mimeType: string, accept: string) {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const name = relativePath.toLowerCase();
  const type = (mimeType || "").toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

// Recursively reads a dropped folder via the (Chromium-only) FileSystem Entry API. Firefox and
// Safari don't expose directory entries on drop — for those, the plain-file fallback below
// still accepts individually dropped files, and the "Select Folder" button (a real <input
// webkitdirectory>) works everywhere Chromium-based, which covers the vast majority of admin
// use. There's no way to fake real directory drag-and-drop where the browser doesn't support it.
async function readEntry(entry: FileSystemEntry, path = ""): Promise<{ file: File; relativePath: string }[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
    return [{ file, relativePath: path + entry.name }];
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
      const all: FileSystemEntry[] = [];
      const readBatch = () => reader.readEntries((batch) => {
        if (!batch.length) { resolve(all); return; }
        all.push(...batch);
        readBatch();
      }, reject);
      readBatch();
    });
    const nested = await Promise.all(entries.map((child) => readEntry(child, `${path}${entry.name}/`)));
    return nested.flat();
  }
  return [];
}

type Status = "queued" | "uploading" | "done" | "error";
type QueueItem = { key: string; name: string; size: number; status: Status; progress: number; error: string };

type PublicMediaResult = { publicUrl: string; path: string };
type PrivateFileResult = { path: string; fileName: string; fileSize: number };

type Props =
  | { mode: "media"; kind: "image" | "video" | "model"; accept: string; label: string; onUploaded: (result: PublicMediaResult) => void; mediaUploadUrl?: string }
  | { mode: "file"; accept: string; label: string; onUploaded: (result: PrivateFileResult) => void; multiple?: boolean; allowFolder?: boolean };

export default function StoreUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Resumable (TUS) upload, chunked, with automatic retry-with-backoff on transient network
  // drops. Supabase itself recommends this over a single whole-file PUT for anything above a
  // few MB — a plain PUT has to complete start-to-finish in one shot, which is exactly why
  // large (30MB+) product/model files were failing with 400/404s under real-world connections.
  // Auth is the per-object `token` from createSignedUploadUrl (minted server-side with the
  // service-role key), sent as `x-signature` — this needs no storage RLS policy and never
  // exposes the service-role key to the browser.
  async function uploadViaTus(
    file: File, bucket: string, path: string, token: string, contentType: string,
    onProgress: (pct: number) => void,
  ) {
    if (!TUS_ENDPOINT) throw new Error("Upload is misconfigured (missing Supabase URL).");
    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: TUS_ENDPOINT,
        retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: 6 * 1024 * 1024,
        headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}`, "x-signature": token, "x-upsert": "true" },
        metadata: { bucketName: bucket, objectName: path, contentType: contentType || "application/octet-stream", cacheControl: "3600" },
        onError: (error) => reject(error instanceof Error ? error : new Error(String(error))),
        onProgress: (bytesUploaded, bytesTotal) => onProgress(Math.round((bytesUploaded / bytesTotal) * 100)),
        onSuccess: () => resolve(),
      });
      upload.start();
    });
  }

  function updateItem(key: string, patch: Partial<QueueItem>) {
    setQueue((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function uploadOne(file: File, relativePath: string, key: string) {
    if (!isAcceptedFile(relativePath, file.type, props.accept)) {
      updateItem(key, { status: "error", error: `Not a supported file type (${props.accept}).` });
      return;
    }
    updateItem(key, { status: "uploading", progress: 0 });
    try {
      if (props.mode === "media") {
        const prep = await fetch(props.mediaUploadUrl || "/api/dashboard/store/media-upload-url/", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type, kind: props.kind, fileName: relativePath }),
        }).then((res) => res.json());
        if (prep.error) throw new Error(prep.error);
        await uploadViaTus(file, prep.bucket, prep.path, prep.token, file.type, (pct) => updateItem(key, { progress: pct }));
        updateItem(key, { status: "done", progress: 100 });
        props.onUploaded({ publicUrl: prep.publicUrl, path: prep.path });
      } else {
        const prep = await fetch("/api/dashboard/store/file-upload-url/", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: relativePath }),
        }).then((res) => res.json());
        if (prep.error) throw new Error(prep.error);
        await uploadViaTus(file, prep.bucket, prep.path, prep.token, file.type, (pct) => updateItem(key, { progress: pct }));
        updateItem(key, { status: "done", progress: 100 });
        props.onUploaded({ path: prep.path, fileName: prep.fileName, fileSize: file.size });
      }
    } catch (caught) {
      updateItem(key, { status: "error", error: caught instanceof Error ? caught.message : "Upload failed." });
    }
  }

  async function enqueue(incoming: { file: File; relativePath: string }[]) {
    if (!incoming.length) return;
    const items = incoming.map(({ file, relativePath }) => ({ key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: relativePath, size: file.size, status: "queued" as Status, progress: 0, error: "" }));
    setQueue((current) => [...current, ...items]);
    // Sequential, not parallel — these are often large 3D files, and uploading many at once
    // would fight each other for bandwidth and make individual progress meaningless.
    for (let i = 0; i < incoming.length; i++) await uploadOne(incoming[i].file, incoming[i].relativePath, items[i].key);
  }

  function retry(key: string, fileByKey: Map<string, { file: File; relativePath: string }>) {
    const entry = fileByKey.get(key);
    if (entry) void uploadOne(entry.file, entry.relativePath, key);
  }

  const recentFilesRef = useRef(new Map<string, { file: File; relativePath: string }>());

  function stageAndEnqueue(picked: { file: File; relativePath: string }[]) {
    const allowMultiple = props.mode === "file" && props.multiple;
    const files = allowMultiple ? picked : picked.slice(0, 1);
    for (const entry of files) recentFilesRef.current.set(entry.relativePath, entry);
    void enqueue(files);
  }

  return <div
    className={`showreel-dropzone store-uploader${isDragging ? " is-dragging" : ""}`}
    onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={async (event) => {
      event.preventDefault();
      setIsDragging(false);
      const items = event.dataTransfer.items;
      const entries = items ? Array.from(items).map((item) => item.webkitGetAsEntry?.()).filter((e): e is FileSystemEntry => Boolean(e)) : [];
      if (entries.length) {
        const results = (await Promise.all(entries.map((entry) => readEntry(entry)))).flat();
        stageAndEnqueue(results);
        return;
      }
      const files = Array.from(event.dataTransfer.files || []);
      stageAndEnqueue(files.map((file) => ({ file, relativePath: file.name })));
    }}
  >
    <i className="bi bi-cloud-upload" aria-hidden="true" />
    <p><strong>{props.label}</strong></p>
    <div className="uploader-actions">
      <button className="btn btn-outline-light" type="button" onClick={() => inputRef.current?.click()}>Select File{props.mode === "file" && props.multiple ? "s" : ""}</button>
      {props.mode === "file" && props.allowFolder && <button className="btn btn-outline-light" type="button" onClick={() => folderInputRef.current?.click()}>Select Folder</button>}
    </div>
    <input
      ref={inputRef} type="file" accept={props.accept} hidden multiple={props.mode === "file" && props.multiple}
      onChange={(event) => {
        const files = Array.from(event.target.files || []);
        stageAndEnqueue(files.map((file) => ({ file, relativePath: file.name })));
        event.target.value = "";
      }}
    />
    {props.mode === "file" && props.allowFolder && <input
      ref={folderInputRef} type="file" hidden multiple
      // webkitdirectory isn't in React's input типing — spread it past the type checker.
      {...{ webkitdirectory: "" }}
      onChange={(event) => {
        const files = Array.from(event.target.files || []);
        stageAndEnqueue(files.map((file) => ({ file, relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name })));
        event.target.value = "";
      }}
    />}

    {queue.length > 0 && <div className="uploader-queue">
      {queue.map((item) => <div className="uploader-queue-item" key={item.key}>
        <div className="uploader-queue-info"><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div>
        {item.status === "uploading" && <div className="showreel-progress-bar"><div style={{ width: `${item.progress}%` }} /></div>}
        {item.status === "queued" && <small className="analytics-note">Waiting…</small>}
        {item.status === "done" && <small className="is-ready"><i className="bi bi-check2-circle" /> Uploaded</small>}
        {item.status === "error" && <small className="needs-setup"><i className="bi bi-exclamation-triangle" /> {item.error}<button className="btn btn-quiet" type="button" onClick={() => retry(item.key, recentFilesRef.current)}>Retry</button></small>}
      </div>)}
    </div>}
  </div>;
}
