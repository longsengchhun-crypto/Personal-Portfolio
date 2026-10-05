"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Play } from "@/components/ui/Icon";

type Props =
  | { type: "local"; src: string; poster?: string }
  | { type: "embed"; src: string; label: string };

export default function ShowreelPlayer(props: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const videoRef = useRef<HTMLVideoElement>(null);

  // The video can finish loading (or fail) before React hydrates, in which case its events were
  // missed, so sync from the element's actual state on mount.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.error) setStatus("error");
    else if (video.readyState >= 2) setStatus("ready");
  }, []);

  if (props.type === "embed") {
    return <div className="stage"><iframe src={props.src} title={props.label} loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen /></div>;
  }

  return <div className="stage">
    <video ref={videoRef} controls playsInline preload="metadata" poster={props.poster} onLoadedData={() => setStatus("ready")} onError={() => setStatus("error")}>
      <source src={props.src} type="video/mp4" />
    </video>
    {status !== "ready" && <div className="stage__status" role="status" aria-live="polite">
      {status === "loading" ? <><Play aria-hidden="true" /><span>Loading showreel…</span></> : <><AlertTriangle aria-hidden="true" /><span>The showreel could not be loaded. Please try again shortly, or browse the work instead.</span></>}
    </div>}
  </div>;
}
