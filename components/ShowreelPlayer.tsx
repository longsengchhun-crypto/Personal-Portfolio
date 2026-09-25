"use client";

import { useEffect, useRef, useState } from "react";

type Props =
  | { type: "local"; src: string; poster?: string }
  | { type: "embed"; src: string; label: string };

export default function ShowreelPlayer(props: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const videoRef = useRef<HTMLVideoElement>(null);

  // The video can finish loading (or fail) before React hydrates, in which case its events were
  // missed — sync from the element's actual state on mount so the overlay never gets stuck.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.error) setStatus("error");
    else if (video.readyState >= 2) setStatus("ready");
  }, []);

  if (props.type === "embed") {
    return <div className="video-embed showreel-frame">
      <iframe src={props.src} title={props.label} loading="lazy" allowFullScreen />
    </div>;
  }

  return <div className="detail-video-frame showreel-frame">
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      poster={props.poster}
      onLoadedData={() => setStatus("ready")}
      onError={() => setStatus("error")}
    >
      <source src={props.src} type="video/mp4" />
    </video>
    {status !== "ready" && <div className="showreel-status-overlay" role="status" aria-live="polite">
      {status === "loading" ? <><span className="showreel-spinner" aria-hidden="true" /><span>Loading showreel…</span></> : <><i className="bi bi-exclamation-triangle" aria-hidden="true" /><span>The showreel could not be loaded. Please try again shortly or browse the portfolio instead.</span></>}
    </div>}
  </div>;
}
