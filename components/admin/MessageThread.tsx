"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Archive, ChevronDown, Mail, MailCheck, Paperclip, Phone, Send, Undo2 } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { adminJson } from "@/lib/adminApi";
import { INQUIRY_STATUSES } from "@/lib/content";
import type { Inquiry } from "@/lib/types";

const ACCEPT_TEMPLATES = [
  ["General", "Thank you for your request. I have reviewed the project details and would be happy to discuss the next steps."],
  ["Video", "Thank you for your video project request. I'm excited to work on this and will be in touch shortly to confirm scope, timeline, and next steps."],
  ["Design", "Thank you for your design project request. I've reviewed the brief and I'm glad to move forward. I'll follow up with next steps shortly."],
] as const;
const DECLINE_TEMPLATES = [
  ["Unavailable", "Thank you very much for reaching out. Unfortunately, I am currently unavailable for this project timeframe. I appreciate your interest and hope we can work together on a future project."],
  ["Outside scope", "Thank you for considering me for this project. After reviewing the details, this falls outside the services I currently offer. I appreciate your interest and wish you the best with the project."],
  ["Schedule conflict", "Thank you for your request. Unfortunately, I have a scheduling conflict during your timeframe and won't be able to take this on. I hope we can work together another time."],
] as const;

const full = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));

function contactLink(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("@")) return { href: `https://t.me/${trimmed.slice(1)}`, label: "Telegram", external: true };
  if (/^https?:\/\/(t\.me|telegram\.me)\//i.test(trimmed)) return { href: trimmed, label: "Telegram", external: true };
  return { href: `tel:${trimmed.replace(/[^+\d]/g, "")}`, label: "Call", external: false };
}

type Decision = { action: "accept" | "reject"; resend: boolean } | null;
type ApiResult = { status?: string; action?: string; duplicate?: boolean; email?: string };

