"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about/" },
  { label: "Services", href: "/services/" },
  { label: "Contact", href: "/contact/" },
] as const;

const isActive = (href: string, path: string) => (href === "/" ? path === "/" : path.startsWith(href));

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return <header className="nav" data-open={open || undefined}>
    <div className="nav__bar wrap">
      <Link href="/" className="nav__brand" aria-label="LONG SENGCHHUN, home">Long Sengchhun</Link>
      <nav aria-label="Primary" id="primary-nav" className="nav__links">
        <ul>{LINKS.map((link) => <li key={link.href}><Link href={link.href} className="nav__link" aria-current={isActive(link.href, path) ? "page" : undefined}>{link.label}</Link></li>)}</ul>
      </nav>
      <div className="nav__tools">
        <ThemeToggle />
        <button type="button" className="nav__toggle" aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Menu"}</button>
      </div>
    </div>
  </header>;
}
