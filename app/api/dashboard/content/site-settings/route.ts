import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/dashboard/login/", request.url), 303);
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const form = await request.formData();
  const field = (name: string) => String(form.get(name) || "").trim();
  const { error } = await getSupabase().rpc("dashboard_update_site_settings", {
    p_token: token,
    p_professional_title: field("professional_title"),
    p_hero_intro: field("hero_intro"),
    p_khmer_intro: field("khmer_intro"),
    p_professional_intro: field("professional_intro"),
    p_email: field("email"),
    p_phone: field("phone"),
    p_location: field("location"),
    p_showreel_title: field("showreel_title"),
    p_youtube_url: field("youtube_url"),
    p_vimeo_url: field("vimeo_url"),
    p_local_video_url: field("local_video_url"),
  });
  const redirectUrl = new URL("/dashboard/content/", request.url);
  redirectUrl.searchParams.set("saved", error ? "error" : "site-settings");
  return NextResponse.redirect(redirectUrl, 303);
}
