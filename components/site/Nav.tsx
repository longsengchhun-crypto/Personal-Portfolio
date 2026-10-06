"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Work", href: "/portfolio/" },
  { label: "About", href: "/about/" },
  { label: "Services", href: "/services/" },
  { label: "Showreel", href: "/showreel/" },
  { label: "Contact", href: "/contact/" },
] as const;

const isActive = (href: string, path: string) => path.startsWith(href);

// Minimal editorial header: the name on the left, five links on the right. On small screens the
// links move into a full-screen sheet that locks scrolling and closes on Escape or navigation.
export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.documentElement.style.overflow = ""; };
  }, [open]);

  return <header className="nav" data-scrolled={scrolled || undefined} data-open={open || undefined}>
    <nav className="nav__bar" aria-label="Primary">
      <Link href="/" className="nav__brand" aria-label="LONG SENGCHHUN — home">Long Sengchhun</Link>
      <ul className="nav__links" id="nav-links">
        {LINKS.map((link) => <li key={link.href}><Link href={link.href} className="nav__link" aria-current={isActive(link.href, path) ? "page" : undefined}>{link.label}</Link></li>)}
      </ul>
      <button type="button" className="nav__toggle" aria-expanded={open} aria-controls="nav-sheet" onClick={() => setOpen((value) => !value)}>
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span><i aria-hidden="true" /><i aria-hidden="true" />
      </button>
    </nav>
    <div className="nav__sheet" id="nav-sheet" hidden={!open}>
      <ul>{LINKS.map((link, index) => <li key={link.href} style={{ "--i": index } as React.CSSProperties}><Link href={link.href} aria-current={isActive(link.href, path) ? "page" : undefined}>{link.label}</Link></li>)}</ul>
    </div>
  </header>;
}
