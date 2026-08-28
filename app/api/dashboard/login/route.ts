import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, validAdminCredentials } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = String(form.get("next") || "");
  const safeNext = next.startsWith("/dashboard/") ? next : "";
  const nextParam = safeNext ? `&next=${encodeURIComponent(safeNext)}` : "";

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const { error: rateLimitError } = await getSupabase().rpc("check_login_rate_limit", { p_ip: ip });
  if (rateLimitError) return NextResponse.redirect(new URL(`/dashboard/login/?error=rate${nextParam}`, request.url), 303);

  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");
  if (!validAdminCredentials(username, password)) return NextResponse.redirect(new URL(`/dashboard/login/?error=1${nextParam}`, request.url), 303);
  await createAdminSession();
  return NextResponse.redirect(new URL(safeNext || "/dashboard/", request.url), 303);
}
