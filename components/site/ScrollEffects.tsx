"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const REVEAL = "[data-r]";

// Two small behaviours shared by every public page:
//  - elements marked data-r ease in once as they scroll into view (below-the-fold only, so the
//    first paint is never hidden and no-JS visitors see everything);
//  - elements marked data-cursor="Label" show a glass cursor label on fine pointers.
export default function ScrollEffects() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);

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
      document.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
        if (el.dataset.reveal) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        const index = Number(el.dataset.r) || 0;
        el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 80}ms`);
        el.setAttribute("data-reveal", "pending");
        observer.observe(el);
      });
    });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [pathname]);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0, y = 0;
    const paint = () => { cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`; raf = 0; };
    const onMove = (event: PointerEvent) => {
      const host = (event.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      if (!host) { cursor.dataset.show = "false"; return; }
      cursor.textContent = host.dataset.cursor || "";
      cursor.dataset.show = "true";
      x = event.clientX + 18; y = event.clientY + 18;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onLeave = () => { cursor.dataset.show = "false"; };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return <div ref={cursorRef} className="cursor-label glass" data-show="false" aria-hidden="true" />;
}
