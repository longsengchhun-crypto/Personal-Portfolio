import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { sendOrderAdminNotification, sendOrderCustomerEmail } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const form = await request.formData();
  const reference = String(form.get("payment_reference") || "").trim();
  const screenshotPath = String(form.get("payment_screenshot") || "").trim();

  const supabase = getSupabase();
  const { data: order } = await supabase.rpc("get_order_by_token", { p_access_token: token });
  if (!order) return NextResponse.redirect(new URL("/3d-store/", request.url), 303);

  if (order.status === "pending_payment") {
    const { error } = await supabase.rpc("submit_order_payment", { p_access_token: token, p_payment_reference: reference, p_payment_screenshot: screenshotPath });
    if (!error) {
      const dashboardToken = process.env.SUPABASE_DASHBOARD_TOKEN;
      const orderUrl = new URL(`/3d-store/orders/${token}/`, request.url).toString();
      after(async () => {
        const [adminNotify, customerEmail] = await Promise.all([
          sendOrderAdminNotification({
            orderId: order.id, orderNumber: order.order_number, customerName: order.customer_name,
            customerEmail: order.customer_email, productTitle: order.product.title, priceUsd: order.price_usd,
            dashboardUrl: new URL(`/dashboard/store/orders/${order.id}/`, request.url).toString(),
          }),
          sendOrderCustomerEmail({
            orderId: order.id, customerEmail: order.customer_email, kind: "submitted",
            orderNumber: order.order_number, customerName: order.customer_name, productTitle: order.product.title, orderUrl,
          }),
        ]);
        if (dashboardToken) {
          await Promise.all([
            supabase.rpc("dashboard_record_order_message", { p_token: dashboardToken, p_id: order.id, p_message_type: "submitted", p_subject: adminNotify.subject, p_body: adminNotify.body, p_delivery_status: adminNotify.status }),
            supabase.rpc("dashboard_record_order_message", { p_token: dashboardToken, p_id: order.id, p_message_type: "submitted", p_subject: customerEmail.subject, p_body: customerEmail.body, p_delivery_status: customerEmail.status }),
          ]);
        }
      });
    }
  }

  return NextResponse.redirect(new URL(`/3d-store/orders/${token}/`, request.url), 303);
}
