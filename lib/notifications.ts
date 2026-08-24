import { createHash } from "node:crypto";
import nodemailer from "nodemailer";

export type DeliveryStatus = "sent" | "not-configured" | "not-applicable" | "failed";
export type NotificationDelivery = { email: DeliveryStatus; sms: DeliveryStatus };
export type ClientEmailKind = "receipt" | "accepted" | "declined" | "reply" | "status";
export type EmailReadiness = {
  configured: boolean;
  provider: "resend" | "smtp" | "none";
  mode: "production" | "testing" | "invalid" | "none";
  message: string;
};

type ClientEmailInput = {
  inquiryId: number;
  email: string;
  fullName: string;
  service: string;
  kind: ClientEmailKind;
  message?: string;
};

const serverEnv = (name: string) => process.env[name]?.trim() || "";
const resendSender = () => serverEnv("RESEND_FROM_EMAIL") || serverEnv("DEFAULT_FROM_EMAIL");
const smtpReady = () => Boolean(serverEnv("EMAIL_HOST") && serverEnv("EMAIL_HOST_USER") && serverEnv("EMAIL_HOST_PASSWORD"));

function senderDomain(value: string) {
  return value.match(/@([^>\s]+)>?$/)?.[1]?.toLowerCase() || "";
}

export function emailNotificationReadiness(): EmailReadiness {
  const apiKey = serverEnv("RESEND_API_KEY");
  const sender = resendSender();
  const domain = senderDomain(sender);
  const placeholder = !domain || domain === "yourdomain.com" || domain === "example.com" || domain.endsWith(".example.com");

  if (apiKey && sender && !placeholder) {
    if (domain === "resend.dev") {
      return {
        configured: true,
        provider: "resend",
        mode: "testing",
        message: "Resend test mode can email only the Resend account owner. Verify a custom domain for client delivery.",
      };
    }
    return { configured: true, provider: "resend", mode: "production", message: `Resend sender configured for ${domain}.` };
  }
  if (smtpReady()) {
    return { configured: true, provider: "smtp", mode: "production", message: "SMTP fallback is configured." };
  }
  if (apiKey && sender && placeholder) {
    return { configured: false, provider: "none", mode: "invalid", message: "The sender uses a placeholder domain. Add a verified Resend domain or SMTP account." };
  }
  return { configured: false, provider: "none", mode: "none", message: "No usable email provider is configured." };
}

export function emailNotificationsConfigured() {
  return emailNotificationReadiness().configured;
}

export function smsNotificationsConfigured() {
  return Boolean(
    serverEnv("ENABLE_SMS_NOTIFICATIONS").toLowerCase() === "true" &&
    serverEnv("TWILIO_ACCOUNT_SID") &&
    serverEnv("TWILIO_AUTH_TOKEN") &&
    (serverEnv("TWILIO_FROM_NUMBER") || serverEnv("TWILIO_MESSAGING_SERVICE_SID")),
  );
}

export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !/^[+\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  else if (trimmed.startsWith("0")) digits = `855${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
}[character] || character));

export function clientEmailCopy(input: Pick<ClientEmailInput, "fullName" | "service" | "kind" | "message">) {
  const customMessage = input.message?.trim() || "";
  const content = {
    receipt: {
      subject: `Project request received — ${input.service}`,
      heading: "Your project request is safely received",
      khmer: "សំណើគម្រោងរបស់លោកអ្នកត្រូវបានទទួលដោយជោគជ័យ។",
      body: "Thank you for sharing your project. I will review the details and reply to this email with the next step as soon as possible.",
    },
    accepted: {
      subject: `Your ${input.service} project has been accepted`,
      heading: "Your project request has been accepted",
      khmer: "សំណើគម្រោងរបស់លោកអ្នកត្រូវបានទទួលយក។",
      body: "Good news — I am ready to move forward with your project. I will contact you with the schedule and next steps.",
    },
    declined: {
      subject: `Update about your ${input.service} request`,
      heading: "An update about your project request",
      khmer: "សូមអរគុណចំពោះសំណើគម្រោងរបស់លោកអ្នក។",
      body: "Thank you for considering me. Unfortunately, I am unable to accept this project at this time.",
    },
    reply: {
      subject: `Reply to your ${input.service} project request`,
      heading: "A new reply about your project",
      khmer: "លោកអ្នកមានសារថ្មីអំពីសំណើគម្រោង។",
      body: customMessage || "I have reviewed your request and have an update for you.",
    },
    status: {
      subject: `Status update — ${input.service}`,
      heading: "Your project request has an update",
      khmer: "សំណើគម្រោងរបស់លោកអ្នកមានបច្ចុប្បន្នភាពថ្មី។",
      body: customMessage || "Your project request status has been updated.",
    },
  }[input.kind];
  const detail = customMessage && input.kind !== "reply" && input.kind !== "status" ? customMessage : "";
  const plainBody = [content.body, detail].filter(Boolean).join("\n\n");
  const text = [
    `Hello ${input.fullName},`, "", content.khmer, "", plainBody, "",
    "You can reply directly to this email if you have any questions.", "", "LONG SENGCHHUN",
  ].join("\n");
  const html = `<div style="margin:0;background:#f4f6f8;padding:28px 14px;font-family:Arial,sans-serif;color:#111827"><div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #dce3e8;border-radius:14px;overflow:hidden"><div style="height:5px;background:#00b7e8"></div><div style="padding:30px"><p style="margin:0 0 8px;color:#537080;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">LONG SENGCHHUN Creative Studio</p><h1 style="margin:0 0 18px;font-size:25px;line-height:1.25">${escapeHtml(content.heading)}</h1><p>Hello ${escapeHtml(input.fullName)},</p><p lang="km" style="font-size:17px;font-weight:700">${escapeHtml(content.khmer)}</p><p style="line-height:1.7;white-space:pre-line">${escapeHtml(plainBody)}</p><p style="margin-top:24px;color:#537080;font-size:14px">You can reply directly to this email if you have any questions.</p><p style="margin:26px 0 0"><strong>LONG SENGCHHUN</strong><br><span style="color:#537080">Multidisciplinary Creative Designer</span></p></div></div></div>`;
  return { subject: content.subject, text, html, body: plainBody };
}

