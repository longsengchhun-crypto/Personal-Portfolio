import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { extensionOf } from "@/lib/fileFormats";
import { getSupabase, getSupabaseAdmin, mediaUrl } from "@/lib/supabase";

const ALLOWED_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/webm": "webm",
};
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "mp4", "webm"]);

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { contentType?: string; kind?: "image" | "video"; fileName?: string };
  // Same fallback as the store's media-upload-url route — some browser/OS combinations report
  // an empty or generic content type for less-common formats.
  let extension = ALLOWED_BY_MIME[body.contentType || ""];
  if (!extension || body.contentType === "application/octet-stream") {
    const fromName = extensionOf(body.fileName || "");
    if (ALLOWED_EXTENSIONS.has(fromName)) extension = fromName === "jpeg" ? "jpg" : fromName;
  }
  if (!extension) return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WebP, MP4, or WebM." }, { status: 400 });

  const path = `projects/media/${body.kind || "file"}-${Date.now()}-${randomUUID()}.${extension}`;
  const { data, error } = await getSupabaseAdmin().storage.from("portfolio-media").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });

  const { data: publicUrlData } = getSupabase().storage.from("portfolio-media").getPublicUrl(path);
  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path, token: data.token, bucket: "portfolio-media", publicUrl: publicUrlData.publicUrl || mediaUrl(path) });
}
