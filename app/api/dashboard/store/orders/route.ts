import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getDashboardStoreOrder } from "@/lib/data";
import { sendOrderCustomerEmail } from "@/lib/notifications";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/dashboard/login/", request.url), 303);
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const form = await request.formData();
  const id = Number(form.get("id"));
  const decision = String(form.get("decision") || "");
  const adminNotes = String(form.get("admin_notes") || "").trim().slice(0, 500);

  if (!Number.isInteger(id) || (decision !== "approve" && decision !== "reject")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const order = await getDashboardStoreOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const supabase = getSupabase();
  const { error } = await supabase.rpc("dashboard_review_order", { p_token: token, p_id: id, p_decision: decision, p_admin_notes: adminNotes });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orderUrl = new URL(`/3d-store/orders/${order.access_token}/`, request.url).toString();
  const emailKind = decision === "approve" ? "approved" : "rejected";
  const notification = await sendOrderCustomerEmail({
    orderId: id, customerEmail: order.customer_email, kind: emailKind,
    orderNumber: order.order_number, customerName: order.customer_name, productTitle: order.product.title,
    orderUrl, adminNotes,
  });
  await supabase.rpc("dashboard_record_order_message", { p_token: token, p_id: id, p_message_type: emailKind, p_subject: notification.subject, p_body: notification.body, p_delivery_status: notification.status });

  const redirectUrl = new URL(`/dashboard/store/orders/${id}/`, request.url);
  redirectUrl.searchParams.set("email", notification.status);
  redirectUrl.searchParams.set("action", emailKind);
  return NextResponse.redirect(redirectUrl, 303);
}
