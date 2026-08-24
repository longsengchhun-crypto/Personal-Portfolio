import { getSupabase } from "@/lib/supabase";
import type { Category, DashboardSnapshot, Inquiry, Project, SiteSetting, SocialLink } from "@/lib/types";

const projectSelect = "*, category:categories(*)";

export async function getSiteContext() {
  const supabase = getSupabase();
  const [{ data: site }, { data: social }] = await Promise.all([
    supabase.from("site_settings").select("*").order("id").limit(1).maybeSingle(),
    supabase.from("social_links").select("*").eq("is_active", true).order("order").order("label"),
  ]);
  return { site: site as SiteSetting | null, social: (social ?? []) as SocialLink[] };
}

export async function getFeaturedProjects() {
  const { data, error } = await getSupabase().from("projects").select(projectSelect).eq("status", "published").eq("is_featured", true).order("order").order("year", { ascending: false }).limit(8);
  if (error) throw error;
  return data as unknown as Project[];
}

export async function getFeaturedVideoProject() {
  const { data } = await getSupabase().from("projects").select(projectSelect).eq("status", "published").eq("categories.slug", "video-and-3d-modeling").neq("video_file", "").order("order").limit(1).maybeSingle();
  return data as unknown as Project | null;
}

export async function getPortfolio(filters: { category?: string; type?: string; year?: string; search?: string; page?: number }) {
  const supabase = getSupabase();
  const page = Math.max(1, filters.page || 1);
  const pageSize = 60;
  const from = (page - 1) * pageSize;
  let query = supabase.from("projects").select(projectSelect, { count: "exact" }).eq("status", "published").order("order").order("year", { ascending: false });
  if (filters.category) query = query.eq("categories.slug", filters.category);
  if (filters.type) query = query.eq("project_type", filters.type);
  if (filters.year && /^\d{4}$/.test(filters.year)) query = query.eq("year", Number(filters.year));
  if (filters.search) {
    const search = filters.search.replace(/[%(),]/g, "");
    query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%,project_type.ilike.%${search}%`);
  }
  const [{ data, count, error }, { data: categories }, { data: years }, { data: types }] = await Promise.all([
    query.range(from, from + pageSize - 1),
    supabase.from("categories").select("*").order("order").order("name"),
    supabase.from("projects").select("year").eq("status", "published").order("year", { ascending: false }),
    supabase.from("projects").select("project_type").eq("status", "published").neq("project_type", "").order("project_type"),
  ]);
  if (error) throw error;
  return {
    projects: data as unknown as Project[], categories: (categories ?? []) as Category[],
    years: [...new Set((years ?? []).map((row) => row.year))], page,
    types: [...new Set((types ?? []).map((row) => row.project_type))],
    pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getProject(slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("projects").select(`${projectSelect}, gallery_items:project_gallery_items(*)`).eq("slug", slug).eq("status", "published").order("order", { referencedTable: "project_gallery_items" }).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const project = data as unknown as Project;
  const { data: related } = await supabase.from("projects").select(projectSelect).eq("status", "published").eq("category_id", project.category_id).neq("id", project.id).order("order").limit(3);
  const [{ data: previous }, { data: next }] = await Promise.all([
    supabase.from("projects").select(projectSelect).eq("status", "published").lt("order", project.order).order("order", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("projects").select(projectSelect).eq("status", "published").gt("order", project.order).order("order").limit(1).maybeSingle(),
  ]);
  return { project, related: (related ?? []) as unknown as Project[], previous: previous as unknown as Project | null, next: next as unknown as Project | null };
}

export async function getDashboardSnapshot() {
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  if (!token) throw new Error("Dashboard token is not configured.");
  const { data, error } = await getSupabase().rpc("dashboard_snapshot", { p_token: token });
  if (error) throw error;
  return data as DashboardSnapshot;
}

export async function getDashboardInquiry(id: number) {
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  if (!token) throw new Error("Dashboard token is not configured.");
  const { data, error } = await getSupabase().rpc("dashboard_inquiry", { p_token: token, p_id: id });
  if (error) throw error;
  return data as Inquiry | null;
}
