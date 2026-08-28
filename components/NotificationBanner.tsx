"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { DeliveryStatus } from "@/lib/notifications";

const channelMessage = (channel: "Email" | "SMS", status: DeliveryStatus) => ({
  sent: `${channel} delivered successfully.`,
  "not-configured": `${channel} was not sent because the production provider is not configured.`,
  "not-applicable": `${channel} was not needed for this action.`,
  failed: `${channel} delivery failed. The project update is saved; check the provider logs and try again.`,
}[status]);

function playSuccessChime() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const now = context.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.13, now + index * 0.09 + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.24);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * 0.09);
    oscillator.stop(now + index * 0.09 + 0.25);
  });
  window.setTimeout(() => context.close().catch(() => {}), 900);
}

export default function NotificationBanner({ emailStatus, smsStatus, actionStatus, dismissHref }: { emailStatus?: string; smsStatus?: string; actionStatus?: string; dismissHref: string }) {
  const valid = new Set<DeliveryStatus>(["sent", "not-configured", "not-applicable", "failed"]);
  const email = valid.has(emailStatus as DeliveryStatus) ? emailStatus as DeliveryStatus : undefined;
  const smsCandidate = actionStatus === "reply" ? undefined : valid.has(smsStatus as DeliveryStatus) ? smsStatus as DeliveryStatus : undefined;
  const sms = smsCandidate === "not-configured" || smsCandidate === "not-applicable" ? undefined : smsCandidate;
  const statuses = [email, sms].filter(Boolean) as DeliveryStatus[];
  const successful = email === "sent";
  const tone = email === "failed" || email === "not-configured" ? "danger" : successful ? "success" : statuses.includes("failed") ? "warning" : "warning";
  const actionLabel = actionStatus === "accepted" ? "Project accepted" : actionStatus === "declined" ? "Project declined" : actionStatus === "reply" ? "Reply sent" : "Project updated";

  useEffect(() => {
    if (email === "sent") playSuccessChime();
  }, [email]);

  if (!email && !sms) return null;
  return <div className={`dashboard-toast dashboard-toast-${tone}`} role="status" aria-live="polite">
    <span className="dashboard-toast-icon" aria-hidden="true"><i className={`bi ${successful ? "bi-check2" : tone === "danger" ? "bi-x-lg" : "bi-exclamation-lg"}`} /></span>
    <div><strong>{actionLabel}</strong><p>{[email && channelMessage("Email", email), sms && channelMessage("SMS", sms)].filter(Boolean).join(" ")}</p></div>
    <Link href={dismissHref} aria-label="Dismiss notification result"><i className="bi bi-x-lg" /></Link>
    <span className="dashboard-toast-progress" aria-hidden="true" />
  </div>;
}
