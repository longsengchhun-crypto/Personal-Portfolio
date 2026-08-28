import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { INQUIRY_STATUSES } from "@/lib/content";
import { getDashboardInquiry } from "@/lib/data";
import { clientEmailCopy, notifyInquiryClient, sendInquiryEmail, type NotificationDelivery } from "@/lib/notifications";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/dashboard/login/", request.url), 303);
  const id = Number((await params).id);
  const form = await request.formData();
  const action = String(form.get("action") || "save");
  const requested = String(form.get("status") || "new");
  const clientMessage = String(form.get("client_message") || "").trim().slice(0, 10_000);
  const status = action === "accept" ? "accepted" : action === "reject" ? "declined" : action === "reply" ? "replied" : INQUIRY_STATUSES.includes(requested as never) ? requested : "new";
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  if (!token || !Number.isInteger(id)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const existing = await getDashboardInquiry(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (action === "reply" && !clientMessage) {
    const invalidUrl = new URL(`/dashboard/inquiries/${id}/`, request.url);
    invalidUrl.searchParams.set("form", "message-required");
    return NextResponse.redirect(invalidUrl, 303);
  }
  const { error } = await getSupabase().rpc("dashboard_update_inquiry", { p_token: token, p_id: id, p_status: status, p_admin_notes: String(form.get("admin_notes") ?? existing.admin_notes), p_is_reviewed: form.get("is_reviewed") === "on" || status !== "new" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let notification: NotificationDelivery | undefined;
  let messageType: "accepted" | "declined" | "reply" | undefined;
  let skippedDuplicate = false;

  if (action === "accept" || action === "reject") {
    // Guard against re-sending a decision notification that already succeeded — a rapid
    // double-click or re-clicking "Accept" later shouldn't email/SMS the client twice.
    // A previous failure (or an explicit confirmed resend) is still allowed through.
    const alreadyDecidedThisWay = existing.status === status;
    const alreadyNotifiedSuccessfully = alreadyDecidedThisWay && existing.last_notification_status === "sent";
    const explicitResend = form.get("confirm_resend") === "1";

    if (alreadyNotifiedSuccessfully && !explicitResend) {
      skippedDuplicate = true;
    } else {
      messageType = status as "accepted" | "declined";
      notification = await notifyInquiryClient({
        inquiryId: id,
        email: existing.email,
        phoneOrTelegram: existing.phone_or_telegram,
        fullName: existing.full_name,
        service: existing.service_needed,
        status: status as "accepted" | "declined",
        message: clientMessage,
      });
    }
  } else if (action === "reply") {
    messageType = "reply";
    notification = {
      email: await sendInquiryEmail({
        inquiryId: id, email: existing.email, fullName: existing.full_name,
        service: existing.service_needed, kind: "reply", message: clientMessage,
      }),
      sms: "not-applicable",
    };
  }
  if (notification && messageType) {
    const copy = clientEmailCopy({
      inquiryId: id,
      fullName: existing.full_name,
      service: existing.service_needed,
      kind: messageType,
      message: clientMessage,
    });
    const { error: logError } = await getSupabase().rpc("dashboard_record_notification", {
      p_token: token, p_id: id, p_message_type: messageType,
      p_subject: copy.subject, p_body: copy.body, p_delivery_status: notification.email,
    });
    if (logError) console.error("Client notification log failed", logError);
  }
  revalidatePath("/dashboard/");
  revalidatePath(`/dashboard/inquiries/${id}/`);
  const destination = form.get("next") === "dashboard" ? "/dashboard/" : `/dashboard/inquiries/${id}/`;
  const redirectUrl = new URL(destination, request.url);
  if (skippedDuplicate) {
    redirectUrl.searchParams.set("action", "duplicate");
  } else if (notification) {
    redirectUrl.searchParams.set("email", notification.email);
    redirectUrl.searchParams.set("sms", notification.sms);
    redirectUrl.searchParams.set("action", messageType || "update");
  }
  return NextResponse.redirect(redirectUrl, 303);
}
