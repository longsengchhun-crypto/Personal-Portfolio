import { notFound } from "next/navigation";
import ProjectEditor from "@/components/admin/ProjectEditor";
import { requireAdmin } from "@/lib/auth";
import { getDashboardPortfolioContent, getDashboardPortfolioProject } from "@/lib/data";

export const metadata = { title: "Edit project" };
export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  await requireAdmin(`/dashboard/projects/${id}/`);
  if (!Number.isInteger(id)) notFound();
  const [project, { categories }] = await Promise.all([getDashboardPortfolioProject(id), getDashboardPortfolioContent()]);
  if (!project) notFound();
  return <ProjectEditor key={project.id} project={project} categories={categories} />;
}
