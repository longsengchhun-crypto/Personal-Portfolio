import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const body = await request.json().catch(() => ({}));

  if (body.action === "delete") {
    const { error } = await getSupabase().rpc("dashboard_delete_product", { p_token: token, p_id: body.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data, error } = await getSupabase().rpc("dashboard_upsert_product", {
    p_token: token,
    p_id: body.id || null,
    p_category_id: body.category_id || null,
    p_title: title,
    p_slug: slug,
    p_short_description: body.short_description || "",
    p_description: body.description || "",
    p_price_usd: Number(body.price_usd) || 0,
    p_price_khr: Number(body.price_khr) || 0,
    p_tags: body.tags || "",
    p_software: body.software || "",
    p_file_formats: body.file_formats || "",
    p_polygon_count: body.polygon_count || "",
    p_texture_info: body.texture_info || "",
    p_dimensions: body.dimensions || "",
    p_file_size: body.file_size || "",
    p_version: body.version || "",
    p_license: body.license || "",
    p_compatibility: body.compatibility || "",
    p_requirements: body.requirements || "",
    p_notes: body.notes || "",
    p_cover_image: body.cover_image || "",
    p_preview_video: body.preview_video || "",
    p_viewer_model: body.viewer_model || "",
    p_is_featured: Boolean(body.is_featured),
    p_status: body.status === "published" ? "published" : "draft",
    p_order: Number(body.order) || 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data });
}
