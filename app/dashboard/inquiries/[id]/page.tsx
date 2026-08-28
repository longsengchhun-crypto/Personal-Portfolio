import Link from "next/link";
import { notFound } from "next/navigation";
import DecisionPanel from "@/components/DecisionPanel";
import NotificationBanner from "@/components/NotificationBanner";
import { requireAdmin } from "@/lib/auth";
import { getDashboardInquiry } from "@/lib/data";
import { emailNotificationReadiness, smsNotificationsConfigured } from "@/lib/notifications";
import { mediaUrl } from "@/lib/supabase";

export const metadata = { title: "Inquiry" };

function messageLink(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("@")) return { href: `https://t.me/${trimmed.slice(1)}`, label: "Open Telegram", icon: "bi-telegram", external: true };
  if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(trimmed)) return { href: trimmed, label: "Open Telegram", icon: "bi-telegram", external: true };
  return { href: `sms:${trimmed.replace(/[^+\d]/g, "")}`, label: "Write SMS", icon: "bi-chat-dots", external: false };
}

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));

export default async function InquiryDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ email?: string; sms?: string; action?: string; form?: string }> }) {
  const id = Number((await params).id);
  await requireAdmin(`/dashboard/inquiries/${id}/`);
  const notification = await searchParams;
  const inquiry = Number.isInteger(id) ? await getDashboardInquiry(id) : null;
  if (!inquiry) notFound();
  const emailReadiness = emailNotificationReadiness();
  const emailReady = emailReadiness.configured && emailReadiness.mode === "production";
  const smsReady = smsNotificationsConfigured();
  const phoneMessage = inquiry.phone_or_telegram ? messageLink(inquiry.phone_or_telegram) : null;

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">Project Message</p><h1>{inquiry.full_name}</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/"><i className="bi bi-arrow-left" />Dashboard</Link><a className="btn btn-outline-light" href={`mailto:${inquiry.email}`}><i className="bi bi-envelope" />Open Email App</a></div></header>
    <NotificationBanner emailStatus={notification.email} smsStatus={notification.sms} actionStatus={notification.action} dismissHref={`/dashboard/inquiries/${inquiry.id}/`} />
    {notification.form === "message-required" && <div className="alert alert-danger inquiry-form-alert" role="alert">Write a client-facing message before selecting “Send Reply”.</div>}
    {notification.action === "duplicate" && <div className="alert alert-success inquiry-form-alert" role="alert">This request was already {inquiry.status} and the client was already notified — no duplicate email or SMS was sent. Use “Resend Notification” if the client needs it again.</div>}

    <div className="inquiry-detail-layout">
      <div className="inquiry-main-column">
        <article className="console-panel inquiry-detail-card"><div className="console-panel-head"><div><span className="status-dot message-dot" /><h2>Client Brief</h2></div><small>{formatDate(inquiry.created_at)}</small></div><div className="inquiry-detail-body"><dl className="detail-matrix"><div><dt>Service</dt><dd>{inquiry.service_needed}</dd></div><div><dt>Budget</dt><dd>{inquiry.estimated_budget || "Not decided"}</dd></div><div><dt>Timeline</dt><dd>{inquiry.preferred_timeline || "Flexible"}</dd></div><div><dt>Email</dt><dd>{inquiry.email}</dd></div><div><dt>Phone / Telegram</dt><dd>{inquiry.phone_or_telegram || "—"}</dd></div><div><dt>Company</dt><dd>{inquiry.company || "—"}</dd></div></dl><div className="message-copy"><h2>Project Description</h2><p style={{ whiteSpace: "pre-line" }}>{inquiry.project_description}</p></div>{inquiry.attachment && <a className="btn btn-outline-light" href={mediaUrl(inquiry.attachment)} target="_blank" rel="noreferrer"><i className="bi bi-paperclip" />Open Attachment</a>}</div></article>

        <section className="console-panel message-history"><div className="console-panel-head"><div><span className="status-dot model-dot" /><h2>Email History</h2></div><small>{inquiry.messages?.length || 0} delivery records</small></div>{inquiry.messages?.length ? <ol>{inquiry.messages.map((message) => <li key={message.id}><span className={`history-status history-${message.delivery_status}`}><i className={`bi ${message.delivery_status === "sent" ? "bi-envelope-check" : "bi-envelope-exclamation"}`} /></span><div><div className="history-heading"><strong>{message.subject || message.message_type}</strong><time>{formatDate(message.created_at)}</time></div><p>{message.body}</p><small>{message.message_type} · {message.delivery_status}</small></div></li>)}</ol> : <p className="empty-state">No client email has been recorded yet.</p>}</section>
      </div>

      <aside className="console-panel inquiry-action-panel"><div className="console-panel-head"><div><span className="status-dot" /><h2>Reply & Decision</h2></div></div><div className="client-contact-card"><span>Client Contact</span><a href={`mailto:${inquiry.email}`}><i className="bi bi-envelope" />{inquiry.email}</a>{phoneMessage && <a href={phoneMessage.href} target={phoneMessage.external ? "_blank" : undefined} rel={phoneMessage.external ? "noreferrer" : undefined}><i className={`bi ${phoneMessage.icon}`} />{phoneMessage.label}: {inquiry.phone_or_telegram}</a>}</div><div className="decision-delivery-state"><span className={emailReady ? "is-ready" : "needs-setup"} title={emailReadiness.message}><i className={`bi ${emailReady ? "bi-envelope-check" : "bi-envelope-exclamation"}`} />Automatic client email: {emailReady ? "Ready" : emailReadiness.mode === "testing" ? "Test mode" : "Sender invalid"}</span><span className={smsReady ? "is-ready" : "needs-setup"}><i className={`bi ${smsReady ? "bi-chat-square-check" : "bi-chat-dots"}`} />Optional decision SMS: {smsReady ? "Ready" : "Off"}</span></div>
        <DecisionPanel
          inquiryId={inquiry.id}
          fullName={inquiry.full_name}
          service={inquiry.service_needed}
          currentStatus={inquiry.status}
          lastNotificationStatus={inquiry.last_notification_status}
          defaultAdminNotes={inquiry.admin_notes}
          defaultReviewed={inquiry.is_reviewed}
        />
      </aside>
    </div>
  </div></section>;
}
