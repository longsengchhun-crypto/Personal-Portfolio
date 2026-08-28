"use client";

import { useEffect, useState } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string; alt?: string; poster?: string;
        "camera-controls"?: boolean; "auto-rotate"?: boolean; "shadow-intensity"?: string;
        ar?: boolean; exposure?: string; loading?: "auto" | "lazy" | "eager";
      };
    }
  }
}

export default function ModelViewer({ src, alt, poster }: { src: string; alt: string; poster?: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [registered, setRegistered] = useState(false);

  // The model-viewer package registers a browser-only custom element and references
  // `self`/`window` at module load time — it must never be imported during SSR/module
  // evaluation (that's what caused an intermittent "ReferenceError: self is not defined"
  // in production). Importing it only inside a client-side effect keeps it out of any
  // server-rendered module graph entirely.
  useEffect(() => {
    let cancelled = false;
    import("@google/model-viewer").then(() => { if (!cancelled) setRegistered(true); });
    return () => { cancelled = true; };
  }, []);

  // A malformed or non-model file in this slot won't always fire model-viewer's own error
  // event, so this bounds the spinner instead of leaving visitors staring at it forever.
  useEffect(() => {
    if (!registered) return;
    const timer = window.setTimeout(() => setStatus((current) => (current === "loading" ? "error" : current)), 15000);
    return () => window.clearTimeout(timer);
  }, [registered, src]);

  if (!registered) return <div className="model-viewer-frame"><div className="showreel-status-overlay" role="status" aria-live="polite"><span className="showreel-spinner" aria-hidden="true" /><span>Loading 3D preview…</span></div></div>;

  return <div className="model-viewer-frame">
    {/* @ts-expect-error -- model-viewer is a custom element registered by the imported package */}
    <model-viewer
      src={src}
      alt={alt}
      poster={poster}
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      loading="eager"
      onLoad={() => setStatus("ready")}
      onError={() => setStatus("error")}
    />
    {status !== "ready" && <div className="showreel-status-overlay" role="status" aria-live="polite">
      {status === "loading" ? <><span className="showreel-spinner" aria-hidden="true" /><span>Loading 3D preview…</span></> : <><i className="bi bi-exclamation-triangle" aria-hidden="true" /><span>The interactive preview could not be loaded.</span></>}
    </div>}
    <p className="model-viewer-hint"><i className="bi bi-arrows-move" /> Drag to rotate · Scroll to zoom</p>
  </div>;
}
