import assert from "node:assert/strict";
import test from "node:test";
import {
  clientEmailCopy,
  emailNotificationReadiness,
  emailNotificationsConfigured,
  normalizePhoneNumber,
  notifyInquiryClient,
  sendInquiryEmail,
  smsNotificationsConfigured,
} from "../lib/notifications";

const providerKeys = [
  "RESEND_API_KEY", "RESEND_FROM_EMAIL", "EMAIL_HOST", "EMAIL_HOST_USER", "EMAIL_HOST_PASSWORD",
  "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "TWILIO_MESSAGING_SERVICE_SID", "ENABLE_SMS_NOTIFICATIONS",
] as const;

const baseInput = {
  inquiryId: 42,
  email: "client@example.com",
  phoneOrTelegram: "012 345 678",
  fullName: "Test Client",
  service: "Web Design",
  status: "accepted" as const,
};

function preserveProviderEnvironment() {
  const original = Object.fromEntries(providerKeys.map((key) => [key, process.env[key]]));
  providerKeys.forEach((key) => delete process.env[key]);
  return () => providerKeys.forEach((key) => {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
}

test("decision notifications report missing providers and non-phone contacts accurately", async () => {
  const restore = preserveProviderEnvironment();
  try {
    assert.equal(emailNotificationsConfigured(), false);
    assert.equal(smsNotificationsConfigured(), false);
    assert.deepEqual(await notifyInquiryClient({ ...baseInput, phoneOrTelegram: "@telegram_user" }), {
      email: "not-configured",
      sms: "not-applicable",
    });
  } finally {
    restore();
  }
});

test("Cambodian and international phone numbers normalize to E.164", () => {
  assert.equal(normalizePhoneNumber("012 345 678"), "+85512345678");
  assert.equal(normalizePhoneNumber("+1 (202) 555-0123"), "+12025550123");
  assert.equal(normalizePhoneNumber("@telegram_user"), null);
});

test("placeholder senders are rejected instead of being reported ready", () => {
  const restore = preserveProviderEnvironment();
  try {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "Portfolio <hello@yourdomain.com>";
    assert.equal(emailNotificationsConfigured(), false);
    assert.equal(emailNotificationReadiness().mode, "invalid");
  } finally {
    restore();
  }
});

test("Resend email and Twilio SMS are both called for a client decision", async () => {
  const restore = preserveProviderEnvironment();
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "Portfolio <hello@studio.test>";
  process.env.TWILIO_ACCOUNT_SID = "AC_test_sid";
  process.env.TWILIO_AUTH_TOKEN = "test_token";
  process.env.TWILIO_FROM_NUMBER = "+12025550123";
  process.env.ENABLE_SMS_NOTIFICATIONS = "true";
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    assert.deepEqual(await notifyInquiryClient(baseInput), { email: "sent", sms: "sent" });
    assert.equal(calls.length, 2);
    const resend = calls.find((call) => call.url === "https://api.resend.com/emails");
    const twilio = calls.find((call) => call.url.includes("api.twilio.com"));
    assert.ok(resend);
    assert.ok(twilio);
    assert.equal(JSON.parse(String(resend.init?.body)).to[0], "client@example.com");
    const smsBody = twilio.init?.body as URLSearchParams;
    assert.equal(smsBody.get("To"), "+85512345678");
    assert.equal(smsBody.get("From"), "+12025550123");
  } finally {
    globalThis.fetch = originalFetch;
    restore();
  }
});

test("client replies preserve the written message and send email without requiring SMS", async () => {
  const restore = preserveProviderEnvironment();
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "Portfolio <hello@studio.test>";
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const message = "Thank you. Could you send the final logo file?";
    const copy = clientEmailCopy({ fullName: "Test Client", service: "Poster Design", kind: "reply", message });
    assert.equal(copy.body, message);
    assert.match(copy.text, /final logo file/);
    assert.equal(await sendInquiryEmail({ inquiryId: 42, email: "client@example.com", fullName: "Test Client", service: "Poster Design", kind: "reply", message }), "sent");
    assert.equal(calls.length, 1);
    const body = JSON.parse(String(calls[0].init?.body));
    assert.match(body.subject, /Reply to your Poster Design/);
    assert.match(body.text, /final logo file/);
  } finally {
    globalThis.fetch = originalFetch;
    restore();
  }
});
