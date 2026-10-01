"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INQUIRY_STATUS_LABELS } from "@/lib/content";
import type { DashboardSnapshot, Inquiry, Visit } from "@/lib/types";

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));
const locationLabel = (visit: Visit) => [visit.city, visit.region, visit.country].filter(Boolean).join(", ") || "Location unavailable";

const FILTERS = [
  { id: "open", label: "Needs reply", match: (i: Inquiry) => i.status === "new" || i.status === "reviewing" },
  { id: "active", label: "In progress", match: (i: Inquiry) => i.status === "replied" || i.status === "accepted" },
  { id: "closed", label: "Closed", match: (i: Inquiry) => i.status === "declined" || i.status === "archived" },
  { id: "all", label: "All", match: () => true },
] as const;

function DecisionForm({ id, action, label, confirmText, danger }: { id: number; action: "accept" | "reject"; label: string; confirmText: string; danger?: boolean }) {
  return <form method="post" action={`/api/dashboard/inquiries/${id}/`} onSubmit={(event) => { if (!window.confirm(confirmText)) event.preventDefault(); }}>
    <input type="hidden" name="action" value={action} /><input type="hidden" name="next" value="dashboard" />
    <button className={`ad-btn${danger ? " ad-btn-danger" : ""}`} type="submit">{label}</button>
  </form>;
}

