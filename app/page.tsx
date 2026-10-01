import Link from "next/link";
import HeroBackdrop from "@/components/HeroBackdrop";
import { DEFAULT_OG_IMAGE, DISCIPLINES, OWNER, SITE_URL } from "@/lib/content";
import { getFeaturedProjects, getFeaturedVideoProject, getServices, getSiteContext, getSoftwareTools } from "@/lib/data";
import { getHeroSlides } from "@/lib/heroSlides";
import { mediaUrl } from "@/lib/supabase";

const HOME_TITLE = "LONG SENGCHHUN | Visual Creative & Media";
const HOME_DESCRIPTION = "Visual creative specializing in VFX, photography, videography, filmmaking, motion, and digital design in Cambodia.";

// No per-visitor data here, so the page can be cached; admin edits appear within a minute.
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

const DISCIPLINE_LINE = ["VFX", "Film", "Photography", "Video", "Motion", "3D"];

export default async function HomePage() {
  const [{ site, social }, heroSlides, videoProject, services, software, featured] = await Promise.all([
    getSiteContext(), getHeroSlides(), getFeaturedVideoProject(), getServices(), getSoftwareTools(), getFeaturedProjects().catch(() => []),
  ]);
  const heroSlideList = heroSlides.slides.map((slide) => ({ ...slide, image: mediaUrl(slide.image, { width: 2000, quality: 80 }) }));
  const email = site?.email || OWNER.email;
  const work = featured.filter((project) => project.cover_image).slice(0, 5);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: OWNER.name,
    jobTitle: site?.professional_title || OWNER.title,
    url: SITE_URL,
    image: `${SITE_URL}/static/site-assets/profile/profile-cutout-fade.png`,
    email,
    telephone: site?.phone || OWNER.phone,
    address: { "@type": "PostalAddress", addressLocality: "Phnom Penh", addressCountry: "KH" },
    knowsAbout: ["Visual effects", "Filmmaking", "Photography", "Video editing", "Motion graphics", "3D modeling"],
    ...(social.length ? { sameAs: social.map((link) => link.url) } : {}),
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

    <section className="st-hero">
      <HeroBackdrop slides={heroSlideList} />
      <div className="st-hero-shade" aria-hidden="true" />
      <div className="container st-hero-inner">
        <p className="st-kicker">Visual Creative &amp; Media</p>
        <h1 className="st-hero-title">LONG<br />SENGCHHUN</h1>
        <ul className="st-discipline-line" aria-label="Disciplines">{DISCIPLINE_LINE.map((name) => <li key={name}>{name}</li>)}</ul>
        <div className="st-actions">
          <Link className="st-btn st-btn-solid" href="/showreel/">Watch the showreel</Link>
          <Link className="st-btn st-btn-line" href="/portfolio/">Explore the work</Link>
        </div>
      </div>
      <div className="container st-hero-foot">
        <span>{OWNER.location}</span>
        <span className="st-availability"><i aria-hidden="true" />Taking freelance projects</span>
        <Link href="/contact/">Start a project &rarr;</Link>
      </div>
    </section>

    <section className="st-section" aria-labelledby="disciplines-heading">
      <div className="container">
        <h2 id="disciplines-heading" className="st-label">Disciplines</h2>
        <ul className="st-index">{DISCIPLINES.map(([name, slug], index) => <li key={slug}><Link href={`/portfolio/?category=${slug}`}><span className="st-index-num">{String(index + 1).padStart(2, "0")}</span><span className="st-index-name">{name}</span><span className="st-index-arrow" aria-hidden="true">&rarr;</span></Link></li>)}</ul>
      </div>
    </section>

    {work.length > 0 && <section className="st-section st-work" aria-labelledby="work-heading">
      <div className="container">
        <div className="st-head"><h2 id="work-heading" className="st-title">Selected work</h2><Link className="st-more" href="/portfolio/">All work &rarr;</Link></div>
        <div className="st-work-grid">{work.map((project, index) => <Link className={`st-tile st-tile-${index}`} href={`/portfolio/${project.slug}/`} key={project.id}>
          <img src={mediaUrl(project.cover_image, { width: index === 0 ? 1400 : 800 })} alt={project.title} loading="lazy" decoding="async" />
          <span className="st-tile-caption"><b>{project.title}</b><small>{project.category?.name}{project.year ? ` · ${project.year}` : ""}</small></span>
        </Link>)}</div>
      </div>
    </section>}

    {videoProject?.video_file && <section className="st-section st-film" aria-labelledby="film-heading">
      <div className="container st-film-grid">
        <div>
          <h2 id="film-heading" className="st-label">Filmography</h2>
          <p className="st-title st-title-sm">{videoProject.title}</p>
          <p className="st-copy">{videoProject.short_description}</p>
          <Link className="st-btn st-btn-line" href={`/portfolio/${videoProject.slug}/`}>Watch the film</Link>
        </div>
        <Link className="st-film-frame" href={`/portfolio/${videoProject.slug}/`} aria-label={`View ${videoProject.title}`}>
          <video data-preview-video muted loop playsInline autoPlay preload="none" poster={mediaUrl(videoProject.cover_image, { width: 1400 })}><source src={mediaUrl(videoProject.video_file)} type="video/mp4" /></video>
        </Link>
      </div>
    </section>}

    <section className="st-section" aria-labelledby="services-heading">
      <div className="container">
        <div className="st-head"><h2 id="services-heading" className="st-title">Services</h2><Link className="st-more" href="/services/">Full details &rarr;</Link></div>
        <ol className="st-rows">{services.slice(0, 6).map((service, index) => <li key={service.id}><span className="st-index-num">{String(index + 1).padStart(2, "0")}</span><h3>{service.title}</h3><p>{service.description}</p></li>)}</ol>
      </div>
    </section>

    <section className="st-section st-process" aria-labelledby="process-heading">
      <div className="container">
        <h2 id="process-heading" className="st-label">How a project starts</h2>
        <ol className="st-steps">
          <li><b>01</b><strong>Send the brief</strong><p>Goal, timeline, budget range and any reference files.</p></li>
          <li><b>02</b><strong>Get a clear reply</strong><p>You receive an email confirmation right away and a response after review.</p></li>
          <li><b>03</b><strong>Plan the delivery</strong><p>Scope, schedule, revisions and final formats are agreed before production.</p></li>
        </ol>
      </div>
    </section>

    <section className="st-section st-about" aria-labelledby="about-heading">
      <div className="container st-about-grid">
        <img src="/static/site-assets/profile/profile-cutout-fade.png" alt="Portrait of LONG SENGCHHUN" loading="lazy" decoding="async" />
        <div>
          <h2 id="about-heading" className="st-label">About</h2>
          <p className="st-lede">I work across VFX, photography, videography, filmmaking, motion graphics and 3D, from production through post.</p>
          <p className="st-copy">Based in Phnom Penh, Cambodia. Available for freelance work with local and international clients.</p>
          <Link className="st-more" href="/about/">More about me &rarr;</Link>
          {software.length > 0 && <ul className="st-tools" aria-label="Software">{software.map((item) => <li key={item.id}>{item.name}</li>)}</ul>}
        </div>
      </div>
    </section>

    <section className="st-section st-cta" aria-labelledby="cta-heading">
      <div className="container">
        <h2 id="cta-heading" className="st-cta-title">Have a project in mind?</h2>
        <p className="st-copy">Tell me what you are making and I will reply with next steps.</p>
        <div className="st-actions">
          <Link className="st-btn st-btn-solid" href="/contact/">Start a project</Link>
          <a className="st-btn st-btn-line" href={OWNER.telegramUrl} target="_blank" rel="noreferrer">Telegram</a>
          <a className="st-btn st-btn-line" href={`mailto:${email}`}>Email</a>
        </div>
      </div>
    </section>
  </>;
}