export default function MessageThread({ inquiry, attachmentUrl, emailReady, emailNote }: { inquiry: Inquiry; attachmentUrl: string; emailReady: boolean; emailNote: string }) {
  const router = useRouter();
  const toast = useToast();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [notes, setNotes] = useState(inquiry.admin_notes);
  const [status, setStatus] = useState(inquiry.status);
  const [busy, setBusy] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [draft, setDraft] = useState("");
  const history = [...(inquiry.messages ?? [])].filter((message) => message.message_type !== "status" && (message.message_type as string) !== "admin_notify").sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Opening a new message marks it as read.
  useEffect(() => {
    if (inquiry.status !== "new") return;
    void adminJson("/api/dashboard/inquiries/" + inquiry.id + "/", { action: "read" }).then((res) => { if (res.ok) router.refresh(); });
  }, [inquiry.id, inquiry.status, router]);

  async function send(action: "reply" | "accept" | "reject" | "save", options: { resend?: boolean; status?: string } = {}) {
    setBusy(action);
    const res = await adminJson<ApiResult>(`/api/dashboard/inquiries/${inquiry.id}/`, { action, client_message: draft, admin_notes: notes, status: options.status ?? status, is_reviewed: true, confirm_resend: options.resend });
    setBusy(null);
    setDecision(null);
    if (!res.ok) { toast({ tone: "error", title: "That didn't go through", message: res.error }); return; }
    if (res.data.duplicate) { toast({ tone: "info", title: "Already sent", message: "The client already received this decision. Use resend if they need it again." }); return; }
    if (res.data.status) setStatus(res.data.status as Inquiry["status"]);
    const emailed = res.data.email === "sent";
    if (action === "save") toast({ title: "Saved" });
    else if (emailed) toast({ title: action === "reply" ? "Reply sent" : action === "accept" ? "Accepted, client notified" : "Declined, client notified", message: "The email was delivered." });
    else toast({ tone: "error", title: "Saved, but the email was not delivered", message: res.data.email === "not-configured" ? "Email is not configured on the server." : "Check the email settings and try again." });
    if (action !== "save") { setDraft(""); if (messageRef.current) messageRef.current.value = ""; }
    router.refresh();
  }

  const askDecision = (action: "accept" | "reject") => {
    const target = action === "accept" ? "accepted" : "declined";
    setDecision({ action, resend: inquiry.status === target && inquiry.last_notification_status === "sent" });
  };
  const applyTemplate = (text: string) => { setDraft(text); messageRef.current?.focus(); };
  const phone = inquiry.phone_or_telegram ? contactLink(inquiry.phone_or_telegram) : null;

  return <article className="thread">
    <header className="thread__head">
      <Link href="/dashboard/messages/" className="btn btn--ghost btn--icon btn--sm thread__back" aria-label="Back to messages"><ArrowLeft /></Link>
      <div className="thread__who">
        <h2>{inquiry.full_name}</h2>
        <p className="caption"><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>{inquiry.company ? ` · ${inquiry.company}` : ""}</p>
      </div>
      <div className="thread__tools">
        <StatusBadge status={status} />
        {status !== "archived"
          ? <Button size="sm" variant="ghost" icon aria-label="Archive" title="Archive" disabled={busy !== null} onClick={() => send("save", { status: "archived" })}><Archive /></Button>
          : <Button size="sm" variant="ghost" icon aria-label="Move back to inbox" title="Move back to inbox" disabled={busy !== null} onClick={() => send("save", { status: "reviewing" })}><Undo2 /></Button>}
      </div>
    </header>

    {!emailReady && <div className="notice notice--warn" role="status"><span><strong>Email delivery needs attention.</strong> {emailNote}</span></div>}

    <div className="thread__scroll">
      <section className="bubble bubble--in" aria-label="Message from client">
        <header><strong>{inquiry.full_name}</strong><time className="caption" dateTime={inquiry.created_at}>{full(inquiry.created_at)}</time></header>
        <dl className="thread__brief">
          <div><dt>Project</dt><dd>{inquiry.service_needed}</dd></div>
          <div><dt>Budget</dt><dd>{inquiry.estimated_budget || "Not decided"}</dd></div>
          <div><dt>Timeline</dt><dd>{inquiry.preferred_timeline || "Flexible"}</dd></div>
          {inquiry.phone_or_telegram && <div><dt>Contact</dt><dd>{phone ? <a href={phone.href} target={phone.external ? "_blank" : undefined} rel={phone.external ? "noreferrer" : undefined}>{inquiry.phone_or_telegram}</a> : inquiry.phone_or_telegram}</dd></div>}
        </dl>
        <p className="bubble__body">{inquiry.project_description}</p>
        {attachmentUrl && <a className="btn btn--glass btn--sm" href={attachmentUrl} target="_blank" rel="noreferrer"><Paperclip /> Open attachment</a>}
      </section>

      {history.map((message) => <section key={message.id} className={`bubble ${message.message_type === "receipt" ? "bubble--system" : "bubble--out"}`}>
        <header><strong>{message.subject || message.message_type}</strong><time className="caption" dateTime={message.created_at}>{full(message.created_at)}</time></header>
        <p className="bubble__body">{message.body}</p>
        <small className="caption">{message.message_type} · {message.delivery_status === "sent" ? <><MailCheck aria-hidden="true" /> delivered</> : message.delivery_status}</small>
      </section>)}
    </div>

    <form className="composer" onSubmit={(event) => { event.preventDefault(); void send("reply"); }}>
      <div className="composer__templates" role="group" aria-label="Quick replies">
        <span className="meta">Quick replies</span>
        {ACCEPT_TEMPLATES.map(([label, text]) => <button type="button" className="chip" key={`a-${label}`} onClick={() => applyTemplate(text)}>{label}</button>)}
        {DECLINE_TEMPLATES.map(([label, text]) => <button type="button" className="chip chip--muted" key={`d-${label}`} onClick={() => applyTemplate(text)}>{label}</button>)}
      </div>
      <label className="sr-only" htmlFor="client_message">Reply to {inquiry.full_name}</label>
      <textarea ref={messageRef} id="client_message" className="textarea" rows={5} maxLength={10000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Reply to ${inquiry.full_name.split(" ")[0]}…  This text is emailed to ${inquiry.email}.`} />
      <div className="composer__bar">
        <div className="adm-inline">
          <Button type="submit" variant="primary" state={busy === "reply" ? "loading" : undefined} disabled={!draft.trim() || busy !== null}><Send /> Send reply</Button>
          <Button variant="glass" disabled={busy !== null} onClick={() => askDecision("accept")}>{inquiry.status === "accepted" ? "Resend acceptance" : "Accept"}</Button>
          <Button variant="ghost" disabled={busy !== null} onClick={() => askDecision("reject")}>{inquiry.status === "declined" ? "Resend decline" : "Decline"}</Button>
        </div>
        <a className="btn btn--ghost btn--sm" href={`mailto:${inquiry.email}`}><Mail /> Open in email app</a>
      </div>
    </form>

    <details className="disclosure thread__private">
      <summary>Private notes and status <span className="caption">(never emailed)</span><ChevronDown aria-hidden="true" /></summary>
      <div className="disclosure__body">
        <div className="field"><label htmlFor="admin_notes">Studio notes</label><textarea id="admin_notes" className="textarea" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Quote notes, follow-up tasks, reminders." /></div>
        <div className="field"><label htmlFor="status">Workflow status</label><select id="status" className="select select--sm" value={status} onChange={(event) => setStatus(event.target.value as Inquiry["status"])}>{INQUIRY_STATUSES.map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></div>
        <div><Button variant="glass" size="sm" disabled={busy !== null} state={busy === "save" ? "loading" : undefined} onClick={() => send("save")}>Save notes and status</Button></div>
      </div>
    </details>
    {phone && <p className="caption thread__alt"><Phone aria-hidden="true" /> Prefer to reply elsewhere? <a href={phone.href} target={phone.external ? "_blank" : undefined} rel={phone.external ? "noreferrer" : undefined}>{phone.label} {inquiry.phone_or_telegram}</a></p>}

    <Dialog open={decision !== null} onClose={() => setDecision(null)} title={decision?.action === "accept" ? "Accept this request?" : "Decline this request?"} role="alertdialog"
      actions={<><Button variant="ghost" onClick={() => setDecision(null)}>Cancel</Button><Button variant={decision?.action === "accept" ? "primary" : "danger"} state={busy === decision?.action ? "loading" : undefined} onClick={() => decision && send(decision.action, { resend: decision.resend })}>{decision?.action === "accept" ? "Accept and email client" : "Decline and email client"}</Button></>}>
      <p><strong>{inquiry.full_name}</strong> · {inquiry.service_needed}</p>
      <p>{draft.trim() ? "Your message above will be included as a personal note." : "A standard notification will be emailed. Write a message above first if you'd like to add a personal note."}</p>
      {decision?.resend && <p className="notice notice--warn">This request was already {decision.action === "accept" ? "accepted" : "declined"} and the client was notified. This sends the email again.</p>}
    </Dialog>
  </article>;
}
