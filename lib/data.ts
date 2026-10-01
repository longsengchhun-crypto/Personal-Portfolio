import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import type { Category, CustomerInquiryView, DashboardContent, DashboardPortfolioContent, DashboardPortfolioProject, DashboardSnapshot, Inquiry, Project, Service, SiteSetting, SkillGroup, SocialLink } from "@/lib/types";

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

export async function getDashboardPortfolioContent() {
  const { data, error } = await getSupabase().rpc("dashboard_portfolio_content", { p_token: dashboardToken() });
  if (error) throw error;
  return data as DashboardPortfolioContent;
}

export async function getDashboardPortfolioProject(id: number) {
  const { data, error } = await getSupabase().rpc("dashboard_portfolio_project", { p_token: dashboardToken(), p_id: id });
  if (error) throw error;
  return data as DashboardPortfolioProject | null;
}

// Customer data is read with the service-role client on the server, keyed by the id from the
// signed session cookie. The old public RPC took a bare customer id from anyone holding the
// (public) anon key, which let any visitor enumerate other clients' inquiries.
export async function getCustomerInquiries(customerId: number) {
  const { data, error } = await getSupabaseAdmin()
    .from("project_inquiries")
    .select("id, service_needed, project_description, estimated_budget, preferred_timeline, status, created_at, updated_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [] as CustomerInquiryView[];
  const { data: messages, error: messageError } = await getSupabaseAdmin()
    .from("inquiry_messages")
    .select("inquiry_id, message_type, subject, body, created_at")
    .in("inquiry_id", rows.map((row) => row.id))
    .in("message_type", ["reply", "accepted", "declined"])
    .order("created_at");
  if (messageError) throw messageError;
  return rows.map((row) => ({ ...row, messages: (messages ?? []).filter((message) => message.inquiry_id === row.id) })) as unknown as CustomerInquiryView[];
}

export type DashboardClient = { id: number; email: string; full_name: string; created_at: string; inquiry_count: number; last_inquiry_at: string | null; last_status: string | null };

export async function getDashboardClients(): Promise<DashboardClient[]> {
  const admin = getSupabaseAdmin();
  const [{ data: customers, error }, { data: inquiries, error: inquiryError }] = await Promise.all([
    admin.from("customers").select("id, email, full_name, created_at").order("created_at", { ascending: false }),
    admin.from("project_inquiries").select("customer_id, status, created_at").not("customer_id", "is", null).order("created_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (inquiryError) throw inquiryError;
  return (customers ?? []).map((customer) => {
    const mine = (inquiries ?? []).filter((inquiry) => inquiry.customer_id === customer.id);
    return { ...customer, inquiry_count: mine.length, last_inquiry_at: mine[0]?.created_at ?? null, last_status: mine[0]?.status ?? null };
  });
}
