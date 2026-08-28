"use client";

import { useRef, useState } from "react";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PaymentProofForm({ accessToken }: { accessToken: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [screenshotPath, setScreenshotPath] = useState("");
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    setFileInfo({ name: file.name, size: file.size });
    setStatus("uploading");
    setProgress(0);
    try {
      const prep = await fetch("/api/store/payment-upload-url/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, contentType: file.type }),
      }).then((r) => r.json());
      if (prep.error) throw new Error(prep.error);

      const formData = new FormData();
      formData.append("cacheControl", "3600");
      formData.append("", file);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", prep.signedUrl);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("apikey", ANON_KEY);
        xhr.setRequestHeader("Authorization", `Bearer ${ANON_KEY}`);
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}).`)));
        xhr.onerror = () => reject(new Error("Upload failed."));
        xhr.send(formData);
      });
      setScreenshotPath(prep.path);
      setStatus("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
      setStatus("error");
    }
  }

  return <form method="post" action={`/api/store/orders/${accessToken}/payment/`} className="inquiry-form">
    <div className="form-field"><label htmlFor="payment_reference">Payment reference / transaction ID</label><input className="form-control" id="payment_reference" name="payment_reference" placeholder="From your ABA app receipt" /></div>

    <div className="form-field wide" style={{ marginTop: 14 }}>
      <label>Payment screenshot</label>
      <input type="hidden" name="payment_screenshot" value={screenshotPath} />
      <div className="showreel-dropzone store-uploader" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void upload(f); }}>
        <i className="bi bi-camera" aria-hidden="true" />
        <p><strong>Drop your ABA payment screenshot</strong></p>
        <button className="btn btn-outline-light" type="button" onClick={() => inputRef.current?.click()} disabled={status === "uploading"}>Select Screenshot</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      </div>
      {fileInfo && status !== "idle" && <div className="showreel-upload-status">
        <div><strong>{fileInfo.name}</strong><span>{formatBytes(fileInfo.size)}</span></div>
        {status === "uploading" && <><div className="showreel-progress-bar"><div style={{ width: `${progress}%` }} /></div><small>Uploading… {progress}%</small></>}
        {status === "done" && <small className="is-ready"><i className="bi bi-check2-circle" /> Uploaded</small>}
        {status === "error" && <small className="needs-setup"><i className="bi bi-exclamation-triangle" /> {error}</small>}
      </div>}
    </div>

    <button className="btn btn-accent" type="submit" disabled={status === "uploading"} style={{ marginTop: 18, width: "100%", justifyContent: "center" }}>I've Paid — Submit for Review</button>
  </form>;
}
