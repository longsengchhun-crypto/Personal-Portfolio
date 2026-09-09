import { getSupabase } from "@/lib/supabase";
import type { Category, CustomerInquiryView, CustomerOrderView, DashboardContent, DashboardSnapshot, DashboardStoreContent, DashboardStoreOrder, DashboardStoreProduct, Inquiry, Order, OrderStatusView, Product, ProductCategory, ProductMedia, Project, Service, SiteSetting, SkillGroup, SocialLink } from "@/lib/types";

const projectSelect = "*, category:categories(*)";
// Card/list views only render these fields — the long-form case-study text (introduction,
// objective, creative_approach, process, final_result, credits, etc.) only matters on the
// single-project detail page, so list queries skip it to avoid shipping unused payload.
const projectCardSelect = "id, slug, title, year, short_description, project_type, cover_image, video_file, is_featured, category:categories(*)";

function dashboardToken() {
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  if (!token) throw new Error("Dashboard token is not configured.");
  return token;
}

export async function getSiteContext() {
  const supabase = getSupabase();
  const [{ data: site }, { data: social }] = await Promise.all([
    supabase.from("site_settings").select("*").order("id").limit(1).maybeSingle(),
    supabase.from("social_links").select("*").eq("is_active", true).order("order").order("label"),
  ]);
  return { site: site as SiteSetting | null, social: (social ?? []) as SocialLink[] };
}

export async function getFeaturedProjects() {
  const { data, error } = await getSupabase().from("projects").select(projectCardSelect).eq("status", "published").eq("is_featured", true).order("order").order("year", { ascending: false }).limit(8);
  if (error) throw error;
  return data as unknown as Project[];
}

export async function getFeaturedVideoProject() {
  const { data } = await getSupabase().from("projects").select(projectCardSelect).eq("status", "published").eq("categories.slug", "video-and-3d-modeling").neq("video_file", "").order("order").limit(1).maybeSingle();
  return data as unknown as Project | null;
}

