import Link from "next/link";
import { mediaUrl } from "@/lib/supabase";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  const href = `/portfolio/${project.slug}/`;
  const category = project.category || { name: "Creative Work", slug: "uncategorized" };
  return <article className={`project-card reveal ${category.slug === "poster-design" ? "poster-card" : ""}`}>
    <Link href={href} className="project-media" aria-label={`View ${project.title}`}>
      {project.video_file ? <video muted loop playsInline preload="none" poster={mediaUrl(project.cover_image, { width: 640 })}><source src={mediaUrl(project.video_file)} type="video/mp4" /></video> : project.cover_image ? <img src={mediaUrl(project.cover_image, { width: 640 })} alt={project.title} loading="lazy" decoding="async" /> : <div className="project-placeholder"><span>{category.name}</span></div>}
    </Link>
    <div className="project-card-body">
      <div className="project-meta"><span>{category.name}</span><span>{project.year}</span></div>
      {(project.is_featured || project.video_file) && <div className="card-badge-row">
        {project.is_featured && <span className="card-badge card-badge-accent"><i className="bi bi-star-fill" />Featured</span>}
        {project.video_file && <span className="card-badge"><i className="bi bi-play-fill" />1080p Preview</span>}
      </div>}
      <h3><Link href={href}>{project.title}</Link></h3><p>{project.short_description}</p>{project.project_type && <span className="text-badge">{project.project_type}</span>}<Link className="text-link" href={href}>View Project</Link></div>
  </article>;
}
