import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { extensionOf } from "@/lib/fileFormats";
import { getSupabase, getSupabaseAdmin, mediaUrl } from "@/lib/supabase";

const ALLOWED_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/webm": "webm",
  "model/gltf-binary": "glb", "model/gltf+json": "gltf",
};
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "mp4", "webm", "glb", "gltf"]);

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { contentType?: string; kind?: "image" | "video" | "model"; fileName?: string };
  // The browser-reported Content-Type is unreliable for less-common formats — many OS/browser
  // combinations report an empty type for .glb specifically (no registered file association),
  // which previously made a perfectly valid GLB upload fail with "unsupported file type" for
  // no real reason. Fall back to the actual filename extension whenever the MIME type is
  // missing or generic (octet-stream is what browsers report when they don't know the type).
  let extension = ALLOWED_BY_MIME[body.contentType || ""];
  if (!extension || body.contentType === "application/octet-stream") {
    const fromName = extensionOf(body.fileName || "");
    if (ALLOWED_EXTENSIONS.has(fromName)) extension = fromName === "jpeg" ? "jpg" : fromName;
  }
  if (!extension) return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WebP, MP4, WebM, GLB, or GLTF." }, { status: 400 });

  const path = `products/media/${body.kind || "file"}-${Date.now()}-${randomUUID()}.${extension}`;
  const { data, error } = await getSupabaseAdmin().storage.from("portfolio-media").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });

  const { data: publicUrlData } = getSupabase().storage.from("portfolio-media").getPublicUrl(path);
  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path, token: data.token, bucket: "portfolio-media", publicUrl: publicUrlData.publicUrl || mediaUrl(path) });
}
