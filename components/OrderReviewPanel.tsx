"use client";

import { useRef, useState } from "react";

export default function OrderReviewPanel({ orderId, customerName, canReview }: { orderId: number; customerName: string; canReview: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function confirm() {
    if (!pending || !formRef.current) return;
    const form = formRef.current;
    let decisionInput = form.querySelector<HTMLInputElement>('input[name="decision"]');
    if (!decisionInput) {
      decisionInput = document.createElement("input");
      decisionInput.type = "hidden";
      decisionInput.name = "decision";
      form.appendChild(decisionInput);
    }
    decisionInput.value = pending;
    setSubmitting(true);
    setPending(null);
    form.requestSubmit();
  }

  if (!canReview) return null;

  return <>
    <form method="post" action="/api/dashboard/store/orders/" ref={formRef} className="dashboard-decision-form">
      <input type="hidden" name="id" value={orderId} />
      <div className="form-section private-note-section">
        <p className="form-section-kicker"><i className="bi bi-lock" />Included in the customer email if rejected</p>
        <label htmlFor="admin_notes">Notes</label>
        <textarea id="admin_notes" name="admin_notes" className="form-control" rows={3} placeholder="Reason for rejection, or internal notes." />
      </div>
      <div className="decision-actions">
        <button className="btn btn-accent" type="button" disabled={submitting} onClick={() => setPending("approve")}><i className="bi bi-check2-circle" />Approve Payment</button>
        <button className="btn btn-outline-danger" type="button" disabled={submitting} onClick={() => setPending("reject")}><i className="bi bi-x-circle" />Reject Payment</button>
      </div>
    </form>

    {pending && <div className="success-celebration" role="dialog" aria-modal="true" aria-labelledby="confirm-order-title">
      <div className={`confirm-card${pending === "reject" ? " is-resend" : ""}`}>
        <button type="button" className="success-close" aria-label="Cancel" onClick={() => setPending(null)}>&times;</button>
        <p className="eyebrow">{pending === "approve" ? "Approve This Payment?" : "Reject This Payment?"}</p>
        <h2 id="confirm-order-title">{customerName}</h2>
        <p className="confirm-subject">{pending === "approve" ? "The customer will be emailed a link to download their files immediately." : "The customer will be emailed that their payment could not be verified, with your notes included."}</p>
        <div className="success-actions">
          <button className="btn btn-outline-light" type="button" onClick={() => setPending(null)}>Cancel</button>
          <button className={pending === "approve" ? "btn btn-accent" : "btn btn-outline-danger"} type="button" onClick={confirm}>{pending === "approve" ? "Approve & Notify Customer" : "Reject & Notify Customer"}</button>
        </div>
      </div>
    </div>}
  </>;
}
