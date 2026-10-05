import { NextRequest, NextResponse } from "next/server";
import { SESSION_EXPIRED } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { getMediaUsage, isManagedMediaPath } from "@/lib/media";
import { getSupabaseAdmin } from "@/lib/supabase";

// Deletes one uploaded file, but only when nothing on the site still points at it.
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; path?: string };
  const path = String(body.path || "");
  if (body.action !== "delete" || !isManagedMediaPath(path)) return NextResponse.json({ error: "That file can't be removed from here." }, { status: 400 });
  const usage = await getMediaUsage();
  const users = usage.get(path);
  if (users?.length) return NextResponse.json({ error: `This file is used by ${users.map((user) => user.label).join(", ")}. Remove it there first.` }, { status: 409 });
  const { error } = await getSupabaseAdmin().storage.from("portfolio-media").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
