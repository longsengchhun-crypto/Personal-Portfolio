import Link from "next/link";
import ProjectEditor from "@/components/ProjectEditor";
import { requireAdmin } from "@/lib/auth";
import { getDashboardPortfolioContent } from "@/lib/data";

export const metadata = { title: "New Project" };

export default async function NewProjectPage() {
  await requireAdmin("/dashboard/portfolio/new/");
  const { categories } = await getDashboardPortfolioContent();

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">Portfolio</p><h1>New Project</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/portfolio/"><i className="bi bi-arrow-left" />Portfolio</Link></div></header>
    <ProjectEditor project={null} categories={categories} />
  </div></section>;
}
