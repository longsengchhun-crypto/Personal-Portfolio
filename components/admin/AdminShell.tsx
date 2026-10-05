"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Command, LogOut, MoreHorizontal, Search } from "@/components/ui/Icon";
import Dialog from "@/components/ui/Dialog";
import ThemeToggle from "@/components/site/ThemeToggle";
import CommandMenu from "./CommandMenu";
import { ADMIN_NAV, isNavActive } from "./navigation";

type Counts = { unread: number; drafts: number };

function useCounts(path: string) {
  const [counts, setCounts] = useState<Counts>({ unread: 0, drafts: 0 });
  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/counts/", { cache: "no-store" }).then((res) => (res.ok ? res.json() : null)).then((data: Counts | null) => { if (!cancelled && data) setCounts(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [path]);
  return counts;
}

// A file dropped outside an upload zone would make the browser open it and leave the page,
// losing unsaved work. Swallow stray drops; real drop zones (data-dropzone) still work.
function useDropGuard() {
  useEffect(() => {
    const inZone = (event: DragEvent) => (event.target as Element | null)?.closest?.("[data-dropzone]");
    const guard = (event: DragEvent) => { if (!inZone(event)) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = "none"; } };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => { window.removeEventListener("dragover", guard); window.removeEventListener("drop", guard); };
  }, []);
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const counts = useCounts(path);
  const [command, setCommand] = useState(false);
  const [more, setMore] = useState(false);
  useDropGuard();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommand((value) => !value); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { setMore(false); }, [path]);

  const badge = (href: string) => (href === "/dashboard/messages/" && counts.unread > 0 ? counts.unread : href === "/dashboard/projects/" && counts.drafts > 0 ? counts.drafts : 0);
  const badgeLabel = (href: string) => (href === "/dashboard/messages/" ? "unread" : "drafts");
  const primary = ADMIN_NAV.filter((item) => ["Overview", "Projects", "Media", "Messages"].includes(item.label));
  const secondary = ADMIN_NAV.filter((item) => !primary.includes(item));

  return <div className="adm">
    <aside className="adm-side" aria-label="Admin">
      <Link href="/dashboard/" className="adm-brand"><span className="adm-brand__mark" aria-hidden="true">LS</span><span><strong>Studio</strong><small>Admin</small></span></Link>
      <button type="button" className="adm-search" onClick={() => setCommand(true)}><Search aria-hidden="true" /><span>Quick search</span><span className="adm-search__keys"><span className="kbd">Ctrl</span><span className="kbd">K</span></span></button>
      <nav className="adm-nav" aria-label="Admin sections">
        {ADMIN_NAV.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="adm-nav__link" aria-current={isNavActive(href, path) ? "page" : undefined}>
          <Icon aria-hidden="true" /><span>{label}</span>
          {badge(href) > 0 && <span className="adm-nav__badge" aria-label={`${badge(href)} ${badgeLabel(href)}`}>{badge(href)}</span>}
        </Link>)}
      </nav>
      <div className="adm-side__foot">
        <Link href="/" target="_blank" className="adm-nav__link"><ArrowUpRight aria-hidden="true" /><span>Open website</span></Link>
        <div className="adm-profile">
          <span className="adm-brand__mark adm-brand__mark--sm" aria-hidden="true">LS</span>
          <span className="adm-profile__name"><strong>Long Sengchhun</strong><small>Administrator</small></span>
          <ThemeToggle />
          <form method="post" action="/api/dashboard/logout/"><button type="submit" className="btn btn--ghost btn--icon btn--sm" aria-label="Log out" title="Log out"><LogOut /></button></form>
        </div>
      </div>
    </aside>

    <header className="adm-top">
      <Link href="/dashboard/" className="adm-brand"><span className="adm-brand__mark adm-brand__mark--sm" aria-hidden="true">LS</span><strong>Studio</strong></Link>
      <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => setCommand(true)} aria-label="Search or jump to"><Command /></button>
    </header>

    <div className="adm-main">{children}</div>

    <nav className="adm-tabbar glass glass--strong" aria-label="Admin sections, mobile">
      {primary.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="adm-tabbar__item" aria-current={isNavActive(href, path) ? "page" : undefined}>
        <Icon aria-hidden="true" />{badge(href) > 0 && <i className="adm-tabbar__dot" aria-hidden="true" />}<span>{label}</span>
      </Link>)}
      <button type="button" className="adm-tabbar__item" onClick={() => setMore(true)}><MoreHorizontal aria-hidden="true" /><span>More</span></button>
    </nav>

    <Dialog open={more} onClose={() => setMore(false)} title="More">
      <ul className="adm-more">
        {secondary.map(({ label, href, icon: Icon }) => <li key={href}><Link href={href} className="adm-nav__link" aria-current={isNavActive(href, path) ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link></li>)}
        <li><Link href="/dashboard/clients/" className="adm-nav__link"><ArrowUpRight aria-hidden="true" /><span>Client accounts</span></Link></li>
        <li><Link href="/" target="_blank" className="adm-nav__link"><ArrowUpRight aria-hidden="true" /><span>Open website</span></Link></li>
        <li><form method="post" action="/api/dashboard/logout/"><button type="submit" className="adm-nav__link adm-nav__link--button"><LogOut aria-hidden="true" /><span>Log out</span></button></form></li>
      </ul>
    </Dialog>

    <CommandMenu open={command} onClose={() => setCommand(false)} />
  </div>;
}
