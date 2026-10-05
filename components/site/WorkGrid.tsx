import Link from "next/link";
import Picture from "@/components/ui/Picture";
import { layoutRoles, type TileRole } from "@/lib/workLayout";
import { mediaUrl } from "@/lib/supabase";
import type { Project } from "@/lib/types";
import HoverVideo from "./HoverVideo";

const SIZES: Record<TileRole, string> = {
  feature: "(min-width: 900px) 66vw, 100vw",
  stack: "(min-width: 900px) 33vw, 100vw",
  third: "(min-width: 900px) 33vw, 100vw",
  half: "(min-width: 900px) 50vw, 100vw",
  full: "100vw",
};

export function ProjectTile({ project, role, index = 0, priority = false }: { project: Project; role: TileRole; index?: number; priority?: boolean }) {
  const href = `/portfolio/${project.slug}/`;
  const category = project.category?.name || "Creative work";
  return <Link href={href} className={`tile tile--${role}`} data-tile data-cursor="View" data-r={index % 3} aria-label={`${project.title} — ${category}${project.year ? `, ${project.year}` : ""}`}>
    <span className="tile__media">
      {project.cover_image
        ? <Picture src={project.cover_image} alt="" fill sizes={SIZES[role]} priority={priority} className="tile__img" />
        : <span className="tile__blank">{category}</span>}
      {project.video_file && <HoverVideo src={mediaUrl(project.video_file)} poster={project.cover_image ? mediaUrl(project.cover_image, { width: 800 }) : undefined} />}
    </span>
    <span className="tile__caption">
      <span className="tile__title">{project.title}</span>
      <span className="tile__meta">{category}{project.year ? ` · ${project.year}` : ""}</span>
    </span>
  </Link>;
}

export default function WorkGrid({ projects, compact = false, priorityCount = 0 }: { projects: Project[]; compact?: boolean; priorityCount?: number }) {
  const roles = layoutRoles(projects.length, { compact });
  return <div className="work-grid">{projects.map((project, i) => <ProjectTile key={project.id} project={project} role={roles[i]} index={i} priority={i < priorityCount} />)}</div>;
}