export async function getPortfolio(filters: { category?: string; type?: string; year?: string; search?: string; page?: number }) {
  const supabase = getSupabase();
  const page = Math.max(1, filters.page || 1);
  const pageSize = 60;
  const from = (page - 1) * pageSize;
  let query = supabase.from("projects").select(projectCardSelect, { count: "exact" }).eq("status", "published").order("order").order("year", { ascending: false });
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
  // related/previous/next are all independent of each other once `project` is known, so they
  // run as one round-trip instead of three sequential ones.
  const [{ data: related }, { data: previous }, { data: next }] = await Promise.all([
    supabase.from("projects").select(projectCardSelect).eq("status", "published").eq("category_id", project.category_id).neq("id", project.id).order("order").limit(3),
    supabase.from("projects").select(projectCardSelect).eq("status", "published").lt("order", project.order).order("order", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("projects").select(projectCardSelect).eq("status", "published").gt("order", project.order).order("order").limit(1).maybeSingle(),
  ]);
  return { project, related: (related ?? []) as unknown as Project[], previous: previous as unknown as Project | null, next: next as unknown as Project | null };
}

export async function getDashboardSnapshot() {
  const { data, error } = await getSupabase().rpc("dashboard_snapshot", { p_token: dashboardToken() });
  if (error) throw error;
  return data as DashboardSnapshot;
}

export async function getDashboardInquiry(id: number) {
  const { data, error } = await getSupabase().rpc("dashboard_inquiry", { p_token: dashboardToken(), p_id: id });
  if (error) throw error;
  return data as Inquiry | null;
}

export async function getServices() {
  const { data, error } = await getSupabase().from("services").select("*").eq("is_active", true).order("order");
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function getSkillGroups() {
  const [{ data: groups, error: groupsError }, { data: skills, error: skillsError }] = await Promise.all([
    getSupabase().from("skill_groups").select("*").order("order"),
    getSupabase().from("skills").select("*").order("order"),
  ]);
  if (groupsError) throw groupsError;
  if (skillsError) throw skillsError;
  return ((groups ?? []) as SkillGroup[]).map((group) => ({
    ...group,
    skills: (skills ?? []).filter((skill) => skill.group_id === group.id),
  }));
}

export async function getSoftwareTools() {
  const { data, error } = await getSupabase().from("software_tools").select("*").order("order");
  if (error) throw error;
  return data ?? [];
}

export async function getDashboardContent() {
  const { data, error } = await getSupabase().rpc("dashboard_content", { p_token: dashboardToken() });
  if (error) throw error;
  return data as DashboardContent;
}

const productSelect = "*, category:product_categories(*)";
// Store cards don't render license/requirements/notes/compatibility/polygon_count/etc. —
// those only matter on the single-product detail page.
const productCardSelect = "id, slug, title, short_description, price_usd, price_khr, cover_image, file_formats, is_featured, category:product_categories(*)";

export async function getStoreCategories() {
  const { data, error } = await getSupabase().from("product_categories").select("*").order("order");
  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

export async function getStoreProducts(filters: { category?: string; search?: string; sort?: string }) {
  const supabase = getSupabase();
  let query = supabase.from("products").select(productCardSelect).eq("status", "published");
  if (filters.category) query = query.eq("category.slug", filters.category);
  if (filters.search) {
    const search = filters.search.replace(/[%(),]/g, "");
    query = query.or(`title.ilike.%${search}%,short_description.ilike.%${search}%,tags.ilike.%${search}%`);
  }
  switch (filters.sort) {
    case "oldest": query = query.order("created_at", { ascending: true }); break;
    case "price-low": query = query.order("price_usd", { ascending: true }); break;
    case "price-high": query = query.order("price_usd", { ascending: false }); break;
    case "featured": query = query.order("is_featured", { ascending: false }).order("order"); break;
    default: query = query.order("created_at", { ascending: false });
  }
  const [{ data, error }, categories] = await Promise.all([query, getStoreCategories()]);
  if (error) throw error;
  return { products: (data ?? []) as unknown as Product[], categories };
}

export async function getStoreProduct(slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("products").select(`${productSelect}, media:product_media(*)`).eq("slug", slug).eq("status", "published").order("order", { referencedTable: "product_media" }).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const product = data as unknown as Product & { media: ProductMedia[] };
  const { data: related } = await supabase.from("products").select(productCardSelect).eq("status", "published").eq("category_id", product.category_id).neq("id", product.id).limit(3);
  return { product, related: (related ?? []) as unknown as Product[] };
}

export async function getFeaturedProducts() {
  const { data, error } = await getSupabase().from("products").select(productSelect).eq("status", "published").eq("is_featured", true).order("order").limit(8);
  if (error) throw error;
  return data as unknown as Product[];
}

export async function getDashboardStoreContent() {
  const { data, error } = await getSupabase().rpc("dashboard_store_content", { p_token: dashboardToken() });
  if (error) throw error;
  return data as DashboardStoreContent;
}

export async function getDashboardStoreProduct(id: number) {
  const { data, error } = await getSupabase().rpc("dashboard_store_product", { p_token: dashboardToken(), p_id: id });
  if (error) throw error;
  return data as DashboardStoreProduct | null;
}

export async function getDashboardStoreOrders() {
  const { data, error } = await getSupabase().rpc("dashboard_store_orders", { p_token: dashboardToken() });
  if (error) throw error;
  return data as Order[];
}

export async function getDashboardStoreOrder(id: number) {
  const { data, error } = await getSupabase().rpc("dashboard_store_order", { p_token: dashboardToken(), p_id: id });
  if (error) throw error;
  return data as DashboardStoreOrder | null;
}

export async function getOrderByToken(accessToken: string) {
  const { data, error } = await getSupabase().rpc("get_order_by_token", { p_access_token: accessToken });
  if (error) throw error;
  return data as OrderStatusView | null;
}

export async function getCustomerOrders(customerId: number) {
  const { data, error } = await getSupabase().rpc("get_customer_orders", { p_customer_id: customerId });
  if (error) throw error;
  return (data ?? []) as CustomerOrderView[];
}

export async function getCustomerInquiries(customerId: number) {
  const { data, error } = await getSupabase().rpc("get_customer_inquiries", { p_customer_id: customerId });
  if (error) throw error;
  return (data ?? []) as CustomerInquiryView[];
}
