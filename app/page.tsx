import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import { DEFAULT_OG_IMAGE, DISCIPLINES, EDITING_TOOLS, KHMER, OWNER, SITE_URL } from "@/lib/content";
import { getFeaturedVideoProject, getServices, getSiteContext, getSoftwareTools } from "@/lib/data";
import { getHeroSlides } from "@/lib/heroSlides";
import { mediaUrl } from "@/lib/supabase";

const HOME_TITLE = "LONG SENGCHHUN | Visual Creative & Media";
const HOME_DESCRIPTION = "Visual creative specializing in VFX, photography, videography, filmmaking, motion, and digital design in Cambodia.";

// This page has no per-visitor data (the layout's own cookie reads were moved to a client-fetched
// API route specifically so pages like this could be cached instead of re-rendered from scratch
// on every request) — ISR here means most visits are served from cache, and admin edits still
// show up within a minute even for a first-time visitor, on top of already being instant for
// anyone with the page open via RealtimeSync.
export const revalidate = 60;

export const metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE, description: HOME_DESCRIPTION, url: "/",
    siteName: "LONG SENGCHHUN", type: "website", images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

const PROJECT_STARTERS = [
  { icon: "bi-vector-pen", title: "A poster or campaign", detail: "Product, food, event, or social artwork", service: "Poster Design" },
  { icon: "bi-camera-reels", title: "A polished video", detail: "Editing, motion, pacing, color, and sound", service: "Video Editing" },
  { icon: "bi-camera", title: "A photo or video sh oot", detail: "Commercial, event, product, or story-led production", service: "Photo / Video Production" },
  { icon: "bi-box", title: "A 3D visualization", detail: "Products, environments, animation, and rendering", service: "3D Design and Modeling" },
] as const;

