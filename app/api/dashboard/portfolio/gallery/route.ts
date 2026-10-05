import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

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

  if (body.action === "reorder") {
    const ids: unknown[] = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length || ids.some((id) => !Number.isInteger(id))) return NextResponse.json({ error: "Nothing to reorder." }, { status: 400 });
    const admin = getSupabaseAdmin();
    const results = await Promise.all(ids.map((id, index) => admin.from("project_gallery_items").update({ order: index }).eq("id", id as number)));
    const failed = results.find((result) => result.error);
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update") {
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "Missing gallery item." }, { status: 400 });
    const layout = ["landscape", "portrait", "full"].includes(body.layout) ? body.layout : "landscape";
    const { error } = await getSupabaseAdmin().from("project_gallery_items").update({
      caption: String(body.caption || "").slice(0, 300), alt_text: String(body.alt_text || "").slice(0, 300), layout, order: Number(body.order) || 0,
    }).eq("id", id);
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
