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

export function clientEmailCopy(input: Pick<ClientEmailInput, "inquiryId" | "fullName" | "service" | "kind" | "message">) {
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
    "You can reply directly to this email if you have any questions.", "", "LONG SENGCHHUN", "", `Request ID: #INQ-${input.inquiryId}`,
  ].join("\n");
  const html = `<div style="margin:0;background:#f4f6f8;padding:28px 14px;font-family:Arial,sans-serif;color:#111827"><div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #dce3e8;border-radius:14px;overflow:hidden"><div style="height:5px;background:#00b7e8"></div><div style="padding:30px"><p style="margin:0 0 8px;color:#537080;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">LONG SENGCHHUN Creative Studio</p><h1 style="margin:0 0 18px;font-size:25px;line-height:1.25">${escapeHtml(content.heading)}</h1><p>Hello ${escapeHtml(input.fullName)},</p><p lang="km" style="font-size:17px;font-weight:700">${escapeHtml(content.khmer)}</p><p style="line-height:1.7;white-space:pre-line">${escapeHtml(plainBody)}</p><p style="margin-top:24px;color:#537080;font-size:14px">You can reply directly to this email if you have any questions.</p><p style="margin:26px 0 0"><strong>LONG SENGCHHUN</strong><br><span style="color:#537080">Visual Creative & Media</span></p><p style="margin:18px 0 0;color:#8a9aa5;font-size:12px">Request ID: #INQ-${input.inquiryId}</p></div></div></div>`;
  return { subject: content.subject, text, html, body: plainBody };
}

type DeliverEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  logContext: Record<string, unknown>;
};

async function deliverEmail(input: DeliverEmailInput): Promise<DeliveryStatus> {
  const readiness = emailNotificationReadiness();
  if (!readiness.configured) {
    console.error("Email not configured", { ...input.logContext, reason: readiness.message });
    return "not-configured";
  }
  const failures: string[] = [];
  const resendApiKey = serverEnv("RESEND_API_KEY");

  if (resendApiKey && resendSender() && readiness.provider === "resend") {
    try {
      let response: Response | undefined;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": input.idempotencyKey,
            "User-Agent": "Long-Sengchhun-Portfolio/2.0",
          },
          body: JSON.stringify({
            from: resendSender(),
            reply_to: serverEnv("EMAIL_REPLY_TO") || serverEnv("DEFAULT_FROM_EMAIL") || undefined,
            to: [input.to], subject: input.subject, html: input.html, text: input.text,
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
      console.info("Email accepted", { ...input.logContext, provider: "resend", providerId: result.id || null });
      return "sent";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error("Email provider failed", { ...input.logContext, provider: "resend", error: message });
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
        to: input.to, subject: input.subject, text: input.text, html: input.html,
      });
      console.info("Email accepted", { ...input.logContext, provider: "smtp" });
      return "sent";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.error("Email provider failed", { ...input.logContext, provider: "smtp", error: message });
    }
  }

  console.error("Email failed", { ...input.logContext, failures });
  return "failed";
}

export async function sendInquiryEmail(input: ClientEmailInput): Promise<DeliveryStatus> {
  const copy = clientEmailCopy(input);
  const fingerprint = createHash("sha256").update(`${input.kind}:${copy.body}`).digest("hex").slice(0, 20);
  return deliverEmail({
    to: input.email, subject: copy.subject, html: copy.html, text: copy.text,
    idempotencyKey: `inquiry-${input.inquiryId}-${input.kind}-${fingerprint}`,
    logContext: { inquiryId: input.inquiryId, kind: input.kind, channel: "client" },
  });
}


