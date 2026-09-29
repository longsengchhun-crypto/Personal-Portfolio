import Link from "next/link";
import ShowreelPlayer from "@/components/ShowreelPlayer";
import { pageMetadata } from "@/lib/content";
import { getFeaturedVideoProject, getSiteContext } from "@/lib/data";
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
  const [{ site }, videoProject] = await Promise.all([
    getSiteContext(), getFeaturedVideoProject(),
  ]);

  const configuredEmbed = site?.youtube_url || site?.vimeo_url || "";
  const configuredLocal = site?.local_video_url || "";

  return <>
    <section className="page-hero compact"><div className="container narrow"><p className="eyebrow">Showreel</p><h1>{site?.showreel_title || "Selected motion, film, and visual work."}</h1><p>A short reel of recent editing, motion, and production work.</p></div></section>
    <section className="section pt-0"><div className="container showreel-stage">
      {configuredEmbed ? <ShowreelPlayer type="embed" src={toEmbedUrl(configuredEmbed)} label={site?.showreel_title || "Showreel"} />
        : configuredLocal ? <ShowreelPlayer type="local" src={configuredLocal} poster={mediaUrl(site?.showreel_thumbnail)} />
        : videoProject?.video_file ? <>
          <ShowreelPlayer type="local" src={mediaUrl(videoProject.video_file)} poster={mediaUrl(videoProject.cover_image)} />
          <p className="analytics-note" style={{ marginTop: 14 }}>Featured project: <Link className="text-link" href={`/portfolio/${videoProject.slug}/`}>{videoProject.title}</Link></p>
        </>
        : <div className="showreel-empty"><i className="bi bi-camera-reels" style={{ fontSize: "2rem" }} /><p style={{ marginTop: 12 }}>A new showreel is in production. In the meantime, browse the full portfolio.</p><Link className="btn btn-accent" href="/portfolio/" style={{ marginTop: 18 }}>View Selected Work</Link></div>}
    </div></section>
  </>;
}
