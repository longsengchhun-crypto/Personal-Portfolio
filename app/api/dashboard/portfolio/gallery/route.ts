import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const body = await request.json().catch(() => ({}));
  const supabase = getSupabase();

  if (body.action === "delete") {
    const { error } = await supabase.rpc("dashboard_delete_project_gallery_item", { p_token: token, p_id: body.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await supabase.rpc("dashboard_add_project_gallery_item", {
    p_token: token,
    p_project_id: body.project_id,
    p_item_type: body.item_type === "video" ? "video" : "image",
    p_image: body.image || "",
    p_video_url: body.video_url || "",
    p_video_file: body.video_file || "",
    p_caption: body.caption || "",
    p_alt_text: body.alt_text || "",
    p_layout: ["landscape", "portrait", "full"].includes(body.layout) ? body.layout : "landscape",
    p_order: Number(body.order) || 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data });
}