export function adminInquiryEmailCopy(input: {
  inquiryId: number; fullName: string; email: string; service: string;
  estimatedBudget: string; preferredTimeline: string; projectDescription: string;
  companyOrPhone: string; dashboardUrl: string; receivedAt: string;
}) {
  const subject = `New Client Inquiry — ${input.fullName}`;
  const rows: [string, string][] = [
    ["Client", input.fullName],
    ["Email", input.email],
    ["Service", input.service],
    ["Budget", input.estimatedBudget || "Not specified"],
    ["Timeline", input.preferredTimeline || "Not specified"],
  ];
  if (input.companyOrPhone) rows.push(["Company / Contact", input.companyOrPhone]);
  const text = [
    `New client inquiry #INQ-${input.inquiryId}`, "",
    ...rows.map(([label, value]) => `${label}: ${value}`), "",
    "Message:", input.projectDescription, "",
    `View in dashboard: ${input.dashboardUrl}`, "", `Received: ${input.receivedAt}`,
  ].join("\n");
  const html = `<div style="margin:0;background:#f4f6f8;padding:28px 14px;font-family:Arial,sans-serif;color:#111827"><div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #dce3e8;border-radius:14px;overflow:hidden"><div style="height:5px;background:#00b7e8"></div><div style="padding:30px"><p style="margin:0 0 8px;color:#537080;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">LONG SENGCHHUN Creative Studio</p><h1 style="margin:0 0 22px;font-size:23px;line-height:1.25">New client inquiry</h1><table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([label, value]) => `<tr><td style="padding:8px 0;color:#537080;width:130px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;font-weight:700">${escapeHtml(value)}</td></tr>`).join("")}</table><p style="margin:22px 0 6px;color:#537080;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Message</p><p style="line-height:1.7;white-space:pre-line;margin:0">${escapeHtml(input.projectDescription)}</p><a href="${input.dashboardUrl}" style="display:inline-block;margin-top:26px;background:#00b7e8;color:#031014;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:4px">View in Admin Dashboard</a><p style="margin:24px 0 0;color:#8a9aa5;font-size:12px">Inquiry #INQ-${input.inquiryId} · Received ${escapeHtml(input.receivedAt)}</p></div></div></div>`;
  return { subject, text, html };
}

export async function sendAdminInquiryNotification(input: {
  inquiryId: number; fullName: string; email: string; service: string;
  estimatedBudget: string; preferredTimeline: string; projectDescription: string;
  companyOrPhone: string; dashboardUrl: string;
}): Promise<{ status: DeliveryStatus; subject: string; body: string }> {
  const recipient = serverEnv("ADMIN_NOTIFICATION_EMAIL") || "longsengchhun@gmail.com";
  const copy = adminInquiryEmailCopy({
    ...input,
    receivedAt: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Phnom_Penh" }).format(new Date()),
  });
  const status = await deliverEmail({
    to: recipient, subject: copy.subject, html: copy.html, text: copy.text,
    idempotencyKey: `admin-notify-${input.inquiryId}`,
    logContext: { inquiryId: input.inquiryId, channel: "admin" },
  });
  return { status, subject: copy.subject, body: copy.text };
}

function orderEmailShell(heading: string, bodyHtml: string) {
  return `<div style="margin:0;background:#f4f6f8;padding:28px 14px;font-family:Arial,sans-serif;color:#111827"><div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #dce3e8;border-radius:14px;overflow:hidden"><div style="height:5px;background:#00b7e8"></div><div style="padding:30px"><p style="margin:0 0 8px;color:#537080;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">LONG SENGCHHUN Creative Studio</p><h1 style="margin:0 0 18px;font-size:23px;line-height:1.25">${escapeHtml(heading)}</h1>${bodyHtml}<p style="margin:26px 0 0"><strong>LONG SENGCHHUN</strong><br><span style="color:#537080">Film • Motion • Design • Visual Storytelling</span></p></div></div></div>`;
}

