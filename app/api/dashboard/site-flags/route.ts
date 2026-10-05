import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_EXPIRED } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { FLAGS_PATH, normalizeFlags } from "@/lib/siteFlags";
import { saveManifest } from "@/lib/manifest";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const flags = normalizeFlags(await request.json().catch(() => ({})));
  const error = await saveManifest(FLAGS_PATH, flags);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
