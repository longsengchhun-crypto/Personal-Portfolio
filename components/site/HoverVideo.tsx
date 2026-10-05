"use client";

import { useEffect, useRef } from "react";

// A muted looping preview that only plays while the pointer or keyboard focus is on its tile, and
// never for visitors who prefer reduced motion. Nothing downloads until first interaction.
export default function HoverVideo({ src, poster }: { src: string; poster?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current;
    const host = el?.closest<HTMLElement>("[data-tile]");
    if (!el || !host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const play = () => { el.preload = "auto"; el.play().catch(() => {}); };
    const stop = () => { el.pause(); el.currentTime = 0; };
    host.addEventListener("pointerenter", play);
    host.addEventListener("pointerleave", stop);
    host.addEventListener("focusin", play);
    host.addEventListener("focusout", stop);
    return () => { host.removeEventListener("pointerenter", play); host.removeEventListener("pointerleave", stop); host.removeEventListener("focusin", play); host.removeEventListener("focusout", stop); };
  }, []);
  return <video ref={video} className="tile__video" muted loop playsInline preload="none" poster={poster} aria-hidden="true" tabIndex={-1}><source src={src} type="video/mp4" /></video>;
}
