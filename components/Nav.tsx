"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KHMER } from "@/lib/content";

const links = [
  ["Home", KHMER.home, "/"], ["Work", KHMER.work, "/portfolio/"],
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

export default function Nav() {
  return <>
    <nav className="navbar navbar-expand-lg portfolio-nav fixed-top" aria-label="Primary navigation">
      <div className="container">
        <Link className="navbar-brand" href="/"><span>LONG SENGCHHUN</span><small>Creative Designer</small></Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileNav" aria-controls="mobileNav" aria-label="Open navigation"><span className="navbar-toggler-icon" /></button>
        <div className="collapse navbar-collapse justify-content-end"><ul className="navbar-nav"><NavLinks /></ul><button className="theme-toggle" type="button" aria-label="Toggle light and dark mode" title="Toggle theme"><i className="bi bi-moon-stars" /></button></div>
      </div>
    </nav>
    <div className="offcanvas offcanvas-end mobile-drawer" tabIndex={-1} id="mobileNav" aria-labelledby="mobileNavLabel">
      <div className="offcanvas-header"><h2 className="offcanvas-title h5" id="mobileNavLabel">LONG SENGCHHUN</h2><button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" /></div>
      <div className="offcanvas-body"><ul className="navbar-nav mobile-nav-list"><NavLinks /></ul><button className="theme-toggle mobile-theme-toggle" type="button" aria-label="Toggle light and dark mode"><i className="bi bi-moon-stars" /><span>Theme</span></button></div>
    </div>
  </>;
}
