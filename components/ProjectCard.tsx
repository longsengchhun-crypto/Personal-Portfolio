import Link from "next/link";
import { mediaUrl } from "@/lib/supabase";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  const href = `/portfolio/${project.slug}/`;
  const category = project.category || { name: "Creative Work", slug: "uncategorized" };
  return <article className={`project-card reveal ${category.slug === "poster-design" ? "poster-card" : ""}`}>
    <Link href={href} className="project-media" aria-label={`View ${project.title}`}>
      {project.video_file ? <video muted loop playsInline preload="none" poster={mediaUrl(project.cover_image, { width: 640 })}><source src={mediaUrl(project.video_file)} type="video/mp4" /></video> : project.cover_image ? <img src={mediaUrl(project.cover_image, { width: 640 })} alt={project.title} loading="lazy" decoding="async" /> : <div className="project-placeholder"><span>{category.name}</span></div>}
      {project.is_featured && <span className="featured-pill">Featured</span>}
      {project.video_file && <span className="video-pill"><i className="bi bi-play-fill" /> 1080p Preview</span>}
      {project.project_type && <span className="poster-type">{project.project_type}</span>}
    </Link>
    <div className="project-card-body"><div className="project-meta"><span>{category.name}</span><span>{project.year}</span></div><h3><Link href={href}>{project.title}</Link></h3><p>{project.short_description}</p>{project.project_type && <span className="text-badge">{project.project_type}</span>}<Link className="text-link" href={href}>View Project</Link></div>
  </article>;
}