export default async function HomePage() {
  const [{ site, social }, heroSlides, videoProject, services, software] = await Promise.all([getSiteContext(), getHeroSlides(), getFeaturedVideoProject(), getServices(), getSoftwareTools()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: OWNER.name,
    jobTitle: site?.professional_title || OWNER.title,
    url: SITE_URL,
    image: `${SITE_URL}/static/site-assets/profile/profile-cutout-fade.png`,
    email: site?.email || OWNER.email,
    telephone: site?.phone || OWNER.phone,
    address: { "@type": "PostalAddress", addressLocality: "Phnom Penh", addressCountry: "KH" },
    ...(social.length ? { sameAs: social.map((link) => link.url) } : {}),
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="hero-section"><div className="container hero-grid">
      <div className="hero-copy reveal"><p className="eyebrow">{OWNER.name}</p><h1>{site?.professional_title || OWNER.title}</h1><p className="role-line">{OWNER.roles}</p><p className="hero-description">{site?.hero_intro || "Creating visual experiences through production, post-production, and digital creativity."}</p><p className="khmer-line">{site?.khmer_intro || KHMER.hero}</p><div className="button-row"><Link className="btn btn-accent" href="/showreel/"><i className="bi bi-play-fill" />Watch Showreel</Link><Link className="btn btn-outline-light" href="/portfolio/">View Selected Work</Link></div></div>
      <div className="hero-visual reveal"><div className="profile-stage" aria-label="LONG SENGCHHUN profile portrait"><div className="profile-frame"><img className="profile-portrait" src="/static/site-assets/profile/profile-cutout-fade.png" alt="LONG SENGCHHUN profile portrait" decoding="async" fetchPriority="high" /><div className="profile-frame-copy"><span>Phnom Penh, Cambodia</span><strong>{OWNER.roles}</strong></div></div><div className="profile-glass-note"><i aria-hidden="true" />Available for freelance projects</div></div></div>
    </div></section>
    <section className="tool-marquee" aria-label="Creative software tools"><div className="tool-track">{[...EDITING_TOOLS, ...EDITING_TOOLS, ...EDITING_TOOLS].map((tool, index) => <span className="tool-logo" title={index < EDITING_TOOLS.length ? tool.name : undefined} aria-hidden={index >= EDITING_TOOLS.length || undefined} key={`${tool.image}-${index}`}><img src={tool.image} alt={index < EDITING_TOOLS.length ? `${tool.name} logo` : ""} loading="lazy" decoding="async" /></span>)}</div></section>
    {heroSlides.slides.length > 0 && <HeroSlider slides={heroSlides.slides.map((slide) => ({ ...slide, image: mediaUrl(slide.image, { width: 2000, quality: 80 }) }))} variant="band"><p className="eyebrow">Featured Work</p><h2>Visual effects, 3D, and film — crafted with care.</h2><p className="hero-description">A rotating look at the disciplines behind the work.</p><div className="button-row"><Link className="btn btn-accent" href="/portfolio/">View Selected Work</Link></div></HeroSlider>}
    <section className="section discipline-band"><div className="container"><div className="discipline-grid">{DISCIPLINES.map(([name, slug], index) => <Link href={`/portfolio/?category=${slug}`} className="discipline-link reveal" key={slug}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong></Link>)}</div></div></section>
    <section className="section project-starter-section"><div className="container"><div className="section-heading"><div><p className="eyebrow">Quick Project Start</p><h2>Choose what you need. The inquiry form will be prepared for you.</h2></div><p className="section-side-copy">A clearer starting point means a faster, more useful first reply.</p></div><div className="project-starter-grid">{PROJECT_STARTERS.map((item) => <Link className="project-starter-card reveal" href={`/contact/?service=${encodeURIComponent(item.service)}`} key={item.service}><span><i className={`bi ${item.icon}`} /></span><div><h3>{item.title}</h3><p>{item.detail}</p></div><i className="bi bi-arrow-up-right" aria-hidden="true" /></Link>)}</div><div className="project-process"><article><span>01</span><strong>Send the brief</strong><p>Share your goal, timeline, budget range, and any useful files.</p></article><article><span>02</span><strong>Receive a clear response</strong><p>You receive an email confirmation immediately and a decision or reply after review.</p></article><article><span>03</span><strong>Plan the delivery</strong><p>We confirm scope, schedule, revisions, and final formats before production begins.</p></article></div></div></section>
    <section className="section"><div className="container split-section"><div className="reveal"><p className="eyebrow">About</p><h2>Visual work across VFX, film, and photography.</h2></div><div className="prose reveal"><p>I work across VFX, photography, videography, filmmaking, motion graphics, and 3D — from production through post, based in Cambodia.</p><p>Based in Phnom Penh, Cambodia. Available for freelance collaborations and for working with local and international clients when opportunities are available.</p><Link className="text-link" href="/about/">Learn more</Link></div></div></section>
    <section className="software-strip" aria-label="Software"><div className="container software-list">{software.map((item) => <span key={item.id}>{item.name}</span>)}</div></section>
    {videoProject && <section className="section video-feature-section"><div className="container video-feature-grid"><div className="video-feature-copy reveal"><p className="eyebrow">Filmography</p><h2>{videoProject.title}</h2><p>{videoProject.short_description}</p><Link className="btn btn-accent" href={`/portfolio/${videoProject.slug}/`}>Watch the Film</Link></div><Link className="video-feature-player reveal" href={`/portfolio/${videoProject.slug}/`} aria-label={`View ${videoProject.title}`}>{videoProject.cover_image ? <img className="video-feature-fallback" src={mediaUrl(videoProject.cover_image)} alt="" loading="lazy" /> : <span className="video-feature-placeholder">Video Showcase</span>}<video data-preview-video muted loop playsInline autoPlay preload="metadata" poster={mediaUrl(videoProject.cover_image)}><source src={mediaUrl(videoProject.video_file)} type="video/mp4" /></video><span className="video-feature-badge"><i className="bi bi-play-fill" /> 1080p video preview</span></Link></div></section>}
    <section className="section"><div className="container"><div className="section-heading"><div><p className="eyebrow">Services</p><h2>Creative support from concept to delivery.</h2></div><Link className="text-link" href="/services/">View all services</Link></div><div className="service-grid">{services.slice(0, 6).map((service, index) => <article className="service-item reveal" key={service.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{service.title}</h3><p>{service.description}</p></article>)}</div></div></section>
    <section className="section showreel-section"><div className="container showreel-panel reveal"><div><p className="eyebrow">Showreel</p><h2>{site?.showreel_title || "Current creative showcase"}</h2><p>Selected motion, design, and 3D work prepared for a smooth viewing experience.</p></div><Link className="play-button" href="/showreel/" aria-label="Watch the showreel"><i className="bi bi-play-fill" /></Link></div></section>
    <section className="section cta-section"><div className="container"><p className="eyebrow">Start a Conversation</p><h2>Let&apos;s create something worth remembering.</h2><p className="khmer-line">{KHMER.footerCta}</p><div className="button-row"><Link className="btn btn-accent" href="/contact/">Discuss a Project</Link><a className="btn btn-outline-light" href={OWNER.telegramUrl} target="_blank" rel="noreferrer">Telegram Me</a><a className="btn btn-outline-light" href={`mailto:${site?.email || OWNER.email}`}>Email Me</a></div></div></section>
  </>;
}
