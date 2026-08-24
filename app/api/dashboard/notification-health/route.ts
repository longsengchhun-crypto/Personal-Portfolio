import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { emailNotificationReadiness, emailNotificationsConfigured, smsNotificationsConfigured } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const direct = {
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY?.trim()),
    RESEND_FROM_EMAIL: Boolean(process.env.RESEND_FROM_EMAIL?.trim()),
    TWILIO_ACCOUNT_SID: Boolean(process.env.TWILIO_ACCOUNT_SID?.trim()),
    TWILIO_AUTH_TOKEN: Boolean(process.env.TWILIO_AUTH_TOKEN?.trim()),
    TWILIO_FROM_NUMBER: Boolean(process.env.TWILIO_FROM_NUMBER?.trim()),
  };
  const runtimeNames = Object.fromEntries(Object.keys(direct).map((name) => [name, Boolean(process.env[name]?.trim())]));

  return NextResponse.json({
    version: 1,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    emailConfigured: emailNotificationsConfigured(),
    emailReadiness: emailNotificationReadiness(),
    smsConfigured: smsNotificationsConfigured(),
    direct,
    runtimeNames,
  });
}
