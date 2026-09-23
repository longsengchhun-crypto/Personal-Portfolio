import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const body = await request.json().catch(() => ({}));
  const supabase = getSupabase();

  if (body.action === "delete") {
    const { error } = await supabase.rpc("dashboard_delete_project", { p_token: token, p_id: body.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const { data, error } = await supabase.rpc("dashboard_upsert_project", {
    p_token: token,
    p_id: body.id || null,
    p_category_id: body.category_id || null,
    p_title: title,
    p_slug: slug,
    p_year: Number(body.year) || new Date().getFullYear(),
    p_short_description: body.short_description || "",
    p_project_type: body.project_type || "",
    p_cover_image: body.cover_image || "",
    p_cover_video_url: body.cover_video_url || "",
    p_video_file: body.video_file || "",
    p_client: body.client || "",
    p_role: body.role || "",
    p_project_duration: body.project_duration || "",
    p_software_used: body.software_used || "",
    p_introduction: body.introduction || "",
    p_objective: body.objective || "",
    p_creative_approach: body.creative_approach || "",
    p_process: body.process || "",
    p_final_result: body.final_result || "",
    p_embedded_video_url: body.embedded_video_url || "",
    p_before_image: body.before_image || "",
    p_after_image: body.after_image || "",
    p_credits: body.credits || "",
    p_is_featured: Boolean(body.is_featured),
    p_status: body.status === "published" ? "published" : "draft",
    p_order: Number(body.order) || 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data });
}
