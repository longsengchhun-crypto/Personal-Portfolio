import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { publicUrl?: string };
  if (!body.publicUrl) return NextResponse.json({ error: "Missing video URL." }, { status: 400 });

  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const { error } = await getSupabase().rpc("dashboard_set_showreel_video", { p_token: token, p_local_video_url: body.publicUrl });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
