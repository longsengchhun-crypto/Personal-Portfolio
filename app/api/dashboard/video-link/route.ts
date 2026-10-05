import { NextRequest, NextResponse } from "next/server";
import { friendlyDbError, SESSION_EXPIRED } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { resolveVideoLink } from "@/lib/videoLinks";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

export const maxDuration = 30;

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Resolve a pasted video link, and optionally create a project from it in one step ("import").
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { url?: string; create?: { category_id?: number; year?: number; publish?: boolean } };
  const resolved = await resolveVideoLink(String(body.url || ""));
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });
  if (!body.create) return NextResponse.json({ ok: true, ...resolved });

  const categoryId = Number(body.create.category_id);
  if (!categoryId) return NextResponse.json({ error: "Choose a category first." }, { status: 400 });
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin.from("projects").select("id, title").eq("embedded_video_url", resolved.canonicalUrl).limit(1).maybeSingle();
  if (existing) return NextResponse.json({ error: `Already imported as “${existing.title}”.`, duplicate: true, id: existing.id }, { status: 409 });

  const videoId = resolved.embedUrl.split("/").pop()!.split("?")[0];
  const title = resolved.title || `${resolved.provider === "tiktok" ? "Animation" : "Video"} ${videoId.slice(-4)}`;
  const { data, error } = await getSupabase().rpc("dashboard_upsert_project", {
    p_token: process.env.SUPABASE_DASHBOARD_TOKEN, p_id: null, p_category_id: categoryId, p_title: title,
    p_slug: `${slugify(title) || resolved.provider}-${videoId.slice(-6)}`, p_year: Number(body.create.year) || new Date().getFullYear(),
    p_short_description: "", p_project_type: "Animation", p_cover_image: resolved.thumbnailPath, p_cover_video_url: "", p_video_file: "",
    p_client: "", p_role: "", p_project_duration: "", p_software_used: "", p_introduction: "", p_objective: "", p_creative_approach: "",
    p_process: "", p_final_result: "", p_embedded_video_url: resolved.canonicalUrl, p_before_image: "", p_after_image: "", p_credits: "",
    p_is_featured: false, p_status: body.create.publish ? "published" : "draft", p_order: 0,
  });
  if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, id: data, title, thumbnail: Boolean(resolved.thumbnailPath) });
}
