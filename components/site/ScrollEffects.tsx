"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Elements marked data-r ease in once as they scroll into view. Only below-the-fold elements are
// hidden first, so the first paint is never blank and visitors without JavaScript see everything.
export default function ScrollEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-reveal", "in");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    const frame = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>("[data-r]").forEach((el) => {
        if (el.dataset.reveal) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) { el.setAttribute("data-reveal", "in"); return; }
        el.style.setProperty("--reveal-delay", `${Math.min(Number(el.dataset.r) || 0, 6) * 90}ms`);
        el.setAttribute("data-reveal", "pending");
        observer.observe(el);
      });
    });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [pathname]);

  return null;
}
