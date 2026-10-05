"use client";

import { useEffect, useRef } from "react";

// Muted, looping, and only running while on screen. Reduced-motion visitors get the poster frame.
export default function AutoVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.preload = "auto"; el.play().catch(() => {}); } else el.pause();
    }, { rootMargin: "120px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <video ref={video} className={className} muted loop playsInline preload="none" poster={poster} aria-hidden="true" tabIndex={-1}><source src={src} type="video/mp4" /></video>;
}
