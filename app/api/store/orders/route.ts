import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/lib/customerAuth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const productId = Number(form.get("product_id"));
  const name = String(form.get("customer_name") || "").trim();
  const email = String(form.get("customer_email") || "").trim();
  const phone = String(form.get("customer_phone") || "").trim();
  const productSlug = String(form.get("product_slug") || "");

  if (!Number.isInteger(productId) || !name || !email) {
    return NextResponse.redirect(new URL(`/3d-store/${productSlug}/?error=form`, request.url), 303);
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const { data, error } = await getSupabase().rpc("submit_order", {
    p_product_id: productId, p_customer_name: name, p_customer_email: email, p_customer_phone: phone, p_ip_address: ip,
  });

  if (error) {
    const reason = error.message.includes("rate_limited") ? "rate" : "form";
    return NextResponse.redirect(new URL(`/3d-store/${productSlug}/?error=${reason}`, request.url), 303);
  }

  const customer = await getCustomer();
  if (customer) {
    await getSupabase().rpc("attach_order_customer", { p_access_token: data.access_token, p_customer_id: customer.id });
  }

  return NextResponse.redirect(new URL(`/3d-store/orders/${data.access_token}/`, request.url), 303);
}
