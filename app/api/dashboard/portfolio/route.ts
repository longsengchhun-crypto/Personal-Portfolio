import { NextRequest, NextResponse } from "next/server";
import { friendlyDbError, SESSION_EXPIRED } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { getDashboardPortfolioProject } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const body = await request.json().catch(() => ({}));
  const supabase = getSupabase();

  if (body.action === "delete") {
    const { error } = await supabase.rpc("dashboard_delete_project", { p_token: token, p_id: body.id });
    if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Duplicate = a new draft with the same content and gallery, so a variation can start from a finished project.
  if (body.action === "duplicate") {
    const source = await getDashboardPortfolioProject(Number(body.id)).catch(() => null);
    if (!source) return NextResponse.json({ error: "That project could not be found." }, { status: 404 });
    const suffix = Date.now().toString(36).slice(-4);
    const { data: newId, error } = await supabase.rpc("dashboard_upsert_project", {
      p_token: token, p_id: null, p_category_id: source.category_id, p_title: `${source.title} (copy)`, p_slug: `${source.slug}-copy-${suffix}`,
      p_year: source.year, p_short_description: source.short_description, p_project_type: source.project_type, p_cover_image: source.cover_image,
      p_cover_video_url: source.cover_video_url, p_video_file: source.video_file, p_client: source.client, p_role: source.role,
      p_project_duration: source.project_duration, p_software_used: source.software_used, p_introduction: source.introduction,
      p_objective: source.objective, p_creative_approach: source.creative_approach, p_process: source.process, p_final_result: source.final_result,
      p_embedded_video_url: source.embedded_video_url, p_before_image: source.before_image, p_after_image: source.after_image,
      p_credits: source.credits, p_is_featured: false, p_status: "draft", p_order: source.order,
    });
    if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
    for (const item of source.gallery_items) {
      await supabase.rpc("dashboard_add_project_gallery_item", {
        p_token: token, p_project_id: newId, p_item_type: item.item_type, p_image: item.image, p_video_url: item.video_url,
        p_video_file: item.video_file, p_caption: item.caption, p_alt_text: item.alt_text, p_layout: item.layout, p_order: item.order,
      });
    }
    return NextResponse.json({ ok: true, id: newId });
  }

  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Give the project a title before saving." }, { status: 400 });
  // category_id is NOT NULL on projects, so catch it here with a clear message rather than a raw constraint error.
  if (!body.category_id) return NextResponse.json({ error: "Choose a category. If the list is empty, add one from the Projects page first." }, { status: 400 });
  const slug = slugify(String(body.slug || "")) || slugify(title);

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
  if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
  return NextResponse.json({ id: data });
}
