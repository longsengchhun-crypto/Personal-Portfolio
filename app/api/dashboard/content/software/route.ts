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
    ({ error } = await supabase.rpc("dashboard_delete_software", { p_token: token, p_id: id }));
  } else if (action === "save") {
    const name = String(form.get("name") || "").trim();
    if (!name) return NextResponse.redirect(new URL("/dashboard/content/?saved=error", request.url), 303);
    ({ error } = await supabase.rpc("dashboard_upsert_software", {
      p_token: token, p_id: id, p_name: name, p_order: Number(form.get("order") || 0),
    }));
  }

  const redirectUrl = new URL("/dashboard/content/", request.url);
  redirectUrl.searchParams.set("saved", error ? "error" : "software");
  return NextResponse.redirect(redirectUrl, 303);
}
