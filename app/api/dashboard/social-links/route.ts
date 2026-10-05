import { NextRequest, NextResponse } from "next/server";
import { friendlyDbError, order, SESSION_EXPIRED, text } from "@/lib/adminCrud";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// Social links have no RPC; the service-role client is used here, behind the admin session check.
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id) || null;
  const admin = getSupabaseAdmin();

  if (body.action === "delete") {
    if (!id) return NextResponse.json({ error: "Nothing to delete." }, { status: 400 });
    const { error } = await admin.from("social_links").delete().eq("id", id);
    if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const label = text(body.label, 60);
  const url = text(body.url, 500);
  if (!label) return NextResponse.json({ error: "Give the link a name, for example Instagram." }, { status: 400 });
  if (!/^https:\/\//i.test(url)) return NextResponse.json({ error: "The link must start with https://" }, { status: 400 });
  const row = { label, url, icon_name: text(body.icon_name, 40).toLowerCase(), order: order(body.order), is_active: body.is_active !== false };
  const { data, error } = id
    ? await admin.from("social_links").update(row).eq("id", id).select("id").maybeSingle()
    : await admin.from("social_links").insert(row).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id });
}
