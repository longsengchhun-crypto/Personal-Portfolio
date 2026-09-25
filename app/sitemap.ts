import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";
import { getSupabase } from "@/lib/supabase";

// Regenerate at most hourly so crawlers always get a fast, stable 200 response.
export const revalidate = 3600;

type Row = { slug: string; updated_at: string | null };

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function fetchPublished(table: "projects" | "products"): Promise<Row[]> {
  try {
    const { data, error } = await getSupabase().from(table).select("slug, updated_at").eq("status", "published");
    if (error || !data) return [];
    return (data as Row[]).filter((row) => row.slug && /^[A-Za-z0-9._~-]+$/.test(row.slug));
  } catch {
    // A database hiccup must never turn the sitemap into an error response.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products] = await Promise.all([fetchPublished("projects"), fetchPublished("products")]);

  const staticRoutes: MetadataRoute.Sitemap = ["", "showreel", "portfolio", "3d-store", "services", "about", "contact", "privacy"].map((path) => ({
    url: `${SITE_URL}/${path ? `${path}/` : ""}`,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/portfolio/${project.slug}/`,
    lastModified: toDate(project.updated_at),
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/3d-store/${product.slug}/`,
    lastModified: toDate(product.updated_at),
  }));

  const seen = new Set<string>();
  return [...staticRoutes, ...projectRoutes, ...productRoutes].filter((entry) => !seen.has(entry.url) && seen.add(entry.url));
}
