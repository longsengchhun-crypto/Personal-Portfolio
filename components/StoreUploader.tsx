"use client";

import { useRef, useState } from "react";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The browser's native `accept` attribute only filters the file-picker dialog — drag-and-drop
// bypasses it entirely, so a JPG dropped onto the "GLB preview" slot uploads with no complaint.
// This checks the real file against the same accept list on both paths.
function isAcceptedFile(file: File, accept: string) {
  const rules = accept.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return rules.some((rule) => (rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

type Status = "idle" | "uploading" | "done" | "error";

type PublicMediaResult = { publicUrl: string; path: string };
type PrivateFileResult = { path: string; fileName: string; fileSize: number };

type Props =
  | { mode: "media"; kind: "image" | "video" | "model"; accept: string; label: string; onUploaded: (result: PublicMediaResult) => void }
  | { mode: "file"; accept: string; label: string; onUploaded: (result: PrivateFileResult) => void };

export default function StoreUploader(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  async function putToSignedUrl(signedUrl: string, file: File) {
    const formData = new FormData();
    formData.append("cacheControl", "3600");
    formData.append("", file);
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("apikey", ANON_KEY);
      xhr.setRequestHeader("Authorization", `Bearer ${ANON_KEY}`);
      xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}).`)));
      xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
      xhr.send(formData);
    });
  }

  async function upload(file: File) {
    if (!isAcceptedFile(file, props.accept)) {
      setFileInfo({ name: file.name, size: file.size });
      setError(`"${file.name}" isn't one of the accepted file types (${props.accept}). Nothing was uploaded.`);
      setStatus("error");
      return;
    }
    setError("");
    setFileInfo({ name: file.name, size: file.size });
    setStatus("uploading");
    setProgress(0);
    try {
      if (props.mode === "media") {
        const prep = await fetch("/api/dashboard/store/media-upload-url/", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type, kind: props.kind }),
        }).then((res) => res.json());
        if (prep.error) throw new Error(prep.error);
        await putToSignedUrl(prep.signedUrl, file);
        setStatus("done");
        props.onUploaded({ publicUrl: prep.publicUrl, path: prep.path });
      } else {
        const prep = await fetch("/api/dashboard/store/file-upload-url/", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name }),
        }).then((res) => res.json());
        if (prep.error) throw new Error(prep.error);
        await putToSignedUrl(prep.signedUrl, file);
        setStatus("done");
        props.onUploaded({ path: prep.path, fileName: prep.fileName, fileSize: file.size });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
      setStatus("error");
    }
  }

  return <div
    className={`showreel-dropzone store-uploader${isDragging ? " is-dragging" : ""}`}
    onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
    onDragLeave={() => setIsDragging(false)}
    onDrop={(event) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void upload(file);
    }}
  >
    <i className="bi bi-cloud-upload" aria-hidden="true" />
    <p><strong>{props.label}</strong></p>
    <button className="btn btn-outline-light" type="button" onClick={() => inputRef.current?.click()} disabled={status === "uploading"}>Select File</button>
    <input ref={inputRef} type="file" accept={props.accept} hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} />

    {fileInfo && status !== "idle" && <div className="showreel-upload-status">
      <div><strong>{fileInfo.name}</strong><span>{formatBytes(fileInfo.size)}</span></div>
      {status === "uploading" && <><div className="showreel-progress-bar"><div style={{ width: `${progress}%` }} /></div><small>Uploading… {progress}%</small></>}
      {status === "done" && <small className="is-ready"><i className="bi bi-check2-circle" /> Uploaded</small>}
      {status === "error" && <small className="needs-setup"><i className="bi bi-exclamation-triangle" /> {error}<button className="btn btn-quiet" type="button" onClick={() => inputRef.current?.click()}>Retry</button></small>}
    </div>}
  </div>;
}
