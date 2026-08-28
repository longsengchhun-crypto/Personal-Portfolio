"use client";

import { useRef, useState } from "react";
import { INQUIRY_STATUSES } from "@/lib/content";

const ACCEPT_TEMPLATES = [
  ["General", "Thank you for your request. I have reviewed the project details and would be happy to discuss the next steps."],
  ["Video", "Thank you for your video project request. I'm excited to work on this and will be in touch shortly to confirm scope, timeline, and next steps."],
  ["Design", "Thank you for your design project request. I've reviewed the brief and I'm glad to move forward — I'll follow up with next steps shortly."],
] as const;

const DECLINE_TEMPLATES = [
  ["Unavailable", "Thank you very much for reaching out. Unfortunately, I am currently unavailable for this project timeframe. I appreciate your interest and hope we can work together on a future project."],
  ["Outside scope", "Thank you for considering me for this project. After reviewing the details, this falls outside the services I currently offer. I appreciate your interest and wish you the best with the project."],
  ["Schedule conflict", "Thank you for your request. Unfortunately, I have a scheduling conflict during your timeframe and won't be able to take this on. I hope we can work together another time."],
] as const;

type PendingDecision = { action: "accept" | "reject"; isResend: boolean } | null;

export default function DecisionPanel({ inquiryId, fullName, service, currentStatus, lastNotificationStatus, defaultAdminNotes, defaultReviewed }: {
  inquiryId: number;
  fullName: string;
  service: string;
  currentStatus: string;
  lastNotificationStatus: string;
  defaultAdminNotes: string;
  defaultReviewed: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState<PendingDecision>(null);
  const [submitting, setSubmitting] = useState(false);

  const applyTemplate = (text: string) => {
    if (messageRef.current) messageRef.current.value = text;
  };

  const buttonLabel = (action: "accept" | "reject") => {
    const status = action === "accept" ? "accepted" : "declined";
    const already = currentStatus === status;
    if (!already) return action === "accept" ? "Accept & Email Client" : "Decline & Email Client";
    if (lastNotificationStatus === "sent") return action === "accept" ? "Resend Accept Notification" : "Resend Decline Notification";
    return action === "accept" ? "Retry Accept Notification" : "Retry Decline Notification";
  };

  const requestDecision = (action: "accept" | "reject") => {
    const status = action === "accept" ? "accepted" : "declined";
    const isResend = currentStatus === status && lastNotificationStatus === "sent";
    setPending({ action, isResend });
  };

  const confirmDecision = () => {
    if (!pending || !formRef.current) return;
    setSubmitting(true);
    const form = formRef.current;
    let actionInput = form.querySelector<HTMLInputElement>('input[name="action"][data-injected]');
    if (!actionInput) {
      actionInput = document.createElement("input");
      actionInput.type = "hidden";
      actionInput.name = "action";
      actionInput.dataset.injected = "true";
      form.appendChild(actionInput);
    }
    actionInput.value = pending.action;
    let resendInput = form.querySelector<HTMLInputElement>('input[name="confirm_resend"]');
    if (pending.isResend) {
      if (!resendInput) {
        resendInput = document.createElement("input");
        resendInput.type = "hidden";
        resendInput.name = "confirm_resend";
        form.appendChild(resendInput);
      }
      resendInput.value = "1";
    } else {
      resendInput?.remove();
    }
    setPending(null);
    form.requestSubmit();
  };

  return <>
    <form method="post" action={`/api/dashboard/inquiries/${inquiryId}/`} className="dashboard-decision-form" ref={formRef}>
      <div className="form-section client-message-section">
        <p className="form-section-kicker"><i className="bi bi-send" />Visible to the client</p>
        <label htmlFor="client_message">Message to client</label>
        <div className="template-chip-row">
          {ACCEPT_TEMPLATES.map(([label, text]) => <button type="button" className="template-chip" key={`a-${label}`} onClick={() => applyTemplate(text)}><i className="bi bi-check2" /> {label}</button>)}
          {DECLINE_TEMPLATES.map(([label, text]) => <button type="button" className="template-chip" key={`d-${label}`} onClick={() => applyTemplate(text)}><i className="bi bi-x" /> {label}</button>)}
        </div>
        <textarea ref={messageRef} id="client_message" name="client_message" className="form-control" rows={7} maxLength={10000} placeholder="Write a clear update, question, next step, or decision note. This text will be included in the email." defaultValue="" />
        <small>Send Reply emails this message. Accept or Decline will include it as an optional personal note.</small>
      </div>
      <div className="form-section private-note-section">
        <p className="form-section-kicker"><i className="bi bi-lock" />Private — never emailed</p>
        <label htmlFor="admin_notes">Studio notes</label>
        <textarea id="admin_notes" name="admin_notes" className="form-control" rows={6} placeholder="Quote notes, follow-up tasks, or internal reminders." defaultValue={defaultAdminNotes} />
        <label htmlFor="status">Internal workflow status</label>
        <select id="status" name="status" className="form-select" defaultValue={currentStatus}>{INQUIRY_STATUSES.map((value) => <option value={value} key={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select>
        <label className="review-toggle"><input type="checkbox" name="is_reviewed" defaultChecked={defaultReviewed} /> Mark as reviewed</label>
      </div>
      <div className="decision-actions">
        <button className="btn btn-accent" type="submit" name="action" value="reply">Send Reply Email</button>
        <button className="btn btn-outline-light" type="button" disabled={submitting} onClick={() => requestDecision("accept")}>{buttonLabel("accept")}</button>
        <button className="btn btn-outline-danger" type="button" disabled={submitting} onClick={() => requestDecision("reject")}>{buttonLabel("reject")}</button>
        <button className="btn btn-quiet" type="submit" name="action" value="save">Save Private Note Only</button>
      </div>
    </form>

    {pending && <div className="success-celebration" role="dialog" aria-modal="true" aria-labelledby="confirm-decision-title">
      <div className={`confirm-card${pending.isResend ? " is-resend" : ""}`}>
        <button type="button" className="success-close" aria-label="Cancel" onClick={() => setPending(null)}>&times;</button>
        <p className="eyebrow">{pending.action === "accept" ? "Accept Project Request?" : "Decline Project Request?"}</p>
        <h2 id="confirm-decision-title">{fullName}</h2>
        <p className="confirm-subject"><strong>{service}</strong></p>
        {pending.isResend && <p className="confirm-warning"><i className="bi bi-exclamation-triangle" /> This request was already {pending.action === "accept" ? "accepted" : "declined"} and the client was already notified. This will send the notification again.</p>}
        <div className="success-actions">
          <button className="btn btn-outline-light" type="button" onClick={() => setPending(null)}>Cancel</button>
          <button className={pending.action === "accept" ? "btn btn-accent" : "btn btn-outline-danger"} type="button" onClick={confirmDecision}>{pending.action === "accept" ? "Accept & Notify Client" : "Decline & Notify Client"}</button>
        </div>
      </div>
    </div>}
  </>;
}
