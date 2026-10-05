import ProjectEditor from "@/components/admin/ProjectEditor";
import { requireAdmin } from "@/lib/auth";
import { getDashboardPortfolioContent } from "@/lib/data";

export const metadata = { title: "New project" };
export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireAdmin("/dashboard/projects/new/");
  const { categories } = await getDashboardPortfolioContent();
  return <ProjectEditor project={null} categories={categories} />;
}
