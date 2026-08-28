import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabase();
  const [{ data: projects }, { data: products }] = await Promise.all([
    supabase.from("projects").select("slug, updated_at").eq("status", "published"),
    supabase.from("products").select("slug, updated_at").eq("status", "published"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = ["", "showreel", "portfolio", "3d-store", "services", "about", "contact", "privacy"].map((path) => ({
    url: `${SITE_URL}/${path ? `${path}/` : ""}`,
    lastModified: new Date(),
  }));

  const projectRoutes: MetadataRoute.Sitemap = (projects ?? []).map((project) => ({
    url: `${SITE_URL}/portfolio/${project.slug}/`,
    lastModified: project.updated_at ? new Date(project.updated_at) : new Date(),
  }));

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
    url: `${SITE_URL}/3d-store/${product.slug}/`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
  }));

  return [...staticRoutes, ...projectRoutes, ...productRoutes];
}
