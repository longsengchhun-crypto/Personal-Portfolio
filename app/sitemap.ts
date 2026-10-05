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

async function fetchPublished(): Promise<Row[]> {
  try {
    const { data, error } = await getSupabase().from("projects").select("slug, updated_at").eq("status", "published");
    if (error || !data) return [];
    return (data as Row[]).filter((row) => row.slug && /^[A-Za-z0-9._~-]+$/.test(row.slug));
  } catch {
    // A database hiccup must never turn the sitemap into an error response.
    return [];
  }
}

async function fetchCategories(): Promise<string[]> {
  try {
    const { data } = await getSupabase().from("categories").select("slug");
    return (data ?? []).map((row) => row.slug as string).filter((slug) => /^[a-z0-9-]+$/.test(slug));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, categories] = await Promise.all([fetchPublished(), fetchCategories()]);
  const newest = projects.map((project) => toDate(project.updated_at)).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0];

  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: "weekly", lastModified: newest },
    { url: `${SITE_URL}/portfolio/`, priority: 0.9, changeFrequency: "weekly", lastModified: newest },
    { url: `${SITE_URL}/showreel/`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/services/`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/about/`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact/`, priority: 0.6, changeFrequency: "yearly" },
    { url: `${SITE_URL}/privacy/`, priority: 0.2, changeFrequency: "yearly" },
  ];
  const categoryPages: MetadataRoute.Sitemap = categories.map((slug) => ({ url: `${SITE_URL}/portfolio/?category=${slug}`, priority: 0.8, changeFrequency: "weekly", lastModified: newest }));
  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({ url: `${SITE_URL}/portfolio/${project.slug}/`, priority: 0.7, changeFrequency: "monthly", lastModified: toDate(project.updated_at) }));

  const seen = new Set<string>();
  return [...pages, ...categoryPages, ...projectPages].filter((entry) => !seen.has(entry.url) && seen.add(entry.url));
}
