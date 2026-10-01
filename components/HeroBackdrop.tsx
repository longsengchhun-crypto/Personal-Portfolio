"use client";

import { useEffect, useState } from "react";

type Slide = { id: string; image: string; label: string };

const INTERVAL_MS = 6500;

export default function HeroBackdrop({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, count, paused]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return <>
    <div className="st-hero-slides" aria-hidden="true">
      {slides.map((slide, i) => <img key={slide.id} className={`st-hero-slide${i === index ? " is-active" : ""}`} src={slide.image} alt="" decoding="async" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />)}
    </div>
    {count > 1 && <div className="st-hero-pager" role="group" aria-label="Hero slides">
      <span className="st-hero-caption" aria-live="polite">{slides[index].label}</span>
      <div className="st-hero-dots">{slides.map((slide, i) => <button key={slide.id} type="button" className={i === index ? "is-active" : ""} aria-label={`Show slide ${i + 1}${slide.label ? `: ${slide.label}` : ""}`} aria-current={i === index} onClick={() => setIndex(i)} />)}</div>
    </div>}
  </>;
}
