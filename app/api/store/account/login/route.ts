import { NextRequest, NextResponse } from "next/server";
import { createCustomerSession } from "@/lib/customerAuth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/3d-store/account/");
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;

  const { data, error } = await getSupabase().rpc("verify_customer_login", { p_email: email, p_password: password, p_ip_address: ip });
  if (error) {
    const reason = error.message.includes("rate_limited") ? "rate" : "invalid";
    return NextResponse.redirect(new URL(`/3d-store/account/login/?error=${reason}&next=${encodeURIComponent(next)}`, request.url), 303);
  }
  if (!data) {
    return NextResponse.redirect(new URL(`/3d-store/account/login/?error=invalid&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  await createCustomerSession({ id: data.id, email: data.email, fullName: data.full_name });
  return NextResponse.redirect(new URL(next, request.url), 303);
}
