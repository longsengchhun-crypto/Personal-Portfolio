import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const body = await request.json().catch(() => ({}));
  const supabase = getSupabase();

  if (body.action === "delete") {
    const { error } = await supabase.rpc("dashboard_delete_product_file", { p_token: token, p_id: body.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await supabase.rpc("dashboard_add_product_file", {
    p_token: token, p_product_id: body.product_id, p_file_name: body.file_name,
    p_file_path: body.file_path, p_file_size: body.file_size || null, p_order: Number(body.order) || 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data });
}
