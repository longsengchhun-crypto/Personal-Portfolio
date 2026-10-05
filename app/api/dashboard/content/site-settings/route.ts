import { NextRequest, NextResponse } from "next/server";
import { friendlyDbError, SESSION_EXPIRED, text } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { error } = await getSupabase().rpc("dashboard_update_site_settings", {
    p_token: process.env.SUPABASE_DASHBOARD_TOKEN,
    p_professional_title: text(body.professional_title, 160),
    p_hero_intro: text(body.hero_intro, 2000),
    p_khmer_intro: text(body.khmer_intro, 2000),
    p_professional_intro: text(body.professional_intro, 8000),
    p_email: text(body.email, 254),
    p_phone: text(body.phone, 80),
    p_location: text(body.location, 160),
    p_showreel_title: text(body.showreel_title, 160),
    p_youtube_url: text(body.youtube_url, 500),
    p_vimeo_url: text(body.vimeo_url, 500),
    p_local_video_url: text(body.local_video_url, 1000),
  });
  if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
