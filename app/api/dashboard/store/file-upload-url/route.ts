import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { extensionOf, isSupportedProductFile, PRODUCT_FILE_EXTENSIONS } from "@/lib/fileFormats";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { fileName?: string };
  // fileName may be a folder-relative path (e.g. "Modern-Interior/textures/wall.jpg") from a
  // folder upload — validate the actual extension, not the path.
  const fileName = (body.fileName || "").trim();
  if (!fileName || !isSupportedProductFile(fileName)) {
    return NextResponse.json({ error: `Unsupported file type ".${extensionOf(fileName)}". Allowed: ${PRODUCT_FILE_EXTENSIONS.join(", ")}.` }, { status: 400 });
  }

  // Storage path only needs to be unique and safe — it's never shown to anyone. The
  // human-readable relative path (with real folder separators) is preserved separately as
  // this row's `fileName`/`file_name`, which is what the customer actually sees and downloads as.
  const baseName = fileName.split("/").pop() || fileName;
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `files/${Date.now()}-${randomUUID()}-${safeName}`;
  const { data, error } = await getSupabaseAdmin().storage.from("product-downloads").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path, fileName });
}
