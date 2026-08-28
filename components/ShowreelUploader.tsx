"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 500 * 1024 * 1024;
const TYPE_BY_EXTENSION: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime" };
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

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
    if (file.size > MAX_BYTES) return setError(`File is too large (${formatBytes(file.size)}). Maximum is 500 MB.`);

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

      const formData = new FormData();
      formData.append("cacheControl", "31536000");
      formData.append("", file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", prep.signedUrl);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "");
        xhr.setRequestHeader("Authorization", `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""}`);
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}).`)));
        xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
        xhr.send(formData);
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
      <small>MP4, WebM, or MOV · up to 500 MB</small>
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
