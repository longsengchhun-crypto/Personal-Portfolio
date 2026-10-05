import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BeforeAfter from "@/components/site/BeforeAfter";
import Gallery, { type GalleryEntry } from "@/components/site/Gallery";
import ProjectHero from "@/components/site/ProjectHero";
import { ProjectTile } from "@/components/site/WorkGrid";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@/components/ui/Icon";
import { DEFAULT_OG_IMAGE, OWNER, SITE_URL } from "@/lib/content";
import { getProject } from "@/lib/data";
import { parseVideoLink } from "@/lib/embed";
import { getSupabase, mediaUrl } from "@/lib/supabase";
import { toJsonLd } from "@/lib/jsonLd";

export const revalidate = 60;

// Published projects are built ahead of time and refreshed every minute, so pages are served from the
// edge instead of being rendered per visit. A project published later is built the first time it is opened.
export async function generateStaticParams() {
  try {
    const { data } = await getSupabase().from("projects").select("slug").eq("status", "published");
    return (data ?? []).map((row) => ({ slug: row.slug as string }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await getProject((await params).slug);
  if (!result) return { title: "Project not found", robots: { index: false } };
  const { project } = result;
  const canonical = `/portfolio/${project.slug}/`;
  const image = project.cover_image ? mediaUrl(project.cover_image, { width: 1200, quality: 80 }) : DEFAULT_OG_IMAGE;
  const description = project.short_description || `${project.title}, ${project.category?.name || "creative work"} by ${OWNER.name}.`;
  return {
    title: project.title,
    description,
    alternates: { canonical },
    openGraph: { title: `${project.title} | ${OWNER.name}`, description, url: canonical, type: "article", images: [{ url: image, alt: project.title }] },
    twitter: { card: "summary_large_image", title: project.title, description, images: [image] },
  };
}

const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getProject((await params).slug);
  if (!result) notFound();
  const { project, related, previous, next } = result;

  const story = ([["Introduction", project.introduction], ["Objective", project.objective], ["Creative approach", project.creative_approach], ["Process", project.process], ["Final result", project.final_result]] as const).filter(([, value]) => value);
  const facts = ([["Client", project.client], ["Role", project.role], ["Duration", project.project_duration], ["Software", project.software_used], ["Type", project.project_type]] as const).filter(([, value]) => value);
  const mainLink = parseVideoLink(project.embedded_video_url || project.cover_video_url || "");
  const embed = mainLink?.embedUrl ?? "";
  const gallery: GalleryEntry[] = (project.gallery_items ?? []).flatMap((item): GalleryEntry[] => {
    const alt = item.alt_text || item.caption || `${project.title} still ${item.order + 1}`;
    if (item.item_type === "video") {
      if (item.video_file) return [{ id: item.id, kind: "video", src: mediaUrl(item.video_file), alt, caption: item.caption, layout: "full" }];
      const itemLink = parseVideoLink(item.video_url);
      return itemLink ? [{ id: item.id, kind: "embed", src: itemLink.embedUrl, alt, caption: item.caption, layout: "full", vertical: itemLink.vertical }] : [];
    }
    return item.image ? [{ id: item.id, kind: "image", src: item.image, alt, caption: item.caption, layout: item.layout }] : [];
  });

  const url = `${SITE_URL}/portfolio/${project.slug}/`;
  const cover = project.cover_image ? mediaUrl(project.cover_image, { width: 1600, quality: 80 }) : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": project.video_file || embed ? "VideoObject" : "CreativeWork", "@id": `${url}#work`,
        name: project.title, description: project.short_description || project.title, url,
        author: { "@id": `${SITE_URL}/#person` }, creator: { "@id": `${SITE_URL}/#person` },
        dateCreated: String(project.year), datePublished: `${project.year}-01-01`,
        genre: project.category?.name, keywords: [project.project_type, project.category?.name, ...splitList(project.software_used)].filter(Boolean).join(", "),
        ...(cover ? { image: cover, thumbnailUrl: cover } : {}),
        ...(project.video_file ? { contentUrl: mediaUrl(project.video_file), uploadDate: `${project.year}-01-01` } : embed ? { embedUrl: embed, uploadDate: `${project.year}-01-01` } : {}),
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Work", item: `${SITE_URL}/portfolio/` },
          { "@type": "ListItem", position: 3, name: project.title, item: url },
        ],
      },
    ],
  };

  return <article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
    <ProjectHero title={project.title} cover={project.cover_image} videoSrc={project.video_file ? mediaUrl(project.video_file) : undefined} embedSrc={!project.video_file && embed ? embed : undefined} vertical={!project.video_file && Boolean(mainLink?.vertical)} sourceUrl={!project.video_file && /^https:\/\//.test(project.embedded_video_url) ? project.embedded_video_url : undefined} sourceLabel={mainLink?.provider === "tiktok" ? "TikTok" : mainLink?.provider === "youtube" ? "YouTube" : mainLink?.provider === "vimeo" ? "Vimeo" : undefined} />

    <header className="wrap pdetail">
      <nav aria-label="Breadcrumb" className="pdetail__crumbs"><Link href="/portfolio/" className="link-arrow"><ArrowLeft /> All work</Link>
        {!project.video_file && mainLink && /^https:\/\//.test(project.embedded_video_url) && <a className="btn btn--glass btn--sm" href={project.embedded_video_url} target="_blank" rel="noopener noreferrer">Watch on {mainLink.provider === "tiktok" ? "TikTok" : mainLink.provider === "youtube" ? "YouTube" : mainLink.provider === "vimeo" ? "Vimeo" : "the original site"} <ArrowUpRight /></a>}</nav>
      <p className="meta meta--accent">{[project.category?.name, project.year].filter(Boolean).join(" · ")}</p>
      <div className="pdetail__top">
        <h1 className="title pdetail__title">{project.title}</h1>
        {project.short_description && <p className="lede">{project.short_description}</p>}
      </div>
      <dl className="facts">{facts.map(([label, value]) => <div key={label}><dt className="meta">{label}</dt><dd>{value}</dd></div>)}<div><dt className="meta">Year</dt><dd className="tabular">{project.year}</dd></div></dl>
    </header>

    {story.length > 0 && <section className="wrap story" aria-label="Project story">
      {story.map(([heading, value], index) => <div key={heading} className="story__row" data-r={index % 2}><h2 className="meta">{heading}</h2><p className="copy story__text">{value}</p></div>)}
    </section>}

    {project.before_image && project.after_image && <section className="wrap block" aria-label="Before and after"><BeforeAfter before={project.before_image} after={project.after_image} title={project.title} /></section>}

    {gallery.length > 0 && <section className="wrap block" aria-label="Gallery"><Gallery entries={gallery} title={project.title} /></section>}

    {project.credits && <section className="wrap credits" aria-label="Credits"><h2 className="meta">Credits</h2><p className="copy">{project.credits}</p></section>}

    {(previous || next) && <nav className="wrap pnav" aria-label="More projects">
      {previous ? <Link href={`/portfolio/${previous.slug}/`} className="pnav__link" data-cursor="Previous"><span className="meta"><ArrowLeft /> Previous</span><strong>{previous.title}</strong></Link> : <span />}
      {next ? <Link href={`/portfolio/${next.slug}/`} className="pnav__link pnav__link--next" data-cursor="Next"><span className="meta">Next <ArrowRight /></span><strong>{next.title}</strong></Link> : <span />}
    </nav>}

    {related.length > 0 && <section className="wrap section" aria-labelledby="related-heading">
      <header className="section-head"><h2 id="related-heading" className="heading">More {project.category?.name ? `in ${project.category.name}` : "work"}</h2></header>
      <div className="related">{related.map((item, index) => <ProjectTile key={item.id} project={item} role="third" index={index} />)}</div>
    </section>}

    <section className="cta cta--compact" aria-labelledby="project-cta">
      <div className="wrap cta__inner">
        <h2 id="project-cta" className="title cta__title">Want something like this?</h2>
        <Link href="/contact/" className="btn btn--primary btn--lg">Start a project <ArrowUpRight className="btn__arrow" /></Link>
      </div>
    </section>
  </article>;
}
