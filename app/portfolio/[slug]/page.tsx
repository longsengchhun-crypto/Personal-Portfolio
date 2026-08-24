import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectCard from "@/components/ProjectCard";
import { getProject } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await getProject((await params).slug);
  return result ? { title: result.project.title, description: result.project.short_description } : { title: "Project not found" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getProject((await params).slug);
  if (!result) notFound();
  const { project, related, previous, next } = result;
  const sections = [["Introduction", project.introduction], ["Objective", project.objective], ["Creative Approach", project.creative_approach], ["Process", project.process], ["Final Result", project.final_result], ["Credits", project.credits]].filter(([, value]) => value);
  return <article>
    <section className="project-detail-hero"><div className="container"><div className="project-kicker"><span>{project.category?.name || "Creative Work"}</span><span>{project.year}</span>{project.project_type && <span>{project.project_type}</span>}</div><h1>{project.title}</h1><p>{project.short_description}</p>{project.video_file ? <div className="detail-video-frame"><video controls playsInline preload="metadata" poster={mediaUrl(project.cover_image)}><source src={mediaUrl(project.video_file)} type="video/mp4" /></video></div> : project.cover_image ? <img src={mediaUrl(project.cover_image)} alt={project.title} className={`detail-cover ${project.category?.slug === "poster-design" ? "poster-detail-cover" : ""}`} /> : project.cover_video_url ? <div className="video-embed"><iframe src={project.cover_video_url} title={project.title} loading="lazy" allowFullScreen /></div> : null}</div></section>
    <section className="section"><div className="container case-grid"><aside className="project-facts">{project.client && <div><span>Client</span><strong>{project.client}</strong></div>}{project.role && <div><span>Role</span><strong>{project.role}</strong></div>}{project.project_duration && <div><span>Duration</span><strong>{project.project_duration}</strong></div>}{project.software_used && <div><span>Software</span><strong>{project.software_used}</strong></div>}</aside><div className="case-copy">{sections.map(([title, value]) => <section key={title}><h2>{title}</h2><p>{value}</p></section>)}</div></div></section>
    {project.embedded_video_url && <section className="section pt-0"><div className="container"><div className="video-embed"><iframe src={project.embedded_video_url} title={`${project.title} video`} loading="lazy" allowFullScreen /></div></div></section>}
    {project.before_image && project.after_image && <section className="section pt-0"><div className="container before-after"><img src={mediaUrl(project.before_image)} alt="Before" /><img src={mediaUrl(project.after_image)} alt="After" /></div></section>}
    {!!project.gallery_items?.length && <section className="section pt-0"><div className="container gallery-grid">{project.gallery_items.map((item) => <figure className={`gallery-item ${item.layout}`} key={item.id}>{item.item_type === "video" ? item.video_file ? <video controls playsInline><source src={mediaUrl(item.video_file)} /></video> : <div className="video-embed"><iframe src={item.video_url} title={item.caption || project.title} loading="lazy" allowFullScreen /></div> : <a className="lightbox-link" href={mediaUrl(item.image)}><img src={mediaUrl(item.image)} alt={item.alt_text || item.caption || project.title} loading="lazy" /></a>}{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div></section>}
    <section className="section project-navigation"><div className="container"><div>{previous && <Link className="text-link" href={`/portfolio/${previous.slug}/`}>← {previous.title}</Link>}</div><Link className="text-link" href="/portfolio/">All Work</Link><div>{next && <Link className="text-link" href={`/portfolio/${next.slug}/`}>{next.title} →</Link>}</div></div></section>
    {!!related.length && <section className="section pt-0"><div className="container"><div className="section-heading"><div><p className="eyebrow">Related Work</p><h2>More from this discipline.</h2></div></div><div className="project-grid">{related.map((item) => <ProjectCard project={item} key={item.id} />)}</div></div></section>}
  </article>;
}
