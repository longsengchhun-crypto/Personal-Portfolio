import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/dashboard/login/", request.url), 303);
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const form = await request.formData();
  const action = String(form.get("action") || "");
  const id = form.get("id") ? Number(form.get("id")) : null;
  const supabase = getSupabase();

  let error = null;
  if (action === "delete" && id) {
    ({ error } = await supabase.rpc("dashboard_delete_service", { p_token: token, p_id: id }));
  } else if (action === "save") {
    const title = String(form.get("title") || "").trim();
    if (!title) return NextResponse.redirect(new URL("/dashboard/content/?saved=error", request.url), 303);
    ({ error } = await supabase.rpc("dashboard_upsert_service", {
      p_token: token, p_id: id,
      p_title: title,
      p_description: String(form.get("description") || "").trim(),
      p_order: Number(form.get("order") || 0),
      p_is_active: form.get("is_active") === "on",
    }));
  }

  const redirectUrl = new URL("/dashboard/content/", request.url);
  redirectUrl.searchParams.set("saved", error ? "error" : "services");
  return NextResponse.redirect(redirectUrl, 303);
}
