import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase, getSupabaseAdmin, mediaUrl } from "@/lib/supabase";

const ALLOWED_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { contentType?: string };
  const extension = ALLOWED_TYPES[body.contentType || ""];
  if (!extension) return NextResponse.json({ error: "Unsupported video type. Use MP4, WebM, or MOV." }, { status: 400 });

  const path = `site/showreel-${Date.now()}.${extension}`;
  const { data, error } = await getSupabaseAdmin().storage.from("portfolio-media").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });

  const { data: publicUrlData } = getSupabase().storage.from("portfolio-media").getPublicUrl(path);
  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path, publicUrl: publicUrlData.publicUrl || mediaUrl(path) });
}
