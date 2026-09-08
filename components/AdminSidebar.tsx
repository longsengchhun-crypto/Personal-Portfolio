"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { section: string; links: [string, string, string][] }[] = [
  { section: "Overview", links: [["bi-speedometer2", "Dashboard", "/dashboard/"]] },
  { section: "Content", links: [["bi-pencil-square", "Site Content", "/dashboard/content/"]] },
  {
    section: "3D Store",
    links: [
      ["bi-box-seam", "Products", "/dashboard/store/"],
      ["bi-receipt", "Orders", "/dashboard/store/orders/"],
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/dashboard/" ? pathname === "/dashboard/" : pathname.startsWith(href));

  return <>
    <aside className="admin-sidebar">
      <Link className="admin-sidebar-brand" href="/dashboard/"><span>LONG SENGCHHUN</span><small>Operations Console</small></Link>
      <nav className="admin-sidebar-nav">
        {NAV.map((group) => <div className="admin-sidebar-group" key={group.section}>
          <p>{group.section}</p>
          <ul>{group.links.map(([icon, label, href]) => <li key={href}><Link className={isActive(href) ? "is-active" : ""} href={href}><i className={`bi ${icon}`} />{label}</Link></li>)}</ul>
        </div>)}
      </nav>
      <div className="admin-sidebar-foot">
        <a href="https://supabase.com/dashboard/project/dyjzccnatslknumnbplj/editor" target="_blank" rel="noreferrer"><i className="bi bi-sliders" />Supabase</a>
        <Link href="/"><i className="bi bi-box-arrow-up-right" />View Live Site</Link>
        <form method="post" action="/api/dashboard/logout/"><button type="submit"><i className="bi bi-box-arrow-right" />Log Out</button></form>
      </div>
    </aside>
    <button className="admin-mobile-toggle" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminMobileNav" aria-controls="adminMobileNav" aria-label="Open admin menu"><i className="bi bi-list" /></button>
    <div className="offcanvas offcanvas-start admin-mobile-drawer" tabIndex={-1} id="adminMobileNav">
      <div className="offcanvas-header"><h2 className="offcanvas-title h6">Operations Console</h2><button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" /></div>
      <div className="offcanvas-body">
        <nav className="admin-sidebar-nav">
          {NAV.map((group) => <div className="admin-sidebar-group" key={group.section}>
            <p>{group.section}</p>
            <ul>{group.links.map(([icon, label, href]) => <li key={href}><Link className={isActive(href) ? "is-active" : ""} href={href}><i className={`bi ${icon}`} />{label}</Link></li>)}</ul>
          </div>)}
        </nav>
        <div className="admin-sidebar-foot">
          <a href="https://supabase.com/dashboard/project/dyjzccnatslknumnbplj/editor" target="_blank" rel="noreferrer"><i className="bi bi-sliders" />Supabase</a>
          <Link href="/"><i className="bi bi-box-arrow-up-right" />View Live Site</Link>
          <form method="post" action="/api/dashboard/logout/"><button type="submit"><i className="bi bi-box-arrow-right" />Log Out</button></form>
        </div>
      </div>
    </div>
  </>;
}
