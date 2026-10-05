"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Picture from "@/components/ui/Picture";

export type HeroSlide = { id: string; image: string; label: string };
const INTERVAL_MS = 7000;

// Full-bleed cinematic opener: slides cross-fade while the camera slowly pushes in, and the
// whole stage drifts a little slower than the page as you scroll. All motion stops for
// reduced-motion visitors and while the tab is hidden.
export default function Hero({ slides, children }: { slides: HeroSlide[]; children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, count, paused]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => { raf = 0; const y = Math.min(window.scrollY, window.innerHeight); el.style.transform = `translate3d(0, ${y * 0.18}px, 0)`; };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return <section className="hero" aria-label="Introduction">
    <div className="hero__stage" ref={stage} aria-hidden="true">
      {slides.map((slide, i) => <div key={slide.id} className={`hero__slide${i === index ? " is-active" : ""}`}>
        <Picture src={slide.image} alt="" fill priority={i === 0} sizes="100vw" quality={80} className="hero__img" />
      </div>)}
    </div>
    <div className="hero__shade" aria-hidden="true" />
    <div className="wrap hero__inner">{children}</div>
    {count > 1 && <div className="wrap hero__foot">
      <p className="hero__caption" aria-live="polite">{slides[index].label}</p>
      <div className="hero__progress" role="group" aria-label="Choose hero image">
        {slides.map((slide, i) => <button key={slide.id} type="button" className={i === index ? "is-active" : ""} aria-label={`Show image ${i + 1}${slide.label ? `: ${slide.label}` : ""}`} aria-current={i === index} onClick={() => setIndex(i)}><i style={i === index && !paused ? { animationDuration: `${INTERVAL_MS}ms` } : undefined} /></button>)}
      </div>
    </div>}
  </section>;
}
