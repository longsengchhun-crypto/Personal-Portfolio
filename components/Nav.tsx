"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OWNER } from "@/lib/content";

type Item = { label: string; href: string; external?: boolean; note?: string };
type NavEntry = { label: string; href?: string; match?: string[]; items?: Item[] };

const NAV: NavEntry[] = [
  { label: "Home", href: "/" },
  { label: "Work", match: ["/portfolio/", "/showreel/"], items: [
    { label: "Selected work", href: "/portfolio/", note: "Projects and case studies" },
    { label: "Showreel", href: "/showreel/", note: "Motion, VFX and 3D reel" },
  ] },
  { label: "Plugins", match: [], items: [
    { label: "LASTFX Studio", href: "https://lastfxstudio.com", external: true, note: "lastfxstudio.com" },
  ] },
  { label: "Services", href: "/services/" },
  { label: "About", href: "/about/" },
  { label: "Contact", href: "/contact/" },
];

type Session = { isAdmin: boolean; customerName: string | null };

// Fetched client-side so the root layout never reads cookies, which would force every page to
// render dynamically and block caching.
function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/session/").then((res) => res.json()).then((data: Session) => { if (!cancelled) setSession(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return session;
}

function AccountControl({ session }: { session: Session | null }) {
  if (session?.isAdmin) return <Link className="nav-account-pill nav-account-admin" href="/dashboard/"><i className="bi bi-speedometer2" /><span>Admin</span></Link>;
  if (session?.customerName) return <Link className="nav-account-pill" href="/account/"><i className="bi bi-person-circle" /><span>{session.customerName.split(" ")[0] || "Account"}</span></Link>;
  return <Link className="nav-account-pill" href="/account/login/"><i className="bi bi-person" /><span>Sign in</span></Link>;
}

function ThemeSwitch({ className = "" }: { className?: string }) {
  return <button className={`theme-toggle theme-switch ${className}`} type="button" aria-label="Switch between light and dark theme" title="Switch theme">
    <svg className="theme-switch-sun" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    <svg className="theme-switch-moon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
    <span className="theme-switch-thumb" aria-hidden="true" />
  </button>;
}

function isActive(entry: NavEntry, path: string) {
  if (entry.href) return entry.href === "/" ? path === "/" : path.startsWith(entry.href);
  return (entry.match ?? []).some((prefix) => path.startsWith(prefix));
}

function DesktopDropdown({ entry, path }: { entry: NavEntry; path: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const show = () => { window.clearTimeout(timer.current); setOpen(true); };
  const hide = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), 140); };

  return <li className={`nav-item nav-drop${open ? " is-open" : ""}`} ref={ref} onMouseEnter={show} onMouseLeave={hide}
    onBlur={(event) => { if (!ref.current?.contains(event.relatedTarget as Node)) setOpen(false); }}
    onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
    <button type="button" className={`nav-link nav-drop-toggle${isActive(entry, path) ? " active" : ""}`} aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span>{entry.label}</span><svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    <ul className="nav-drop-menu">{entry.items!.map((item) => <li key={item.href}>
      {item.external
        ? <a href={item.href} target="_blank" rel="noopener noreferrer"><strong>{item.label}<span aria-hidden="true"> &#8599;</span></strong>{item.note && <small>{item.note}</small>}</a>
        : <Link href={item.href}><strong>{item.label}</strong>{item.note && <small>{item.note}</small>}</Link>}
    </li>)}</ul>
  </li>;
}

function DesktopLinks({ path }: { path: string }) {
  return <ul className="navbar-nav nav-desktop">{NAV.map((entry) => entry.items
    ? <DesktopDropdown entry={entry} path={path} key={entry.label} />
    : <li className="nav-item" key={entry.label}><Link className={`nav-link${isActive(entry, path) ? " active" : ""}`} href={entry.href!}><span>{entry.label}</span></Link></li>)}</ul>;
}

function MobileLinks({ path }: { path: string }) {
  return <ul className="navbar-nav mobile-nav-list">{NAV.map((entry) => entry.items
    ? <li className="mobile-nav-group" key={entry.label}>
      <p>{entry.label}</p>
      <ul>{entry.items.map((item) => <li key={item.href}>{item.external
        ? <a className="nav-link" href={item.href} target="_blank" rel="noopener noreferrer">{item.label} <span aria-hidden="true">&#8599;</span></a>
        : <Link className={`nav-link${path.startsWith(item.href) ? " active" : ""}`} href={item.href} data-bs-dismiss="offcanvas">{item.label}</Link>}</li>)}</ul>
    </li>
    : <li className="nav-item" key={entry.label}><Link className={`nav-link${isActive(entry, path) ? " active" : ""}`} href={entry.href!} data-bs-dismiss="offcanvas"><span>{entry.label}</span></Link></li>)}</ul>;
}

export default function Nav() {
  const session = useSession();
  const path = usePathname();
  return <>
    <nav className="navbar navbar-expand-lg portfolio-nav fixed-top" aria-label="Primary navigation">
      <div className="container">
        <Link className="navbar-brand" href="/"><span>LONG SENGCHHUN</span><small>{OWNER.title}</small></Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileNav" aria-controls="mobileNav" aria-label="Open navigation"><span className="navbar-toggler-icon" /></button>
        <div className="collapse navbar-collapse justify-content-end"><DesktopLinks path={path} /><AccountControl session={session} /><ThemeSwitch /></div>
      </div>
    </nav>
    <div className="offcanvas offcanvas-end mobile-drawer" tabIndex={-1} id="mobileNav" aria-labelledby="mobileNavLabel">
      <div className="offcanvas-header"><h2 className="offcanvas-title h5" id="mobileNavLabel">LONG SENGCHHUN</h2><button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" /></div>
      <div className="offcanvas-body"><MobileLinks path={path} /><div className="mobile-nav-foot"><AccountControl session={session} /><ThemeSwitch className="mobile-theme-toggle" /></div></div>
    </div>
  </>;
}
