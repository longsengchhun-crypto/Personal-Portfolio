import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getCustomer } from "@/lib/customerAuth";
import { getSupabase } from "@/lib/supabase";
import { inquirySchema } from "@/lib/validation";
import { clientEmailCopy, sendAdminInquiryNotification, sendInquiryEmail } from "@/lib/notifications";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/zip", "application/x-zip-compressed"]);
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

// The contact form posts with fetch and `Accept: application/json` for instant in-page feedback;
// a plain form post (no JavaScript) still works and is answered with a redirect.
export async function POST(request: NextRequest) {
  const wantsJson = (request.headers.get("accept") || "").includes("application/json");
  const fail = (reason: "form" | "rate" | "attachment") => wantsJson
    ? NextResponse.json({ ok: false, error: reason }, { status: reason === "rate" ? 429 : 400 })
    : NextResponse.redirect(new URL(`/contact/?error=${reason}`, request.url), 303);
  const succeed = (emailStatus: string) => wantsJson
    ? NextResponse.json({ ok: true, email: emailStatus })
    : NextResponse.redirect(new URL(`/contact/?sent=1&email=${emailStatus}`, request.url), 303);

  const form = await request.formData();
  const parsed = inquirySchema.safeParse(Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string")));
  if (!parsed.success) return fail("form");
  const attachment = form.get("attachment");
  if (attachment instanceof File && attachment.size > MAX_ATTACHMENT_BYTES) return fail("attachment");
  if (attachment instanceof File && attachment.size && !allowedTypes.has(attachment.type)) return fail("attachment");

  const supabase = getSupabase();
  let attachmentPath = "";
  if (attachment instanceof File && attachment.size) {
    const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    attachmentPath = `inquiries/${Date.now()}-${randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("portfolio-media").upload(attachmentPath, attachment, { contentType: attachment.type, upsert: false });
    if (error) return fail("attachment");
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const customer = await getCustomer();
  const { data: inquiryId, error } = await supabase.rpc("submit_inquiry", {
    p_full_name: parsed.data.full_name, p_email: parsed.data.email,
    p_phone_or_telegram: parsed.data.phone_or_telegram, p_company: parsed.data.company,
    p_service_needed: parsed.data.service_needed, p_estimated_budget: parsed.data.estimated_budget,
    p_preferred_timeline: parsed.data.preferred_timeline, p_project_description: parsed.data.project_description,
    p_attachment: attachmentPath, p_ip_address: ip, p_customer_id: customer?.id ?? null,
  });
  if (error) return fail(error.message.includes("rate_limited") ? "rate" : "form");

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

  if (Number.isInteger(id)) {
    const dashboardUrl = new URL(`/dashboard/messages/${id}/`, request.url).toString();
    after(async () => {
      const notification = await sendAdminInquiryNotification({
        inquiryId: id,
        fullName: parsed.data.full_name,
        email: parsed.data.email,
        service: parsed.data.service_needed,
        estimatedBudget: parsed.data.estimated_budget,
        preferredTimeline: parsed.data.preferred_timeline,
        projectDescription: parsed.data.project_description,
        companyOrPhone: [parsed.data.company, parsed.data.phone_or_telegram].filter(Boolean).join(" · "),
        dashboardUrl,
      });
      if (dashboardToken) {
        const { error: adminLogError } = await getSupabase().rpc("dashboard_record_notification", {
          p_token: dashboardToken, p_id: id, p_message_type: "admin_notify",
          p_subject: notification.subject, p_body: notification.body, p_delivery_status: notification.status,
        });
        if (adminLogError) console.error("Admin notification log failed", adminLogError);
      }
    });
  }

  return succeed(emailStatus);
}
