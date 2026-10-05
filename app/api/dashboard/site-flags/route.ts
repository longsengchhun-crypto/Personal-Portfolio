import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_EXPIRED } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { FLAGS_PATH, normalizeFlags } from "@/lib/siteFlags";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const flags = normalizeFlags(await request.json().catch(() => ({})));
  const { error } = await getSupabaseAdmin().storage.from("portfolio-media").upload(FLAGS_PATH, new Blob([JSON.stringify(flags)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