export function orderStatusEmailCopy(input: {
  kind: "submitted" | "approved" | "rejected"; orderNumber: string; customerName: string;
  productTitle: string; orderUrl: string; adminNotes?: string;
}) {
  const content = {
    submitted: {
      subject: `Payment received — ${input.orderNumber}`,
      heading: "Your payment is under review",
      body: "Thank you — I've received your payment details and will review them shortly. You'll get an email as soon as it's confirmed.",
    },
    approved: {
      subject: `Payment approved — download ready — ${input.orderNumber}`,
      heading: "Your model is ready to download",
      body: "Your payment has been confirmed. You can now download your purchased files from your order page.",
    },
    rejected: {
      subject: `Update on your order — ${input.orderNumber}`,
      heading: "There was an issue with your payment",
      body: (input.adminNotes ? `${input.adminNotes}\n\n` : "") + "Please review the details or reach out if you believe this is a mistake.",
    },
  }[input.kind];
  const text = [`Hello ${input.customerName},`, "", content.body, "", `Order: ${input.orderNumber}`, `Product: ${input.productTitle}`, "", `View your order: ${input.orderUrl}`].join("\n");
  const html = orderEmailShell(content.heading, `<p>Hello ${escapeHtml(input.customerName)},</p><p style="line-height:1.7;white-space:pre-line">${escapeHtml(content.body)}</p><table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px"><tr><td style="padding:6px 0;color:#537080;width:100px">Order</td><td style="padding:6px 0;font-weight:700">${escapeHtml(input.orderNumber)}</td></tr><tr><td style="padding:6px 0;color:#537080">Product</td><td style="padding:6px 0;font-weight:700">${escapeHtml(input.productTitle)}</td></tr></table><a href="${input.orderUrl}" style="display:inline-block;margin-top:22px;background:#00b7e8;color:#031014;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:4px">View Your Order</a>`);
  return { subject: content.subject, text, html };
}

export async function sendOrderCustomerEmail(input: {
  orderId: number; customerEmail: string; kind: "submitted" | "approved" | "rejected";
  orderNumber: string; customerName: string; productTitle: string; orderUrl: string; adminNotes?: string;
}): Promise<{ status: DeliveryStatus; subject: string; body: string }> {
  const copy = orderStatusEmailCopy(input);
  const status = await deliverEmail({
    to: input.customerEmail, subject: copy.subject, html: copy.html, text: copy.text,
    idempotencyKey: `order-${input.orderId}-${input.kind}`,
    logContext: { orderId: input.orderId, kind: input.kind, channel: "client" },
  });
  return { status, subject: copy.subject, body: copy.text };
}

export async function sendOrderAdminNotification(input: {
  orderId: number; orderNumber: string; customerName: string; customerEmail: string;
  productTitle: string; priceUsd: number; dashboardUrl: string;
}): Promise<{ status: DeliveryStatus; subject: string; body: string }> {
  const recipient = serverEnv("ADMIN_NOTIFICATION_EMAIL") || "longsengchhun@gmail.com";
  const subject = `New payment to review — ${input.orderNumber}`;
  const rows: [string, string][] = [
    ["Order", input.orderNumber], ["Customer", input.customerName], ["Email", input.customerEmail],
    ["Product", input.productTitle], ["Amount", `$${input.priceUsd.toFixed(2)}`],
  ];
  const text = [subject, "", ...rows.map(([l, v]) => `${l}: ${v}`), "", `Review: ${input.dashboardUrl}`].join("\n");
  const html = orderEmailShell("New payment to review", `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([l, v]) => `<tr><td style="padding:8px 0;color:#537080;width:130px">${escapeHtml(l)}</td><td style="padding:8px 0;font-weight:700">${escapeHtml(v)}</td></tr>`).join("")}</table><a href="${input.dashboardUrl}" style="display:inline-block;margin-top:22px;background:#00b7e8;color:#031014;font-weight:700;text-decoration:none;padding:12px 20px;border-radius:4px">Review Payment</a>`);
  const status = await deliverEmail({
    to: recipient, subject, html, text,
    idempotencyKey: `order-admin-notify-${input.orderId}`,
    logContext: { orderId: input.orderId, channel: "admin" },
  });
  return { status, subject, body: text };
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
