"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCartIds, onCartChange } from "@/lib/cart";
import { KHMER, OWNER } from "@/lib/content";

const links = [
  ["Home", KHMER.home, "/"], ["Showreel", KHMER.showreel, "/showreel/"], ["Work", KHMER.work, "/portfolio/"],
  ["3D Store", KHMER.store, "/3d-store/"],
  ["Services", KHMER.services, "/services/"], ["About", KHMER.about, "/about/"],
  ["Contact", KHMER.contact, "/contact/"],
] as const;

function NavLinks() {
  const path = usePathname();
  return links.map(([label, khmer, href]) => {
    const active = href === "/" ? path === "/" : path.startsWith(href);
    return <li className="nav-item" key={href}><Link className={`nav-link ${active ? "active" : ""}`} href={href}><span>{label}</span><small>{khmer}</small></Link></li>;
  });
}

function CartLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const sync = () => setCount(getCartIds().length);
    sync();
    return onCartChange(sync);
  }, []);
  return <Link className="nav-cart-link" href="/3d-store/cart/" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}><i className="bi bi-cart3" />{count > 0 && <span className="nav-cart-badge">{count}</span>}</Link>;
}

type Session = { isAdmin: boolean; customerName: string | null };

// Fetched client-side (rather than passed down from the server layout) specifically so the
// root layout no longer has to read cookies during render — a Next.js "dynamic API" read
// anywhere in a route's layout tree forces that entire route to render fully dynamically on
// every request, with no caching, which was blocking every page on the site (including
// near-static ones like the homepage) from ever being cached or served from the edge.
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
  if (session?.customerName) return <Link className="nav-account-pill" href="/3d-store/account/"><i className="bi bi-person-circle" /><span>{session.customerName.split(" ")[0] || "Account"}</span></Link>;
  return <Link className="nav-account-pill" href="/3d-store/account/login/"><i className="bi bi-person" /><span>Sign In</span></Link>;
}

export default function Nav() {
  const session = useSession();
  return <>
    <nav className="navbar navbar-expand-lg portfolio-nav fixed-top" aria-label="Primary navigation">
      <div className="container">
        <Link className="navbar-brand" href="/"><span>LONG SENGCHHUN</span><small>{OWNER.title}</small></Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileNav" aria-controls="mobileNav" aria-label="Open navigation"><span className="navbar-toggler-icon" /></button>
        <div className="collapse navbar-collapse justify-content-end"><ul className="navbar-nav"><NavLinks /></ul><CartLink /><AccountControl session={session} /><button className="theme-toggle" type="button" aria-label="Toggle light and dark mode" title="Toggle theme"><i className="bi bi-moon-stars" /></button></div>
      </div>
    </nav>
    <div className="offcanvas offcanvas-end mobile-drawer" tabIndex={-1} id="mobileNav" aria-labelledby="mobileNavLabel">
      <div className="offcanvas-header"><h2 className="offcanvas-title h5" id="mobileNavLabel">LONG SENGCHHUN</h2><button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" /></div>
      <div className="offcanvas-body"><ul className="navbar-nav mobile-nav-list"><NavLinks /></ul><CartLink /><AccountControl session={session} /><button className="theme-toggle mobile-theme-toggle" type="button" aria-label="Toggle light and dark mode"><i className="bi bi-moon-stars" /><span>Theme</span></button></div>
    </div>
  </>;
}
