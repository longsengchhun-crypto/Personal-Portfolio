"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardSnapshot, Visit } from "@/lib/types";

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));
const locationLabel = (visit: Visit) => [visit.city, visit.region, visit.country].filter(Boolean).join(", ") || "Location unavailable";

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

  return <>
    <div className="dashboard-operations">
      <div className="live-refresh" role="status" aria-live="polite">
        <span className="live-refresh-state"><span className={`status-dot${connected ? "" : " is-refreshing"}`} />{connected ? "Live" : "Connecting"}</span>
        <small>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Waiting for first update"}</small>
      </div>
      <div className="delivery-readiness" aria-label="Client notification readiness">
        <span className={emailReady ? "is-ready" : "needs-setup"} title={emailReadinessMessage}><i className={`bi ${emailReady ? "bi-envelope-check" : "bi-envelope-exclamation"}`} />Client email: {emailReady ? "Ready" : emailReadinessMode === "testing" ? "Test mode" : "Sender invalid"}</span>
        <span className={smsReady ? "is-ready" : "needs-setup"}><i className={`bi ${smsReady ? "bi-chat-square-check" : "bi-chat-dots"}`} />Optional SMS: {smsReady ? "Ready" : "Off"}</span>
      </div>
    </div>

    <div className="signal-strip" aria-label="Dashboard metrics"><article><span>Total visits</span><strong>{data.total_visits}</strong></article><article><span>Today</span><strong>{data.today_visits}</strong></article><article><span>Visitors</span><strong>{data.unique_visitors}</strong></article><article><span>New messages</span><strong>{data.new_inquiries}</strong></article><article><span>Accepted</span><strong>{data.accepted_projects}</strong></article></div>

    <div className="console-layout analytics-layout">
      <section className="console-panel visitor-stream">
        <div className="console-panel-head"><div><span className="status-dot" /><h2>Live Visitor Stream</h2></div><small>{data.total_visits} tracked visits · updates automatically</small></div>
        <div className="visitor-list">{data.latest_visits.length ? data.latest_visits.map((visit) => <article className="visitor-row" key={visit.id}>
          <div className="visitor-time"><time>{formatDate(visit.created_at)}</time><strong>{visit.path}</strong></div>
          <div><small>Device</small><strong>{visit.device_vendor && visit.device_vendor !== "Unknown" ? `${visit.device_vendor} ` : ""}{visit.device_model || visit.device_type || "Unknown"}</strong><span>{visit.device_type}{visit.screen_width ? ` · ${visit.screen_width}×${visit.screen_height}` : ""}{visit.touch_support ? " · Touch" : ""}</span></div>
          <div><small>System</small><strong>{visit.browser || "Unknown browser"}{visit.browser_version ? ` ${visit.browser_version.split(".")[0]}` : ""}</strong><span>{visit.os || "Unknown OS"}{visit.os_version ? ` ${visit.os_version}` : ""}{visit.connection_type ? ` · ${visit.connection_type.toUpperCase()}` : ""}</span></div>
          <div><small>Approx. location</small><strong>{locationLabel(visit)}</strong><span>{visit.timezone || "Timezone unavailable"}</span></div>
        </article>) : <p className="empty-state">No visits tracked yet.</p>}</div>
      </section>

      <aside className="console-side analytics-side">
        <section className="console-panel"><div className="console-panel-head"><div><span className="status-dot muted-dot" /><h2>Device Mix</h2></div></div><ul className="signal-list">{data.device_breakdown.length ? data.device_breakdown.map((row) => <li key={row.device_type}><span>{row.device_type || "Unknown"}</span><strong>{row.total}</strong></li>) : <li><span>No device data yet</span><strong>0</strong></li>}</ul></section>
        <section className="console-panel"><div className="console-panel-head"><div><span className="status-dot model-dot" /><h2>Top Models</h2></div></div><ul className="signal-list">{data.model_breakdown.length ? data.model_breakdown.map((row) => <li key={`${row.device_vendor}-${row.device_model}`}><span>{row.device_vendor !== "Unknown" ? `${row.device_vendor} ` : ""}{row.device_model}</span><strong>{row.total}</strong></li>) : <li><span>No model data yet</span><strong>0</strong></li>}</ul><p className="analytics-note">Exact model availability depends on each browser&apos;s privacy settings.</p></section>
        <section className="console-panel"><div className="console-panel-head"><div><span className="status-dot location-dot" /><h2>Top Locations</h2></div></div><ul className="signal-list">{data.location_breakdown.length ? data.location_breakdown.map((row) => <li key={`${row.country}-${row.region}-${row.city}`}><span>{row.city}, {row.region}<small>{row.country}</small></span><strong>{row.total}</strong></li>) : <li><span>No location data yet</span><strong>0</strong></li>}</ul><p className="analytics-note">City and province are approximate, based on the visitor&apos;s network.</p></section>
        <section className="console-panel"><div className="console-panel-head"><div><span className="status-dot warm-dot" /><h2>Top Pages</h2></div></div><ul className="signal-list page-list">{data.top_pages.length ? data.top_pages.map((row) => <li key={row.path}><span>{row.path}</span><strong>{row.total}</strong></li>) : <li><span>No page data yet</span><strong>0</strong></li>}</ul></section>
      </aside>
    </div>

    <section className="console-panel message-board"><div className="console-panel-head"><div><span className="status-dot message-dot" /><h2>Project Messages</h2></div><small>Open a request to accept, decline, send a reply, or keep a private note.</small></div><div className="request-table-wrap"><table className="request-table"><thead><tr><th>Status</th><th>Client</th><th>Request</th><th>Contact</th><th>Submitted</th><th>Action</th></tr></thead><tbody>{data.latest_inquiries.length ? data.latest_inquiries.map((inquiry) => <tr key={inquiry.id}><td><span className={`status-badge status-${inquiry.status}`}>{inquiry.status[0].toUpperCase() + inquiry.status.slice(1)}</span>{inquiry.last_notification_status === "sent" && <small className="delivery-stamp"><i className="bi bi-envelope-check" />Emailed</small>}</td><td><strong>{inquiry.full_name}</strong>{inquiry.company && <small>{inquiry.company}</small>}</td><td><strong>{inquiry.service_needed}</strong><small>{inquiry.project_description.split(/\s+/).slice(0, 18).join(" ")}</small></td><td><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>{inquiry.phone_or_telegram && <small>{inquiry.phone_or_telegram}</small>}</td><td><time>{formatDate(inquiry.created_at)}</time></td><td><div className="request-actions"><Link className="btn btn-accent" href={`/dashboard/inquiries/${inquiry.id}/`}>Open & Reply</Link><form method="post" action={`/api/dashboard/inquiries/${inquiry.id}/`}><input type="hidden" name="action" value="accept" /><input type="hidden" name="next" value="dashboard" /><button className="btn btn-outline-light" type="submit">Accept & Email</button></form><form method="post" action={`/api/dashboard/inquiries/${inquiry.id}/`}><input type="hidden" name="action" value="reject" /><input type="hidden" name="next" value="dashboard" /><button className="btn btn-outline-danger" type="submit">Decline & Email</button></form></div></td></tr>) : <tr><td colSpan={6}><p className="empty-state">No project inquiries yet.</p></td></tr>}</tbody></table></div></section>
  </>;
}
