import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lightweight counts for the sidebar badges (unread messages, draft projects).
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = getSupabaseAdmin();
  const [unread, drafts] = await Promise.all([
    admin.from("project_inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("projects").select("id", { count: "exact", head: true }).eq("status", "draft"),
  ]);
  return NextResponse.json({ unread: unread.count ?? 0, drafts: drafts.count ?? 0 });
}
