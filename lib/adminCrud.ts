import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const SESSION_EXPIRED = "Your admin session has expired. Please sign in again.";

/** Turns raw Postgres errors into something an admin can act on. */
export function friendlyDbError(message: string) {
  if (/foreign key|violates/i.test(message)) return "This item is still in use elsewhere, so it can't be removed. Move or delete what depends on it first.";
  if (/duplicate key|already exists|unique/i.test(message)) return "Something with that name or URL already exists. Choose a different one.";
  if (/unauthorized/i.test(message)) return SESSION_EXPIRED;
  return message || "The change could not be saved. Please try again.";
}

type Body = Record<string, unknown>;

// Every small "list of rows" editor (services, skills, categories…) has the same shape: upsert a row
// or delete it by id. One handler keeps their validation and error messages consistent.
export function crudHandler({ upsert, remove, build }: { upsert: string; remove: string; build: (body: Body) => Body | string }) {
  return async function POST(request: NextRequest) {
    if (!(await isAdmin())) return NextResponse.json({ error: SESSION_EXPIRED }, { status: 401 });
    const token = process.env.SUPABASE_DASHBOARD_TOKEN;
    const body = (await request.json().catch(() => ({}))) as Body;
    const id = Number(body.id) || null;
    const supabase = getSupabase();

    if (body.action === "delete") {
      if (!id) return NextResponse.json({ error: "Nothing to delete." }, { status: 400 });
      const { error } = await supabase.rpc(remove, { p_token: token, p_id: id });
      if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 409 });
      return NextResponse.json({ ok: true });
    }

    const built = build(body);
    if (typeof built === "string") return NextResponse.json({ error: built }, { status: 400 });
    const { data, error } = await supabase.rpc(upsert, { p_token: token, p_id: id, ...built });
    if (error) return NextResponse.json({ error: friendlyDbError(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, id: data });
  };
}

export const text = (value: unknown, max = 500) => String(value ?? "").trim().slice(0, max);
export const order = (value: unknown) => Math.max(0, Math.floor(Number(value) || 0));
