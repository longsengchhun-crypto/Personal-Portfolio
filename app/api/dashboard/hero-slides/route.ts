import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { HERO_MANIFEST_PATH } from "@/lib/heroSlides";
import { saveManifest } from "@/lib/manifest";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { slides?: unknown };
  if (!Array.isArray(body.slides) || body.slides.length > 12) return NextResponse.json({ error: "Provide up to 12 slides." }, { status: 400 });

  const slides = body.slides
    .filter((s): s is { id?: unknown; image: string; label?: unknown } => Boolean(s) && typeof (s as { image?: unknown }).image === "string" && (s as { image: string }).image.length > 0)
    .map((s) => ({ id: String(s.id || s.image).slice(0, 120), image: s.image.slice(0, 500), label: String(s.label || "").trim().slice(0, 80) }));

  const error = await saveManifest(HERO_MANIFEST_PATH, slides);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
