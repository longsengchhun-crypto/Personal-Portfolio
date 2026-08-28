import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_EXTENSIONS = new Set([
  "blend", "fbx", "obj", "glb", "gltf", "stl", "3ds", "dae", "abc", "max", "ma", "mb", "c4d", "zip", "rar", "mtl", "bin", "png", "jpg", "jpeg",
  "ztl", "zpr", "zbp", // ZBrush: ZTool, project, brush/palette
]);

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { fileName?: string };
  const fileName = (body.fileName || "").trim();
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  if (!fileName || !ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: `Unsupported file type ".${extension}". Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}.` }, { status: 400 });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `files/${Date.now()}-${randomUUID()}-${safeName}`;
  const { data, error } = await getSupabaseAdmin().storage.from("product-downloads").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path, fileName });
}
