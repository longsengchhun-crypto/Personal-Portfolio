import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import ShowreelPlayer from "@/components/ShowreelPlayer";
import { pageMetadata } from "@/lib/content";
import { getFeaturedProjects, getFeaturedVideoProject, getSiteContext, getSkillGroups } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase";

export const revalidate = 60;
export const metadata = pageMetadata("/showreel/", "Showreel", "Watch the LONG SENGCHHUN showreel — selected film, motion, editing, and 3D work.");

function toEmbedUrl(url: string) {
  const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export default async function ShowreelPage() {
  const [{ site }, videoProject, featured, skillGroups] = await Promise.all([
    getSiteContext(), getFeaturedVideoProject(), getFeaturedProjects(), getSkillGroups(),
  ]);

  const configuredEmbed = site?.youtube_url || site?.vimeo_url || "";
  const configuredLocal = site?.local_video_url || "";
  const roleTags = skillGroups.filter((group) => group.name === "Video Production" || group.name === "Filmmaking and Videography").flatMap((group) => group.skills);

  return <>
    <section className="page-hero compact"><div className="container narrow"><p className="eyebrow">Showreel</p><h1>{site?.showreel_title || "Selected motion, film, and visual work."}</h1><p>A short reel of recent editing, motion, and production work.</p></div></section>
    <section className="section pt-0"><div className="container narrow">
      {configuredEmbed ? <ShowreelPlayer type="embed" src={toEmbedUrl(configuredEmbed)} label={site?.showreel_title || "Showreel"} />
        : configuredLocal ? <ShowreelPlayer type="local" src={configuredLocal} poster={mediaUrl(site?.showreel_thumbnail)} />
        : videoProject?.video_file ? <>
          <ShowreelPlayer type="local" src={mediaUrl(videoProject.video_file)} poster={mediaUrl(videoProject.cover_image)} />
          <p className="analytics-note" style={{ marginTop: 14 }}>Featured project: <Link className="text-link" href={`/portfolio/${videoProject.slug}/`}>{videoProject.title}</Link></p>
        </>
        : <div className="showreel-empty"><i className="bi bi-camera-reels" style={{ fontSize: "2rem" }} /><p style={{ marginTop: 12 }}>A new showreel is in production. In the meantime, browse the full portfolio.</p><Link className="btn btn-accent" href="/portfolio/" style={{ marginTop: 18 }}>View Selected Work</Link></div>}

      {roleTags.length > 0 && <div className="showreel-roles"><p className="eyebrow">Capabilities shown</p><div className="tag-cloud">{roleTags.map((skill) => <span key={skill.id}>{skill.name}</span>)}</div></div>}
    </div></section>
    <section className="section"><div className="container"><div className="section-heading"><div><p className="eyebrow">Selected Work</p><h2>Recent projects across film, design, and 3D.</h2></div><Link className="text-link" href="/portfolio/">View all work</Link></div><div className="project-grid editorial-grid">{featured.length ? featured.map((project) => <ProjectCard project={project} key={project.id} />) : <div className="empty-state"><p>No featured projects yet.</p></div>}</div></div></section>
  </>;
}
