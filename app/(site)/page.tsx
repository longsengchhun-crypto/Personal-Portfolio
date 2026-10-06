import Link from "next/link";
import AutoVideo from "@/components/site/AutoVideo";
import { ArrowRight, ArrowUpRight, Play } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { DEFAULT_OG_IMAGE, OWNER, SITE_URL } from "@/lib/content";
import { TITLE_OVERRIDES } from "@/lib/curation";
import { getFeaturedVideoProject, getSelectedProjects, getServices, getSiteContext } from "@/lib/data";
import { getHeroSlides } from "@/lib/heroSlides";
import { availabilityLabel, getSiteFlags, seoDescription } from "@/lib/siteFlags";
import { mediaUrl } from "@/lib/supabase";
import { toJsonLd } from "@/lib/jsonLd";

const TITLE = `${OWNER.name} — Visual Creative, Filmmaker & VFX Artist`;

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

// Disciplines shown on the homepage: only those the database has real descriptions for, in this order.
const DISCIPLINES = ["Videography and Filmmaking", "Video Editing", "Photography", "3D Modeling and Visualization", "3D Animation", "Poster Design"];

export default async function HomePage() {
  const [{ site, social }, heroSlides, videoProject, services, selected, flags] = await Promise.all([
    getSiteContext(), getHeroSlides(), getFeaturedVideoProject(), getServices(), getSelectedProjects().catch(() => []), getSiteFlags(),
  ]);
  const work = selected.filter((project) => project.cover_image);
  const lead = work[0];
  const disciplines = DISCIPLINES.map((title) => services.find((service) => service.title === title)).filter((service): service is NonNullable<typeof service> => Boolean(service));
  const onSet = heroSlides.slides.find((slide) => !slide.id.startsWith("default-"));
  const email = site?.email || OWNER.email;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: OWNER.name,
    jobTitle: "Visual Creative, Filmmaker & VFX Artist",
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

    <section className="intro wrap" aria-label="Introduction">
      <p className="intro__status meta"><i className={flags.available ? "is-open" : ""} aria-hidden="true" />{availabilityLabel(flags)} <span aria-hidden="true">·</span> Phnom Penh, Cambodia</p>
      <h1 className="intro__title">Visual creative.<br />Filmmaker.<br />VFX artist.</h1>
      <div className="intro__foot">
        <p className="intro__lede">Visual experiences across film, photography, VFX, motion and 3D.</p>
        <div className="intro__actions">
          <Link href="/portfolio/" className="btn btn--primary btn--lg">View selected work <ArrowRight className="btn__arrow" /></Link>
          {videoProject?.video_file && <Link href="/showreel/" className="btn btn--outline btn--lg"><Play /> Watch showreel</Link>}
        </div>
      </div>
    </section>

    {lead && <div className="wrap intro__frame-wrap">
      <Link href={`/portfolio/${lead.slug}/`} className="intro__frame" data-cursor="View" aria-label={`View project: ${TITLE_OVERRIDES[lead.slug] ?? lead.title}`}>
        <Picture src={lead.cover_image} alt="" fill priority sizes="(min-width: 1480px) 1400px, 100vw" quality={85} className="intro__img" />
      </Link>
      <p className="intro__caption caption"><span>{TITLE_OVERRIDES[lead.slug] ?? lead.title}</span><span>{lead.category?.name} · {lead.year}</span></p>
    </div>}

    {work.length > 1 && <section className="section" id="work" aria-labelledby="work-heading">
      <div className="wrap">
        <header className="section-head" data-r>
          <h2 id="work-heading" className="title">Selected work</h2>
          <Link href="/portfolio/" className="link-arrow">All work <ArrowRight /></Link>
        </header>
        <ol className="sw">{work.slice(1).map((project, index) => <li key={project.id} className={`sw__item sw__item--${index % 2 ? "b" : "a"}`} data-r>
          <Link href={`/portfolio/${project.slug}/`} className="sw__link" data-cursor="View">
            <span className="sw__media"><Picture src={project.cover_image} alt="" fill sizes="(min-width: 900px) 46vw, 100vw" className="sw__img" /></span>
            <span className="sw__row">
              <span className="sw__no tabular" aria-hidden="true">{String(index + 2).padStart(2, "0")}</span>
              <span className="sw__title">{TITLE_OVERRIDES[project.slug] ?? project.title}</span>
              <span className="sw__meta">{project.category?.name}{project.year ? `, ${project.year}` : ""}</span>
            </span>
          </Link>
        </li>)}</ol>
      </div>
    </section>}

    {videoProject?.video_file && <section className="reel" aria-labelledby="reel-heading">
      <div className="wrap">
        <header className="section-head" data-r>
          <h2 id="reel-heading" className="title">Showreel</h2>
          <p className="lede">Selected editing, motion and 3D work in one cut.</p>
        </header>
        <Link href="/showreel/" className="reel__frame" data-cursor="Play" data-r aria-label="Watch the showreel">
          <AutoVideo className="reel__video" src={mediaUrl(videoProject.video_file)} poster={mediaUrl(videoProject.cover_image, { width: 1600 })} />
          <span className="reel__play" aria-hidden="true"><Play /></span>
        </Link>
      </div>
    </section>}

    {disciplines.length > 0 && <section className="section" aria-labelledby="disciplines-heading">
      <div className="wrap">
        <header className="section-head" data-r>
          <h2 id="disciplines-heading" className="title">Disciplines</h2>
          <Link href="/services/" className="link-arrow">Services in detail <ArrowRight /></Link>
        </header>
        <ol className="capabilities">{disciplines.map((service, index) => <li key={service.id} data-r>
          <span className="capabilities__num tabular" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="capabilities__title">{service.title}</h3>
          <p className="capabilities__text">{service.description}</p>
        </li>)}</ol>
      </div>
    </section>}

    <section className="section section--flush-top" aria-labelledby="about-heading">
      <div className="wrap about-teaser">
        {onSet && <div className="about-teaser__portrait" data-r><Picture src={onSet.image} alt="Long Sengchhun operating a camera on a gimbal" fill sizes="(min-width: 900px) 40vw, 90vw" /></div>}
        <div data-r>
          <h2 id="about-heading" className="title">About</h2>
          <p className="lede">A multidisciplinary creative in Phnom Penh, working across film, photography, VFX, motion and 3D for clients here and abroad. Available for selected freelance collaborations.</p>
          <p className="tools">After Effects · Premiere Pro · Photoshop · Illustrator · DaVinci Resolve · Blender · CapCut · CorelDRAW</p>
          <Link href="/about/" className="link-arrow">More about me <ArrowRight /></Link>
        </div>
      </div>
    </section>

    <section className="cta" aria-labelledby="cta-heading">
      <div className="wrap cta__inner">
        <h2 id="cta-heading" className="cta__title" data-r>Have something<br />worth making?</h2>
        <div className="cta__actions" data-r>
          <Link href="/contact/" className="btn btn--primary btn--lg">Discuss a project <ArrowUpRight className="btn__arrow" /></Link>
          <a href={`mailto:${email}`} className="cta__mail">{email}</a>
        </div>
      </div>
    </section>
  </>;
}
