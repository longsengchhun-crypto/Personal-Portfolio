import { getSupabaseAdmin } from "@/lib/supabase";

// Slides are managed from Dashboard → Hero Slides and stored as a small JSON manifest in the
// portfolio-media bucket (no database migration needed). `image` is a storage path or a full URL.
export type HeroSlide = { id: string; image: string; label: string };

export const HERO_MANIFEST_PATH = "site/hero-slides.json";

// Shown until the first slides are saved from the dashboard.
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  { id: "default-vfx", image: "/static/site-assets/hero/hero-vfx.jpg", label: "Visual Effects" },
  { id: "default-3d", image: "/static/site-assets/hero/hero-3d.jpg", label: "3D Design & Modeling" },
  { id: "default-production", image: "/static/site-assets/hero/hero-production.jpg", label: "Film & Media Production" },
];

/** Server-only. Returns the saved slides, or the defaults if none were ever saved. */
export async function getHeroSlides(): Promise<{ slides: HeroSlide[]; isDefault: boolean }> {
  try {
    const { data, error } = await getSupabaseAdmin().storage.from("portfolio-media").download(HERO_MANIFEST_PATH);
    if (error || !data) return { slides: DEFAULT_HERO_SLIDES, isDefault: true };
    const parsed = JSON.parse(await data.text());
    if (!Array.isArray(parsed)) return { slides: DEFAULT_HERO_SLIDES, isDefault: true };
    const slides = parsed
      .filter((s): s is HeroSlide => s && typeof s.image === "string" && s.image.length > 0)
      .map((s) => ({ id: String(s.id || s.image), image: s.image, label: String(s.label || "") }));
    return { slides, isDefault: false };
  } catch {
    return { slides: DEFAULT_HERO_SLIDES, isDefault: true };
  }
}
