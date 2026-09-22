"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tus from "tus-js-client";

const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const TYPE_BY_EXTENSION: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, "").replace(/\.supabase\.co\/?$/, "");
const TUS_ENDPOINT = PROJECT_REF ? `https://${PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable` : "";

function resolveContentType(file: File) {
  if (ALLOWED_TYPES.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return TYPE_BY_EXTENSION[extension] || "";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Status = "idle" | "uploading" | "saving" | "done" | "error";

export default function ShowreelUploader({ currentVideoLabel }: { currentVideoLabel: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  async function upload(file: File) {
    setError("");
    const contentType = resolveContentType(file);
    if (!contentType) return setError("Unsupported file type. Use MP4, WebM, or MOV.");
    if (file.size > MAX_BYTES) return setError(`File is too large (${formatBytes(file.size)}). Maximum is 2 GB.`);

    setFileInfo({ name: file.name, size: file.size });
    setStatus("uploading");
    setProgress(0);

    try {
      const prep = await fetch("/api/dashboard/content/showreel-upload-url/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType }),
      }).then((res) => res.json());
      if (prep.error) throw new Error(prep.error);
      if (!TUS_ENDPOINT) throw new Error("Upload is misconfigured (missing Supabase URL).");

      await new Promise<void>((resolve, reject) => {
        const uploadHandle = new tus.Upload(file, {
          endpoint: TUS_ENDPOINT,
          retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          chunkSize: 6 * 1024 * 1024,
          headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}`, "x-signature": prep.token, "x-upsert": "true" },
          metadata: { bucketName: "portfolio-media", objectName: prep.path, contentType, cacheControl: "31536000" },
          onError: (uploadError) => reject(uploadError instanceof Error ? uploadError : new Error(String(uploadError))),
          onProgress: (bytesUploaded, bytesTotal) => setProgress(Math.round((bytesUploaded / bytesTotal) * 100)),
          onSuccess: () => resolve(),
        });
        uploadHandle.start();
      });

      setStatus("saving");
      const finalize = await fetch("/api/dashboard/content/showreel-video/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicUrl: prep.publicUrl }),
      }).then((res) => res.json());
      if (finalize.error) throw new Error(finalize.error);

      setStatus("done");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
      setStatus("error");
    }
  }

  return <div className="content-item-list">
    <div
      className={`showreel-dropzone${isDragging ? " is-dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void upload(file);
      }}
    >
      <i className="bi bi-camera-reels" aria-hidden="true" />
      <p><strong>Drop a showreel video here</strong> or</p>
      <button className="btn btn-outline-light" type="button" onClick={() => inputRef.current?.click()} disabled={status === "uploading" || status === "saving"}>Select Video</button>
      <small>MP4, WebM, or MOV · up to 2 GB</small>
      <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />
    </div>

    {fileInfo && status !== "idle" && <div className="showreel-upload-status">
      <div><strong>{fileInfo.name}</strong><span>{formatBytes(fileInfo.size)}</span></div>
      {status === "uploading" && <><div className="showreel-progress-bar"><div style={{ width: `${progress}%` }} /></div><small>Uploading… {progress}%</small></>}
      {status === "saving" && <small><i className="bi bi-arrow-repeat" /> Publishing to the showreel…</small>}
      {status === "done" && <small className="is-ready"><i className="bi bi-check2-circle" /> Live — view at <a href="/showreel/" target="_blank" rel="noreferrer">/showreel/</a></small>}
      {status === "error" && <small className="needs-setup"><i className="bi bi-exclamation-triangle" /> {error}<button className="btn btn-quiet" type="button" onClick={() => inputRef.current?.click()}>Retry</button></small>}
    </div>}

    {!fileInfo && <p className="analytics-note">Current showreel: {currentVideoLabel}</p>}
  </div>;
}
