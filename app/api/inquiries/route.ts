import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { inquirySchema } from "@/lib/validation";
import { clientEmailCopy, sendInquiryEmail } from "@/lib/notifications";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/zip", "application/x-zip-compressed"]);

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const parsed = inquirySchema.safeParse(Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")));
  if (!parsed.success) return NextResponse.redirect(new URL("/contact/?error=form", request.url), 303);
  const attachment = form.get("attachment");
  if (attachment instanceof File && attachment.size > 8 * 1024 * 1024) return NextResponse.redirect(new URL("/contact/?error=form", request.url), 303);
  if (attachment instanceof File && attachment.size && !allowedTypes.has(attachment.type)) return NextResponse.redirect(new URL("/contact/?error=form", request.url), 303);

  const supabase = getSupabase();
  let attachmentPath = "";
  if (attachment instanceof File && attachment.size) {
    const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    attachmentPath = `inquiries/${Date.now()}-${randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("portfolio-media").upload(attachmentPath, attachment, { contentType: attachment.type, upsert: false });
    if (error) return NextResponse.redirect(new URL("/contact/?error=form", request.url), 303);
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const { data: inquiryId, error } = await supabase.rpc("submit_inquiry", {
    p_full_name: parsed.data.full_name, p_email: parsed.data.email,
    p_phone_or_telegram: parsed.data.phone_or_telegram, p_company: parsed.data.company,
    p_service_needed: parsed.data.service_needed, p_estimated_budget: parsed.data.estimated_budget,
    p_preferred_timeline: parsed.data.preferred_timeline, p_project_description: parsed.data.project_description,
    p_attachment: attachmentPath, p_ip_address: ip,
  });
  if (error) {
    const reason = error.message.includes("rate_limited") ? "rate" : "form";
    return NextResponse.redirect(new URL(`/contact/?error=${reason}`, request.url), 303);
  }
  const id = Number(inquiryId);
  const receiptInput = {
    inquiryId: id,
    email: parsed.data.email,
    fullName: parsed.data.full_name,
    service: parsed.data.service_needed,
    kind: "receipt" as const,
  };
  const emailStatus = Number.isInteger(id) ? await sendInquiryEmail(receiptInput) : "failed";
  const dashboardToken = process.env.SUPABASE_DASHBOARD_TOKEN;
  if (dashboardToken && Number.isInteger(id)) {
    const copy = clientEmailCopy(receiptInput);
    const { error: logError } = await supabase.rpc("dashboard_record_notification", {
      p_token: dashboardToken, p_id: id, p_message_type: "receipt",
      p_subject: copy.subject, p_body: copy.body, p_delivery_status: emailStatus,
    });
    if (logError) console.error("Inquiry receipt log failed", logError);
  }
  return NextResponse.redirect(new URL(`/contact/?sent=1&email=${emailStatus}`, request.url), 303);
}
