"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TARGETS = ".reveal, .st-section .container > *, .st-tile, .st-rows li, .st-steps li, .st-index li, .project-card, .service-item, .skill-group, .collection-head, .inquiry-form";

export default function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute("data-reveal", "in");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    const frame = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
        if (el.closest(".st-hero, .admin-shell, .success-celebration")) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
        el.style.setProperty("--reveal-delay", `${Math.min(siblings.indexOf(el), 5) * 70}ms`);
        el.setAttribute("data-reveal", "pending");
        observer.observe(el);
      });
    });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [pathname]);
  return null;
}
