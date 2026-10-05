"use client";

import { useEffect, useState } from "react";
import type { DashboardSnapshot, Visit } from "@/lib/types";

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));
const place = (visit: Visit) => [visit.city, visit.region, visit.country].filter(Boolean).join(", ") || "Location unavailable";

// Live site traffic, kept compact: the numbers that matter, plus the raw feed behind a disclosure.
export default function TrafficPanel({ initialData }: { initialData: DashboardSnapshot }) {
  const [data, setData] = useState(initialData);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/dashboard/stream/");
    source.onopen = () => setConnected(true);
    source.onmessage = (event) => {
      try { setData(JSON.parse(event.data) as DashboardSnapshot); setConnected(true); } catch { /* a malformed frame self-corrects on the next tick */ }
    };
    source.onerror = () => setConnected(false);
    return () => source.close();
  }, []);

  const list = (rows: { key: string; label: string; total: number }[]) => rows.length
    ? <ul className="adm-bars">{rows.map((row) => <li key={row.key}><span>{row.label}</span><strong className="tabular">{row.total}</strong></li>)}</ul>
    : <p className="caption">No data yet.</p>;

  return <section className="adm-card" aria-labelledby="traffic-heading">
    <header className="adm-card__head">
      <h2 id="traffic-heading">Traffic</h2>
      <span className="adm-live" role="status"><i className={connected ? "is-on" : ""} />{connected ? "Live" : "Connecting"}</span>
    </header>
    <dl className="adm-stats">
      <div><dt>Today</dt><dd className="tabular">{data.today_visits}</dd></div>
      <div><dt>Visitors</dt><dd className="tabular">{data.unique_visitors}</dd></div>
      <div><dt>All-time visits</dt><dd className="tabular">{data.total_visits}</dd></div>
    </dl>
    <div className="adm-cols">
      <div><h3 className="meta">Top pages</h3>{list(data.top_pages.map((row) => ({ key: row.path, label: row.path, total: row.total })))}</div>
      <div><h3 className="meta">Top places</h3>{list(data.location_breakdown.slice(0, 5).map((row) => ({ key: `${row.country}-${row.city}`, label: `${row.city}, ${row.country}`, total: row.total })))}</div>
      <div><h3 className="meta">Devices</h3>{list(data.device_breakdown.map((row) => ({ key: row.device_type, label: row.device_type || "Unknown", total: row.total })))}<p className="caption adm-note">Totals include bots and crawlers.</p></div>
    </div>
    <details className="disclosure">
      <summary>Recent visits ({data.latest_visits.length})</summary>
      <div className="adm-visits">{data.latest_visits.length ? data.latest_visits.map((visit) => <div key={visit.id}>
        <time className="caption" dateTime={visit.created_at}>{formatDate(visit.created_at)}</time><strong>{visit.path}</strong>
        <span className="caption">{[visit.device_type, visit.browser, visit.os].filter(Boolean).join(" · ")}</span><span className="caption">{place(visit)}</span>
      </div>) : <p className="caption">No visits tracked yet.</p>}</div>
    </details>
  </section>;
}
