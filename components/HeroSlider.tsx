"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Slide = { id: string; image: string; label: string };

const INTERVAL_MS = 6000;
const FADE_MS = 1600;

export default function HeroSlider({ slides, children, variant }: { slides: Slide[]; children: React.ReactNode; variant?: "band" }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const current = useRef(0);
  const leaveTimer = useRef<number | undefined>(undefined);

  const go = useCallback((next: number) => {
    const target = ((next % count) + count) % count;
    if (target === current.current) return;
    // Keep the outgoing slide mounted (and still drifting) while it fades out, so its motion
    // never snaps back to the start mid-fade.
    setLeaving(current.current);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setLeaving(null), FADE_MS + 100);
    current.current = target;
    setIndex(target);
  }, [count]);

  // Autoplay always runs — reduced-motion users still get the (calm) crossfade, just without the
  // zoom/parallax drift, which is handled in CSS.
  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setTimeout(() => go(current.current + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count, go]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  return <section
    className={`hero-slider${variant === "band" ? " hero-slider--band" : ""}`}
    aria-roledescription="carousel"
    aria-label="Featured creative disciplines"
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)}
    onBlur={() => setPaused(false)}
  >
    <div className="hero-slides" aria-live={paused ? "polite" : "off"}>
      {slides.map((slide, i) => <div
        className={`hero-slide ${i % 2 ? "drift-b" : "drift-a"}${i === index ? " is-active" : ""}${i === leaving ? " is-leaving" : ""}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${count}: ${slide.label}`}
        aria-hidden={i !== index}
        key={slide.id}
      >
        <img src={slide.image} alt={slide.label} decoding="async" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
      </div>)}
    </div>
    <div className="hero-slider-shade" aria-hidden="true" />
    <div className="hero-slider-sweep" key={`sweep-${index}`} aria-hidden="true" />
    <div className="container hero-slider-content">
      <div className="hero-copy">{children}</div>
    </div>
    {count > 1 && <div className="hero-slider-controls">
      <button type="button" className="hero-arrow" aria-label="Previous slide" onClick={() => go(index - 1)}><i className="bi bi-chevron-left" /></button>
      <div className="hero-dots" role="tablist" aria-label="Choose slide">
        {slides.map((slide, i) => <button
          type="button" role="tab" aria-selected={i === index} aria-label={slide.label || `Slide ${i + 1}`}
          className={`hero-dot${i === index ? " is-active" : ""}`}
          onClick={() => go(i)} key={slide.id}
        ><span key={i === index ? `on-${index}` : "off"} /></button>)}
      </div>
      <button type="button" className="hero-arrow" aria-label="Next slide" onClick={() => go(index + 1)}><i className="bi bi-chevron-right" /></button>
      <span className="hero-slide-label" key={`label-${index}`}><b>{String(index + 1).padStart(2, "0")}</b> / {String(count).padStart(2, "0")}{slides[index].label ? <> — <em>{slides[index].label}</em></> : null}</span>
    </div>}
  </section>;
}
