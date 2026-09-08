"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KHMER } from "@/lib/content";

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

function AccountControl({ isAdmin, customerName }: { isAdmin: boolean; customerName: string | null }) {
  if (isAdmin) return <Link className="nav-account-pill nav-account-admin" href="/dashboard/"><i className="bi bi-speedometer2" /><span>Admin</span></Link>;
  if (customerName) return <Link className="nav-account-pill" href="/3d-store/account/"><i className="bi bi-person-circle" /><span>{customerName.split(" ")[0] || "Account"}</span></Link>;
  return <Link className="nav-account-pill" href="/3d-store/account/login/"><i className="bi bi-person" /><span>Sign In</span></Link>;
}

export default function Nav({ isAdmin, customerName }: { isAdmin: boolean; customerName: string | null }) {
  return <>
    <nav className="navbar navbar-expand-lg portfolio-nav fixed-top" aria-label="Primary navigation">
      <div className="container">
        <Link className="navbar-brand" href="/"><span>LONG SENGCHHUN</span><small>Creative Designer</small></Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileNav" aria-controls="mobileNav" aria-label="Open navigation"><span className="navbar-toggler-icon" /></button>
        <div className="collapse navbar-collapse justify-content-end"><ul className="navbar-nav"><NavLinks /></ul><AccountControl isAdmin={isAdmin} customerName={customerName} /><button className="theme-toggle" type="button" aria-label="Toggle light and dark mode" title="Toggle theme"><i className="bi bi-moon-stars" /></button></div>
      </div>
    </nav>
    <div className="offcanvas offcanvas-end mobile-drawer" tabIndex={-1} id="mobileNav" aria-labelledby="mobileNavLabel">
      <div className="offcanvas-header"><h2 className="offcanvas-title h5" id="mobileNavLabel">LONG SENGCHHUN</h2><button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" /></div>
      <div className="offcanvas-body"><ul className="navbar-nav mobile-nav-list"><NavLinks /></ul><AccountControl isAdmin={isAdmin} customerName={customerName} /><button className="theme-toggle mobile-theme-toggle" type="button" aria-label="Toggle light and dark mode"><i className="bi bi-moon-stars" /><span>Theme</span></button></div>
    </div>
  </>;
}