export default function DashboardConsole({ initialData, emailReady, emailReadinessMessage, emailReadinessMode, smsReady }: {
  initialData: DashboardSnapshot;
  emailReady: boolean;
  emailReadinessMessage: string;
  emailReadinessMode: string;
  smsReady: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("open");

  useEffect(() => {
    const source = new EventSource("/api/dashboard/stream/");
    source.onopen = () => setConnected(true);
    source.onmessage = (event) => {
      try {
        setData(JSON.parse(event.data) as DashboardSnapshot);
        setLastUpdated(new Date());
        setConnected(true);
      } catch {
        // Ignore a malformed frame; the next tick will self-correct.
      }
    };
    source.onerror = () => setConnected(false);
    return () => source.close();
  }, []);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, data.latest_inquiries.filter(f.match).length])), [data.latest_inquiries]);
  const rows = useMemo(() => data.latest_inquiries.filter(FILTERS.find((f) => f.id === filter)!.match), [data.latest_inquiries, filter]);
  const needsReply = counts.open;

  return <>
    <nav className="ad-quick" aria-label="Quick actions">
      <Link className="ad-btn ad-btn-primary" href="/dashboard/portfolio/"><i className="bi bi-cloud-upload" />Upload work</Link>
      <Link className="ad-btn" href="/dashboard/hero/"><i className="bi bi-easel2" />Hero slides</Link>
      <Link className="ad-btn" href="/dashboard/content/#showreel"><i className="bi bi-camera-reels" />Update showreel</Link>
      <Link className="ad-btn" href="/dashboard/clients/"><i className="bi bi-people" />Clients</Link>
      <Link className="ad-btn" href="/" target="_blank"><i className="bi bi-box-arrow-up-right" />View site</Link>
    </nav>

    <section className="ad-attention" aria-label="Needs attention">
      <Link className={`ad-card${needsReply ? " is-hot" : ""}`} href="#inquiries" onClick={() => setFilter("open")}><strong>{needsReply}</strong><span>{needsReply === 1 ? "inquiry needs a reply" : "inquiries need a reply"}</span></Link>
      <div className={`ad-card${emailReady ? "" : " is-warn"}`} title={emailReadinessMessage}><strong>{emailReady ? "OK" : "!"}</strong><span>{emailReady ? "Client email ready" : emailReadinessMode === "testing" ? "Client email in test mode" : "Client email sender invalid"}{smsReady ? "" : " · SMS off"}</span></div>
    </section>

    <section className="ad-panel" id="inquiries" aria-labelledby="inq-heading">
      <div className="ad-panel-head">
        <h2 id="inq-heading">Inquiries</h2>
        <div className="ad-tabs" role="tablist" aria-label="Filter inquiries">{FILTERS.map((f) => <button type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? "is-active" : ""} onClick={() => setFilter(f.id)} key={f.id}>{f.label}<span>{counts[f.id]}</span></button>)}</div>
      </div>
      {rows.length ? <ul className="ad-list">{rows.map((inquiry) => <li key={inquiry.id} className={inquiry.status === "new" ? "is-new" : ""}>
        <div className="ad-list-main">
          <div className="ad-list-title"><strong>{inquiry.full_name}</strong>{inquiry.company && <small>{inquiry.company}</small>}<span className={`status-badge status-${inquiry.status}`}>{INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}</span></div>
          <p className="ad-list-service">{inquiry.service_needed}</p>
          <p className="ad-list-snippet">{inquiry.project_description.split(/\s+/).slice(0, 24).join(" ")}</p>
          <p className="ad-list-meta"><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>{inquiry.phone_or_telegram && <> · {inquiry.phone_or_telegram}</>} · <time dateTime={inquiry.created_at}>{formatDate(inquiry.created_at)}</time></p>
        </div>
        <div className="ad-list-actions">
          <Link className="ad-btn ad-btn-primary" href={`/dashboard/inquiries/${inquiry.id}/`}>Open &amp; reply</Link>
          {(inquiry.status === "new" || inquiry.status === "reviewing") && <>
            <DecisionForm id={inquiry.id} action="accept" label="Accept" confirmText={`Accept ${inquiry.full_name}'s request and email them now?`} />
            <DecisionForm id={inquiry.id} action="reject" label="Decline" danger confirmText={`Decline ${inquiry.full_name}'s request and email them now?`} />
          </>}
        </div>
      </li>)}</ul> : <p className="empty-state">{filter === "open" ? "Nothing waiting for a reply." : "No inquiries in this view."}</p>}
    </section>

    <section className="ad-panel" aria-labelledby="traffic-heading">
      <div className="ad-panel-head">
        <h2 id="traffic-heading">Traffic</h2>
        <span className="live-refresh-state" role="status"><span className={`status-dot${connected ? "" : " is-refreshing"}`} />{connected ? "Live" : "Connecting"}{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
      </div>
      <dl className="ad-stats"><div><dt>Today</dt><dd>{data.today_visits}</dd></div><div><dt>Visitors</dt><dd>{data.unique_visitors}</dd></div><div><dt>Total visits</dt><dd>{data.total_visits}</dd></div><div><dt>Accepted projects</dt><dd>{data.accepted_projects}</dd></div></dl>
      <div className="ad-grid">
        <div><h3>Top pages</h3><ul className="signal-list page-list">{data.top_pages.length ? data.top_pages.map((row) => <li key={row.path}><span>{row.path}</span><strong>{row.total}</strong></li>) : <li><span>No data yet</span><strong>0</strong></li>}</ul></div>
        <div><h3>Top locations</h3><ul className="signal-list">{data.location_breakdown.length ? data.location_breakdown.map((row) => <li key={`${row.country}-${row.region}-${row.city}`}><span>{row.city}, {row.region}<small>{row.country}</small></span><strong>{row.total}</strong></li>) : <li><span>No data yet</span><strong>0</strong></li>}</ul></div>
        <div><h3>Devices</h3><ul className="signal-list">{data.device_breakdown.length ? data.device_breakdown.map((row) => <li key={row.device_type}><span>{row.device_type || "Unknown"}</span><strong>{row.total}</strong></li>) : <li><span>No data yet</span><strong>0</strong></li>}</ul><p className="analytics-note">Totals include bots and crawlers.</p></div>
      </div>
      <details className="ad-details">
        <summary>Latest visits ({data.latest_visits.length})</summary>
        <div className="visitor-list">{data.latest_visits.length ? data.latest_visits.map((visit) => <article className="visitor-row" key={visit.id}>
          <div className="visitor-time"><time>{formatDate(visit.created_at)}</time><strong>{visit.path}</strong></div>
          <div><small>Device</small><strong>{visit.device_vendor && visit.device_vendor !== "Unknown" ? `${visit.device_vendor} ` : ""}{visit.device_model || visit.device_type || "Unknown"}</strong><span>{visit.device_type}{visit.screen_width ? ` · ${visit.screen_width}×${visit.screen_height}` : ""}</span></div>
          <div><small>System</small><strong>{visit.browser || "Unknown browser"}</strong><span>{visit.os || "Unknown OS"}{visit.connection_type ? ` · ${visit.connection_type.toUpperCase()}` : ""}</span></div>
          <div><small>Approx. location</small><strong>{locationLabel(visit)}</strong></div>
        </article>) : <p className="empty-state">No visits tracked yet.</p>}</div>
      </details>
    </section>
  </>;
}
