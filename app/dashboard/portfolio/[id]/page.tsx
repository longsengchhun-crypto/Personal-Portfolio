import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectEditor from "@/components/ProjectEditor";
import { requireAdmin } from "@/lib/auth";
import { getDashboardPortfolioContent, getDashboardPortfolioProject } from "@/lib/data";

export const metadata = { title: "Edit Project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  await requireAdmin(`/dashboard/portfolio/${id}/`);
  if (!Number.isInteger(id)) notFound();
  const [{ categories }, project] = await Promise.all([getDashboardPortfolioContent(), getDashboardPortfolioProject(id)]);
  if (!project) notFound();

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">Portfolio</p><h1>{project.title}</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/portfolio/"><i className="bi bi-arrow-left" />Portfolio</Link></div></header>
    <ProjectEditor project={project} categories={categories} />
  </div></section>;
}
