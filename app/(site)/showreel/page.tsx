import Link from "next/link";
import ShowreelPlayer from "@/components/site/ShowreelPlayer";
import { ArrowRight, Clapperboard } from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { pageMetadata } from "@/lib/content";
import { getFeaturedVideoProject, getSiteContext } from "@/lib/data";
import { toEmbedUrl } from "@/lib/embed";
import { mediaUrl } from "@/lib/supabase";

export const revalidate = 60;
export const metadata = pageMetadata("/showreel/", "Showreel", "Watch the LONG SENGCHHUN showreel: selected film, motion, editing and 3D work.");

export default async function ShowreelPage() {
  const [{ site }, videoProject] = await Promise.all([getSiteContext(), getFeaturedVideoProject()]);
  const embed = toEmbedUrl(site?.youtube_url || site?.vimeo_url || "");
  const local = site?.local_video_url || "";

  return <>
    <header className="page-head wrap">
      <p className="meta meta--accent">Showreel</p>
      <h1 className="display page-head__title">{site?.showreel_title || "Showreel"}</h1>
      <p className="lede">Recent editing, motion and production work in one cut.</p>
    </header>
    <section className="wrap section--tight" aria-label="Showreel">
      {embed ? <ShowreelPlayer type="embed" src={embed} label={site?.showreel_title || "Showreel"} />
        : local ? <ShowreelPlayer type="local" src={local} poster={mediaUrl(site?.showreel_thumbnail)} />
        : videoProject?.video_file ? <>
          <ShowreelPlayer type="local" src={mediaUrl(videoProject.video_file)} poster={mediaUrl(videoProject.cover_image, { width: 1600 })} />
          <p className="caption showreel__credit">Featured project: <Link className="link-arrow" href={`/portfolio/${videoProject.slug}/`}>{videoProject.title}</Link></p>
        </>
        : <EmptyState icon={<Clapperboard />} title="A new reel is in the edit" action={<Link className="btn btn--primary" href="/portfolio/">View selected work</Link>}>In the meantime, the full portfolio is a good place to start.</EmptyState>}
    </section>
    <section className="cta cta--compact"><div className="wrap cta__inner">
      <h2 className="title cta__title">Like what you see?</h2>
      <Link href="/portfolio/" className="btn btn--primary btn--lg">Browse the work <ArrowRight className="btn__arrow" /></Link>
    </div></section>
  </>;
}
