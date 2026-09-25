"use client";

import { useCallback, useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/heroSlides";

const INTERVAL_MS = 6000;

export default function HeroSlider({ slides, children }: { slides: HeroSlide[]; children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count]);

  return <section
    className="hero-slider"
    aria-roledescription="carousel"
    aria-label="Featured creative disciplines"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)}
    onBlur={() => setPaused(false)}
  >
    <div className="hero-slides" aria-live={paused ? "polite" : "off"}>
      {slides.map((slide, i) => <div
        className={`hero-slide${i === index ? " is-active" : ""}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${count}: ${slide.label}`}
        aria-hidden={i !== index}
        key={slide.image}
      >
        <img src={slide.image} alt={slide.alt} decoding="async" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
      </div>)}
    </div>
    <div className="hero-slider-shade" aria-hidden="true" />
    <div className="container hero-slider-content">
      <div className="hero-copy">{children}</div>
    </div>
    {count > 1 && <div className="hero-slider-controls">
      <button type="button" className="hero-arrow" aria-label="Previous slide" onClick={() => go(index - 1)}><i className="bi bi-chevron-left" /></button>
      <div className="hero-dots" role="tablist" aria-label="Choose slide">
        {slides.map((slide, i) => <button
          type="button" role="tab" aria-selected={i === index} aria-label={slide.label}
          className={`hero-dot${i === index ? " is-active" : ""}`}
          onClick={() => go(i)} key={slide.image}
        ><span /></button>)}
      </div>
      <button type="button" className="hero-arrow" aria-label="Next slide" onClick={() => go(index + 1)}><i className="bi bi-chevron-right" /></button>
      <span className="hero-slide-label">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} — {slides[index].label}</span>
    </div>}
  </section>;
}