export async function sendInquiryEmail(input: ClientEmailInput): Promise<DeliveryStatus> {
  const readiness = emailNotificationReadiness();
  if (!readiness.configured) {
    console.error("Client email not configured", { inquiryId: input.inquiryId, kind: input.kind, reason: readiness.message });
    return "not-configured";
  }
  const copy = clientEmailCopy(input);
  const failures: string[] = [];
  const resendApiKey = serverEnv("RESEND_API_KEY");

  if (resendApiKey && resendSender() && readiness.provider === "resend") {
    try {
      const fingerprint = createHash("sha256").update(`${input.kind}:${copy.body}`).digest("hex").slice(0, 20);
      let response: Response | undefined;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `inquiry-${input.inquiryId}-${input.kind}-${fingerprint}`,
            "User-Agent": "Long-Sengchhun-Portfolio/2.0",
          },
          body: JSON.stringify({
            from: resendSender(),
            reply_to: serverEnv("EMAIL_REPLY_TO") || serverEnv("DEFAULT_FROM_EMAIL") || undefined,
            to: [input.email], subject: copy.subject, html: copy.html, text: copy.text,
          }),
          signal: AbortSignal.timeout(12_000),
        });
        if (response.ok || (response.status !== 429 && response.status < 500)) break;
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
      if (!response?.ok) {
        const providerBody = await response?.text().catch(() => "") || "";
        throw new Error(`Resend HTTP ${response?.status || "unknown"}: ${providerBody.slice(0, 800)}`);
      }
      const result = await response.json().catch(() => ({})) as { id?: string };
      console.info("Client email accepted", { inquiryId: input.inquiryId, kind: input.kind, provider: "resend", providerId: result.id || null });
      return "sent";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error("Client email provider failed", { inquiryId: input.inquiryId, kind: input.kind, provider: "resend", error: message });
    }
  }

  if (smtpReady()) {
    try {
      const port = Number(serverEnv("EMAIL_PORT") || 587);
      const transport = nodemailer.createTransport({
        host: serverEnv("EMAIL_HOST"), port, secure: port === 465,
        auth: { user: serverEnv("EMAIL_HOST_USER"), pass: serverEnv("EMAIL_HOST_PASSWORD") },
        connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 12_000,
      });
      await transport.sendMail({
        from: serverEnv("DEFAULT_FROM_EMAIL") || serverEnv("EMAIL_HOST_USER"),
        replyTo: serverEnv("EMAIL_REPLY_TO") || undefined,
        to: input.email, subject: copy.subject, text: copy.text, html: copy.html,
      });
      console.info("Client email accepted", { inquiryId: input.inquiryId, kind: input.kind, provider: "smtp" });
      return "sent";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error("Client email provider failed", { inquiryId: input.inquiryId, kind: input.kind, provider: "smtp", error: message });
    }
  }

  console.error("Client email failed", { inquiryId: input.inquiryId, kind: input.kind, failures });
  return "failed";
}

async function sendDecisionSms(input: {
  phoneOrTelegram: string;
  service: string;
  status: "accepted" | "declined";
}): Promise<DeliveryStatus> {
  const phone = normalizePhoneNumber(input.phoneOrTelegram);
  if (!phone) return "not-applicable";
  if (!smsNotificationsConfigured()) return "not-configured";
  const accountSid = serverEnv("TWILIO_ACCOUNT_SID");
  const authToken = serverEnv("TWILIO_AUTH_TOKEN");
  const params = new URLSearchParams({
    To: phone,
    Body: input.status === "accepted"
      ? `LONG SENGCHHUN: Your ${input.service} project inquiry has been accepted. I will contact you with the next steps.`
      : `LONG SENGCHHUN: Thank you for your ${input.service} inquiry. It cannot be accepted at this time.`,
  });
  const messagingServiceSid = serverEnv("TWILIO_MESSAGING_SERVICE_SID");
  if (messagingServiceSid) params.set("MessagingServiceSid", messagingServiceSid);
  else params.set("From", serverEnv("TWILIO_FROM_NUMBER"));
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params, signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      const providerBody = await response.text().catch(() => "");
      throw new Error(`Twilio HTTP ${response.status}: ${providerBody.slice(0, 800)}`);
    }
    return "sent";
  } catch (error) {
    console.error("Client decision SMS failed", error);
    return "failed";
  }
}

export async function notifyInquiryClient(input: {
  inquiryId: number;
  email: string;
  phoneOrTelegram: string;
  fullName: string;
  service: string;
  status: "accepted" | "declined";
  message?: string;
}): Promise<NotificationDelivery> {
  const [email, sms] = await Promise.all([
    sendInquiryEmail({ ...input, kind: input.status, message: input.message }),
    sendDecisionSms(input),
  ]);
  return { email, sms };
}
