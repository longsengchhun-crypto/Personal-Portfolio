"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";
import { Inbox as InboxIcon, Search, Users } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { InquiryRow } from "@/lib/data";

const TABS = [
  { id: "inbox", label: "Inbox", match: (row: InquiryRow) => row.status === "new" || row.status === "reviewing" },
  { id: "replied", label: "Replied", match: (row: InquiryRow) => row.status === "replied" },
  { id: "accepted", label: "Accepted", match: (row: InquiryRow) => row.status === "accepted" },
  { id: "closed", label: "Closed", match: (row: InquiryRow) => row.status === "declined" || row.status === "archived" },
  { id: "all", label: "All", match: () => true },
] as const;

function short(value: string) {
  const date = new Date(value);
  const days = (Date.now() - date.getTime()) / 86_400_000;
  if (days < 1) return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }).format(date);
  if (days < 7) return new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "Asia/Phnom_Penh" }).format(date);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "Asia/Phnom_Penh" }).format(date);
}

export default function Inbox({ rows }: { rows: InquiryRow[] }) {
  const path = usePathname();
  const activeId = Number(path.match(/\/messages\/(\d+)/)?.[1]) || null;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("inbox");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, rows.filter(t.match).length])), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(TABS.find((t) => t.id === tab)!.match).filter((row) => !q || `${row.full_name} ${row.email} ${row.company} ${row.service_needed} ${row.project_description}`.toLowerCase().includes(q));
  }, [rows, tab, query]);

  return <aside className="inbox__list" aria-label="Messages">
    <div className="inbox__head">
      <div className="adm-searchbox"><Search aria-hidden="true" /><input className="input input--sm" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages" aria-label="Search messages" /></div>
      <div className="inbox__tabs" role="tablist" aria-label="Message folders">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="chip" onClick={() => setTab(t.id)}>{t.label} <span className="chip__count">{counts[t.id]}</span></button>)}
      </div>
    </div>
    {visible.length === 0
      ? <div className="inbox__empty"><EmptyState icon={<InboxIcon />} title={query ? "No matches" : tab === "inbox" ? "Inbox zero" : "Nothing here"}>{query ? "Try a different search." : tab === "inbox" ? "Every message has been answered." : "Messages in this folder will show up here."}</EmptyState></div>
      : <ul className="inbox__rows">{visible.map((row) => <li key={row.id}>
        <Link href={`/dashboard/messages/${row.id}/`} className={`mrow${row.status === "new" ? " is-unread" : ""}`} aria-current={activeId === row.id ? "page" : undefined}>
          <span className="mrow__top"><strong>{row.full_name}</strong><time className="caption" dateTime={row.created_at}>{short(row.created_at)}</time></span>
          <span className="mrow__service">{row.service_needed}{row.company ? ` · ${row.company}` : ""}</span>
          <span className="mrow__snippet">{row.project_description}</span>
          <StatusBadge status={row.status} />
        </Link>
      </li>)}</ul>}
    <Link href="/dashboard/clients/" className="inbox__foot"><Users aria-hidden="true" /> Client accounts</Link>
  </aside>;
}
