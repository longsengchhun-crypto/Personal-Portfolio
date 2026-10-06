import Image from "next/image";
import Link from "next/link";
import AutoVideo from "@/components/site/AutoVideo";
import Hero from "@/components/site/Hero";
import ToolMarquee from "@/components/site/ToolMarquee";
import WorkGrid from "@/components/site/WorkGrid";
import { ArrowRight, ArrowUpRight, Play } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { DEFAULT_OG_IMAGE, OWNER, SITE_URL } from "@/lib/content";
import { getFeaturedProjects, getFeaturedVideoProject, getServices, getSiteContext } from "@/lib/data";
import { getHeroSlides } from "@/lib/heroSlides";
import { getSiteFlags, seoDescription } from "@/lib/siteFlags";
import { mediaUrl } from "@/lib/supabase";
import { toJsonLd } from "@/lib/jsonLd";

const TITLE = `${OWNER.name} | Visual Creative & Media`;

// No per-visitor data here, so the page can be cached; admin edits appear within a minute.
export const revalidate = 60;

export async function generateMetadata() {
  const description = seoDescription(await getSiteFlags());
  return {
    title: { absolute: TITLE },
    description,
    alternates: { canonical: "/" },
    openGraph: { title: TITLE, description, url: "/", siteName: OWNER.name, type: "website" as const, images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }] },
  };
}

export default async function HomePage() {
  const [{ site, social }, heroSlides, videoProject, services, featured] = await Promise.all([
    getSiteContext(), getHeroSlides(), getFeaturedVideoProject(), getServices(), getFeaturedProjects().catch(() => []),
  ]);
  const work = featured.filter((project) => project.cover_image).slice(0, 7);
  const email = site?.email || OWNER.email;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: OWNER.name,
    jobTitle: site?.professional_title || OWNER.title,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    email,
    telephone: site?.phone || OWNER.phone,
    address: { "@type": "PostalAddress", addressLocality: "Phnom Penh", addressCountry: "KH" },
    knowsAbout: ["Visual effects", "Filmmaking", "Photography", "Video editing", "Motion graphics", "3D modeling"],
    ...(social.length ? { sameAs: social.map((link) => link.url) } : {}),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />

    <Hero slides={heroSlides.slides}>
      <p className="meta hero__kicker">{OWNER.title} · Phnom Penh</p>
      <h1 className="display hero__title">Long<br />Sengchhun</h1>
      <p className="hero__lede">VFX, filmmaking, photography, motion and 3D, from production through post.</p>
      <div className="hero__actions">
        <Link href="/portfolio/" className="btn btn--primary btn--lg">View work <ArrowRight className="btn__arrow" /></Link>
        <Link href="/contact/" className="btn btn--glass btn--lg">Let&apos;s work together</Link>
      </div>
    </Hero>

    <ToolMarquee />

    {work.length > 0 && <section className="section" aria-labelledby="work-heading">
      <div className="wrap">
        <header className="section-head" data-r>
          <div><p className="meta meta--accent">Selected work</p><h2 id="work-heading" className="title">Recent films, frames and campaigns.</h2></div>
          <Link href="/portfolio/" className="link-arrow">All work <ArrowRight /></Link>
        </header>
        <WorkGrid projects={work} compact priorityCount={0} />
      </div>
    </section>}

    {videoProject?.video_file && <section className="film" aria-labelledby="film-heading">
      <AutoVideo className="film__video" src={mediaUrl(videoProject.video_file)} poster={mediaUrl(videoProject.cover_image, { width: 1600 })} />
      <div className="film__shade" aria-hidden="true" />
      <div className="wrap film__inner" data-r>
        <p className="meta">Showreel</p>
        <h2 id="film-heading" className="title">{videoProject.title}</h2>
        <p className="lede">{videoProject.short_description}</p>
        <Link href="/showreel/" className="btn btn--glass btn--lg"><Play /> Watch the reel</Link>
      </div>
    </section>}

    <section className="section" aria-labelledby="services-heading">
      <div className="wrap">
        <header className="section-head" data-r>
          <div><p className="meta meta--accent">Capabilities</p><h2 id="services-heading" className="title">What I can make for you.</h2></div>
          <Link href="/services/" className="link-arrow">Services in detail <ArrowRight /></Link>
        </header>
        <ol className="capabilities">{services.slice(0, 6).map((service, index) => <li key={service.id} data-r={index % 3}>
          <span className="capabilities__num tabular" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="capabilities__title">{service.title}</h3>
          <p className="capabilities__text">{service.description}</p>
        </li>)}</ol>
      </div>
    </section>

    <section className="section section--flush-top" aria-labelledby="about-heading">
      <div className="wrap about-teaser">
        <div className="about-teaser__portrait" data-r>
          <Picture src="/static/site-assets/profile/profile-cutout.webp" alt="Portrait of Long Sengchhun" fill sizes="(min-width: 900px) 40vw, 90vw" />
        </div>
        <div data-r="1">
          <p className="meta meta--accent">About</p>
          <h2 id="about-heading" className="title">One connected visual direction, start to finish.</h2>
          <p className="lede">Based in Phnom Penh and working with clients locally and abroad across VFX, photography, videography, filmmaking, motion graphics and 3D.</p>
          <Link href="/about/" className="link-arrow">More about me <ArrowRight /></Link>
          <Image className="signature" src="/static/site-assets/signature/signature.png" alt="Signature of Long Sengchhun" width={190} height={136} />
        </div>
      </div>
    </section>

    <section className="cta" aria-labelledby="cta-heading">
      <div className="wrap cta__inner">
        <h2 id="cta-heading" className="display cta__title" data-r>Have a project<br />in mind?</h2>
        <div className="cta__actions" data-r="1">
          <Link href="/contact/" className="btn btn--primary btn--lg">Start a project <ArrowUpRight className="btn__arrow" /></Link>
          <a href={OWNER.telegramUrl} target="_blank" rel="noreferrer" className="btn btn--glass btn--lg">Telegram</a>
          <a href={`mailto:${email}`} className="btn btn--glass btn--lg">Email</a>
        </div>
      </div>
    </section>
  </>;
}
