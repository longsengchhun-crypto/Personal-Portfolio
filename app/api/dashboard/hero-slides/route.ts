import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { HERO_MANIFEST_PATH } from "@/lib/heroSlides";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { slides?: unknown };
  if (!Array.isArray(body.slides) || body.slides.length > 12) return NextResponse.json({ error: "Provide up to 12 slides." }, { status: 400 });

  const slides = body.slides
    .filter((s): s is { id?: unknown; image: string; label?: unknown } => Boolean(s) && typeof (s as { image?: unknown }).image === "string" && (s as { image: string }).image.length > 0)
    .map((s) => ({ id: String(s.id || s.image).slice(0, 120), image: s.image.slice(0, 500), label: String(s.label || "").trim().slice(0, 80) }));

  const { error } = await getSupabaseAdmin().storage.from("portfolio-media").upload(
    HERO_MANIFEST_PATH, new Blob([JSON.stringify(slides)], { type: "application/json" }),
    { upsert: true, contentType: "application/json", cacheControl: "0" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
