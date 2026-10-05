import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { friendlyDbError, SESSION_EXPIRED } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { INQUIRY_STATUSES } from "@/lib/content";
import { getDashboardInquiry } from "@/lib/data";
import { clientEmailCopy, notifyInquiryClient, sendInquiryEmail, type NotificationDelivery } from "@/lib/notifications";
import { getSupabase } from "@/lib/supabase";

type Body = { action?: string; status?: string; client_message?: string; admin_notes?: string; is_reviewed?: boolean; confirm_resend?: boolean };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const id = Number((await params).id);
  const body = (await request.json().catch(() => ({}))) as Body;
  const action = String(body.action || "save");
  const clientMessage = String(body.client_message || "").trim().slice(0, 10_000);
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  if (!token || !Number.isInteger(id)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const existing = await getDashboardInquiry(id);
  if (!existing) return NextResponse.json({ error: "That message could not be found." }, { status: 404 });

  // Opening a new message marks it as read; it never touches anything else.
  if (action === "read") {
    if (existing.status !== "new") return NextResponse.json({ ok: true, status: existing.status });
    const { error } = await getSupabase().rpc("dashboard_update_inquiry", { p_token: token, p_id: id, p_status: "reviewing", p_admin_notes: existing.admin_notes, p_is_reviewed: true });
    if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
    revalidatePath("/dashboard/", "layout");
    return NextResponse.json({ ok: true, status: "reviewing" });
  }

  if (action === "reply" && !clientMessage) return NextResponse.json({ error: "Write a message to the client before sending a reply." }, { status: 400 });

  const requested = String(body.status || existing.status);
  const status = action === "accept" ? "accepted" : action === "reject" ? "declined" : action === "reply" ? "replied" : INQUIRY_STATUSES.includes(requested as never) ? requested : existing.status;
  const { error } = await getSupabase().rpc("dashboard_update_inquiry", { p_token: token, p_id: id, p_status: status, p_admin_notes: String(body.admin_notes ?? existing.admin_notes), p_is_reviewed: body.is_reviewed === true || status !== "new" });
  if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });

  let notification: NotificationDelivery | undefined;
  let messageType: "accepted" | "declined" | "reply" | undefined;
  let duplicate = false;

  if (action === "accept" || action === "reject") {
    // A decision email that already went out is not sent again by a double-click; a previous failure
    // or an explicit, confirmed resend still goes through.
    const alreadyNotified = existing.status === status && existing.last_notification_status === "sent";
    if (alreadyNotified && !body.confirm_resend) {
      duplicate = true;
    } else {
      messageType = status as "accepted" | "declined";
      notification = await notifyInquiryClient({
        inquiryId: id, email: existing.email, phoneOrTelegram: existing.phone_or_telegram, fullName: existing.full_name,
        service: existing.service_needed, status: status as "accepted" | "declined", message: clientMessage,
      });
    }
  } else if (action === "reply") {
    messageType = "reply";
    notification = {
      email: await sendInquiryEmail({ inquiryId: id, email: existing.email, fullName: existing.full_name, service: existing.service_needed, kind: "reply", message: clientMessage }),
      sms: "not-applicable",
    };
  }
  if (notification && messageType) {
    const copy = clientEmailCopy({ inquiryId: id, fullName: existing.full_name, service: existing.service_needed, kind: messageType, message: clientMessage });
    const { error: logError } = await getSupabase().rpc("dashboard_record_notification", {
      p_token: token, p_id: id, p_message_type: messageType, p_subject: copy.subject, p_body: copy.body, p_delivery_status: notification.email,
    });
    if (logError) console.error("Client notification log failed", logError);
  }
  revalidatePath("/dashboard/", "layout");
  return NextResponse.json({ ok: true, status, action: messageType || "update", duplicate, email: notification?.email, sms: notification?.sms });
}
