import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase, getSupabaseAdmin, mediaUrl } from "@/lib/supabase";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/webm": "webm",
  "model/gltf-binary": "glb", "application/octet-stream": "glb",
};

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { contentType?: string; kind?: "image" | "video" | "model" };
  const extension = ALLOWED[body.contentType || ""];
  if (!extension) return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WebP, MP4, WebM, or GLB." }, { status: 400 });

  const path = `products/media/${body.kind || "file"}-${Date.now()}-${randomUUID()}.${extension}`;
  const { data, error } = await getSupabaseAdmin().storage.from("portfolio-media").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });

  const { data: publicUrlData } = getSupabase().storage.from("portfolio-media").getPublicUrl(path);
  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path, publicUrl: publicUrlData.publicUrl || mediaUrl(path) });
}
