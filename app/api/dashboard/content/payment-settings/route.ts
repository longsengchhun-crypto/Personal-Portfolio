import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/dashboard/login/", request.url), 303);
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const form = await request.formData();

  const { error } = await getSupabase().rpc("dashboard_update_payment_settings", {
    p_token: token,
    p_aba_qr_image: String(form.get("aba_qr_image") || ""),
    p_aba_account_info: String(form.get("aba_account_info") || ""),
  });

  const redirectUrl = new URL("/dashboard/content/", request.url);
  redirectUrl.searchParams.set("saved", error ? "error" : "payment-settings");
  return NextResponse.redirect(redirectUrl, 303);
}
