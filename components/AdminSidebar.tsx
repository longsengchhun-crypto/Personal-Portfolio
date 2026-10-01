"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { section: string; links: [string, string, string][] }[] = [
  { section: "Daily operations", links: [["bi-speedometer2", "Overview", "/dashboard/"], ["bi-people", "Clients", "/dashboard/clients/"]] },
  { section: "Content", links: [["bi-images", "Projects", "/dashboard/portfolio/"], ["bi-easel2", "Hero slides", "/dashboard/hero/"], ["bi-pencil-square", "Site content", "/dashboard/content/"]] },
];

function SidebarContent() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/dashboard/" ? pathname === "/dashboard/" : pathname.startsWith(href));
  return <>
    <nav className="admin-sidebar-nav" aria-label="Admin">
      {NAV.map((group) => <div className="admin-sidebar-group" key={group.section}>
        <p>{group.section}</p>
        <ul>{group.links.map(([icon, label, href]) => <li key={href}><Link className={isActive(href) ? "is-active" : ""} aria-current={isActive(href) ? "page" : undefined} href={href}><i className={`bi ${icon}`} />{label}</Link></li>)}</ul>
      </div>)}
    </nav>
    <div className="admin-sidebar-foot">
      <Link href="/"><i className="bi bi-box-arrow-up-right" />View live site</Link>
      <form method="post" action="/api/dashboard/logout/"><button type="submit"><i className="bi bi-box-arrow-right" />Log out</button></form>
    </div>
  </>;
}

export default function AdminSidebar() {
  return <>
    <aside className="admin-sidebar">
      <Link className="admin-sidebar-brand" href="/dashboard/"><span>LONG SENGCHHUN</span><small>Admin</small></Link>
      <SidebarContent />
    </aside>
    <button className="admin-mobile-toggle" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminMobileNav" aria-controls="adminMobileNav" aria-label="Open admin menu"><i className="bi bi-list" /></button>
    <div className="offcanvas offcanvas-start admin-mobile-drawer" tabIndex={-1} id="adminMobileNav">
      <div className="offcanvas-header"><h2 className="offcanvas-title h6">Admin</h2><button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close" /></div>
      <div className="offcanvas-body"><SidebarContent /></div>
    </div>
  </>;
}
