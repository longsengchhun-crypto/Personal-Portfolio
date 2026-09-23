import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectCard from "@/components/ProjectCard";
import { OWNER, SITE_URL } from "@/lib/content";
import { getProject } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await getProject((await params).slug);
  if (!result) return { title: "Project not found" };
  const { project } = result;
  const canonical = `/portfolio/${project.slug}/`;
  const image = project.cover_image ? mediaUrl(project.cover_image, { width: 1200, quality: 80 }) : undefined;
  return {
    title: project.title,
    description: project.short_description,
    alternates: { canonical },
    openGraph: { title: project.title, description: project.short_description, url: canonical, type: "article", images: image ? [{ url: image }] : undefined },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getProject((await params).slug);
  if (!result) notFound();
  const { project, related, previous, next } = result;
  const sections = [["Introduction", project.introduction], ["Objective", project.objective], ["Creative Approach", project.creative_approach], ["Process", project.process], ["Final Result", project.final_result], ["Credits", project.credits]].filter(([, value]) => value);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.short_description,
    url: `${SITE_URL}/portfolio/${project.slug}/`,
    creator: { "@type": "Person", name: OWNER.name },
    dateCreated: String(project.year),
    ...(project.cover_image ? { image: mediaUrl(project.cover_image, { width: 1200, quality: 80 }) } : {}),
  };

  return <article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="project-detail-hero"><div className="container"><div className="project-kicker"><span>{project.category?.name || "Creative Work"}</span><span>{project.year}</span>{project.project_type && <span>{project.project_type}</span>}</div><h1>{project.title}</h1><p>{project.short_description}</p>{project.video_file ? <div className="detail-video-frame"><video controls playsInline preload="metadata" poster={mediaUrl(project.cover_image, { width: 1600, quality: 80 })}><source src={mediaUrl(project.video_file)} type="video/mp4" /></video></div> : project.cover_image ? <img src={mediaUrl(project.cover_image, { width: 1600, quality: 80 })} alt={project.title} className={`detail-cover ${project.category?.slug === "poster-design" ? "poster-detail-cover" : ""}`} /> : project.cover_video_url ? <div className="video-embed"><iframe src={project.cover_video_url} title={project.title} loading="lazy" allowFullScreen /></div> : null}</div></section>
    <section className="section"><div className="container case-grid"><aside className="project-facts">{project.client && <div><span>Client</span><strong>{project.client}</strong></div>}{project.role && <div><span>Roles</span><div className="tag-cloud">{project.role.split(",").map((role) => role.trim()).filter(Boolean).map((role) => <span key={role}>{role}</span>)}</div></div>}{project.project_duration && <div><span>Duration</span><strong>{project.project_duration}</strong></div>}{project.software_used && <div><span>Software</span><div className="tag-cloud">{project.software_used.split(",").map((tool) => tool.trim()).filter(Boolean).map((tool) => <span key={tool}>{tool}</span>)}</div></div>}</aside><div className="case-copy">{sections.map(([title, value]) => <section key={title}><h2>{title}</h2><p>{value}</p></section>)}</div></div></section>
    {project.embedded_video_url && <section className="section pt-0"><div className="container"><div className="video-embed"><iframe src={project.embedded_video_url} title={`${project.title} video`} loading="lazy" allowFullScreen /></div></div></section>}
    {project.before_image && project.after_image && <section className="section pt-0"><div className="container before-after"><img src={mediaUrl(project.before_image, { width: 1000, quality: 80 })} alt="Before" /><img src={mediaUrl(project.after_image, { width: 1000, quality: 80 })} alt="After" /></div></section>}
    {!!project.gallery_items?.length && <section className="section pt-0"><div className="container"><div className="section-heading"><div><p className="eyebrow">Production Gallery</p><h2>Stills and supporting footage.</h2></div></div><div className="gallery-grid">{project.gallery_items.map((item) => <figure className={`gallery-item ${item.layout}`} key={item.id}>{item.item_type === "video" ? item.video_file ? <video controls playsInline><source src={mediaUrl(item.video_file)} /></video> : <div className="video-embed"><iframe src={item.video_url} title={item.caption || project.title} loading="lazy" allowFullScreen /></div> : <a className="lightbox-link" href={mediaUrl(item.image)}><img src={mediaUrl(item.image, { width: 900, quality: 80 })} alt={item.alt_text || item.caption || project.title} loading="lazy" /></a>}{item.caption && <figcaption>{item.caption}</figcaption>}</figure>)}</div></div></section>}
    <section className="section project-navigation"><div className="container"><div>{previous && <Link className="text-link" href={`/portfolio/${previous.slug}/`}>← {previous.title}</Link>}</div><Link className="text-link" href="/portfolio/">All Work</Link><div>{next && <Link className="text-link" href={`/portfolio/${next.slug}/`}>{next.title} →</Link>}</div></div></section>
    {!!related.length && <section className="section pt-0"><div className="container"><div className="section-heading"><div><p className="eyebrow">Related Work</p><h2>More from this discipline.</h2></div></div><div className="project-grid">{related.map((item) => <ProjectCard project={item} key={item.id} />)}</div></div></section>}
  </article>;
}
