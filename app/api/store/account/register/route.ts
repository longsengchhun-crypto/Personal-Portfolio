import { NextRequest, NextResponse } from "next/server";
import { createCustomerSession } from "@/lib/customerAuth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const fullName = String(form.get("full_name") || "").trim();
  const next = String(form.get("next") || "/3d-store/account/");

  if (!email || !fullName || password.length < 8) {
    return NextResponse.redirect(new URL(`/3d-store/account/register/?error=form&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const { data, error } = await getSupabase().rpc("register_customer", { p_email: email, p_password: password, p_full_name: fullName });
  if (error) {
    const reason = error.message.includes("email_taken") ? "taken" : error.message.includes("weak_password") ? "weak" : "form";
    return NextResponse.redirect(new URL(`/3d-store/account/register/?error=${reason}&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  await createCustomerSession({ id: data.id, email: data.email, fullName: data.full_name });
  return NextResponse.redirect(new URL(next, request.url), 303);
}
