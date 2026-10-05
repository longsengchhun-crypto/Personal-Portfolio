"use client";

import { useRef, useState, type FormEvent } from "react";
import Dialog from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, CheckCircle2, ChevronDown, Mail, MailCheck } from "@/components/ui/Icon";
import { BUDGET_CHOICES, SERVICE_CHOICES } from "@/lib/content";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
  defaultService?: string;
  /** Message to show when the page was reloaded by a no-JavaScript submission. */
  serverError?: string;
};

type Result = { ok: true; email: string } | { ok: false; message: string };

const ERROR_COPY: Record<string, string> = {
  rate: "You have sent a few requests recently. Please wait a few minutes before sending another.",
  form: "Some details look incomplete. Please check your name, email and message, then try again.",
  attachment: "That attachment could not be accepted. Use a PDF, image or ZIP under 8 MB, or send the message without it.",
};

export default function ContactForm({ defaultName = "", defaultEmail = "", defaultService = "", serverError = "" }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState(serverError ? ERROR_COPY[serverError] || ERROR_COPY.form : "");
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setState("sending");
    setError("");
    try {
      const response = await fetch("/api/inquiries/", { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => null) as { ok?: boolean; email?: string; error?: string } | null;
      if (!response.ok || !data?.ok) {
        setState("idle");
        setError(ERROR_COPY[data?.error || ""] || (response.status === 413 ? ERROR_COPY.attachment : "The message could not be sent. Check your connection and try again, or email me directly."));
        return;
      }
      setState("sent");
      setResult({ ok: true, email: data.email || "" });
      form.reset();
      setFileName("");
      window.setTimeout(() => setState("idle"), 2200);
      new Audio("/static/audio/contact-success-khmer.m4a").play().catch(() => {});
    } catch {
      setState("idle");
      setError("No connection to the server. Check your internet and try again, or email me directly.");
    }
  }

  return <>
    <form ref={formRef} className="cform" action="/api/inquiries/" method="post" encType="multipart/form-data" onSubmit={onSubmit} noValidate={false}>
      {error && <div className="notice notice--error" role="alert"><AlertTriangle aria-hidden="true" /><span>{error}</span></div>}
      <div className="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="honeypot" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="cform__grid">
        <div className="field"><label htmlFor="full_name">Your name</label><input className="input" id="full_name" name="full_name" autoComplete="name" required minLength={2} maxLength={120} defaultValue={defaultName} placeholder="Full name" /></div>
        <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={defaultEmail} placeholder="you@company.com" /></div>
        <div className="field cform__wide"><label htmlFor="service_needed">Project type</label>
          <select className="select" id="service_needed" name="service_needed" required defaultValue={defaultService}>
            <option value="" disabled>Choose what you need</option>
            {SERVICE_CHOICES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="field cform__wide"><label htmlFor="project_description">Tell me about the project</label><textarea className="textarea" id="project_description" name="project_description" rows={6} required minLength={10} maxLength={10000} placeholder="What are you making, who is it for, and what should it feel like?" /><span className="field__hint">The more context, the more useful my first reply will be.</span></div>
      </div>

      <details className="disclosure">
        <summary>Add details <span className="caption">(optional: budget, timeline, files)</span><ChevronDown aria-hidden="true" /></summary>
        <div className="disclosure__body">
          <div className="cform__grid">
            <div className="field"><label htmlFor="phone_or_telegram">Phone or Telegram</label><input className="input" id="phone_or_telegram" name="phone_or_telegram" maxLength={80} placeholder="Easiest way to reach you" /></div>
            <div className="field"><label htmlFor="company">Company</label><input className="input" id="company" name="company" maxLength={140} /></div>
            <div className="field"><label htmlFor="estimated_budget">Budget range</label><select className="select" id="estimated_budget" name="estimated_budget" defaultValue=""><option value="">Not decided</option>{BUDGET_CHOICES.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="field"><label htmlFor="preferred_timeline">Timeline</label><input className="input" id="preferred_timeline" name="preferred_timeline" maxLength={120} placeholder="This month, flexible…" /></div>
            <div className="field cform__wide"><label htmlFor="attachment">Reference file</label><input className="input" id="attachment" name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.zip" onChange={(event) => setFileName(event.target.files?.[0]?.name || "")} /><span className="field__hint">{fileName || "PDF, image or ZIP, up to 8 MB."}</span></div>
          </div>
        </div>
      </details>

      <label className="check"><input type="checkbox" name="consent" required /><span>I agree to be contacted about this project.</span></label>

      <div className="cform__submit">
        <Button type="submit" variant="primary" size="lg" state={state === "sending" ? "loading" : state === "sent" ? "success" : undefined}>{state === "sent" ? "Sent" : "Send message"}</Button>
        <p className="caption"><Mail aria-hidden="true" /> Replies usually arrive within one to two working days.</p>
      </div>
    </form>

    <Dialog open={result?.ok === true} onClose={() => setResult(null)} title="Message received" actions={<Button variant="primary" onClick={() => setResult(null)} data-autofocus>Continue</Button>}>
      <div className="sent">
        <CheckCircle2 className="sent__icon" aria-hidden="true" />
        <p>Thank you. Your project details are with me now, and I will reply by email or Telegram.</p>
        <p className="notice">{result?.ok && result.email === "sent" ? <><MailCheck aria-hidden="true" /><span>A confirmation email is on its way to your inbox.</span></> : <><Mail aria-hidden="true" /><span>Your request is saved and ready for my review.</span></>}</p>
      </div>
    </Dialog>
  </>;
}
