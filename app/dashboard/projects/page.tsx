import { Suspense } from "react";
import PageHeader from "@/components/admin/PageHeader";
import ProjectsBrowser from "@/components/admin/ProjectsBrowser";
import { LinkButton } from "@/components/ui/Button";
import { Plus } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { getDashboardPortfolioContent } from "@/lib/data";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requireAdmin("/dashboard/projects/");
  const { categories, projects } = await getDashboardPortfolioContent();
  return <>
    <PageHeader title="Projects" description="Everything in your portfolio: what's live, what's still a draft, and what's featured." actions={<LinkButton href="/dashboard/projects/new/" variant="primary"><Plus /> New project</LinkButton>} />
    <Suspense fallback={null}><ProjectsBrowser projects={projects} categories={categories} /></Suspense>
  </>;
}
