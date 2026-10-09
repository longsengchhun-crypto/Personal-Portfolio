import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/ui/Icon";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, OWNER, SITE_TITLE, SITE_URL } from "@/lib/content";
import { getSiteContext } from "@/lib/data";
import { toJsonLd } from "@/lib/jsonLd";
import { BIO, CORE_SERVICES, LASTFX, SUPPORTING_SERVICES } from "@/lib/profile";
import { getSiteFlags, seoDescription } from "@/lib/siteFlags";

export const revalidate = 60;

export async function generateMetadata() {
  const description = seoDescription(await getSiteFlags());
  return {
    title: { absolute: SITE_TITLE },
    description,
    alternates: { canonical: "/" },
    openGraph: { title: SITE_TITLE, description, url: "/", siteName: OWNER.name, type: "website" as const, images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }] },
  };
}

export default async function HomePage() {
  const [{ site, social }, flags] = await Promise.all([getSiteContext().catch(() => ({ site: null, social: [] })), getSiteFlags()]);
  const email = site?.email || OWNER.email;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: OWNER.name,
    jobTitle: "Visual Creative",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    email,
    address: { "@type": "PostalAddress", addressLocality: "Phnom Penh", addressCountry: "KH" },
    knowsAbout: ["Videography", "Video editing", "Visual effects", "Motion graphics", "Photography", "3D modeling"],
    ...(social.length ? { sameAs: social.map((link) => link.url) } : {}),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />

    <section className="intro wrap" aria-labelledby="intro-title">
      <p className="meta intro__label">Visual creative · Phnom Penh, Cambodia</p>
      <h1 id="intro-title" className="intro__title">Visual storytelling, from production through post.</h1>
      <div className="intro__body">
        <p className="lede">I am Long Sengchhun. I work across videography, post-production, visual effects, motion graphics and 3D, taking a project from the first idea to the final delivery.</p>
        <div className="intro__actions">
          <Link href="/about/" className="btn btn--primary">Explore my profile <ArrowRight className="btn__arrow" /></Link>
          <Link href="/contact/" className="btn btn--outline">Discuss a project</Link>
        </div>
      </div>
    </section>

    <section className="block wrap" aria-labelledby="work-title">
      <div className="split">
        <div className="split__head"><p className="meta">Services</p><h2 id="work-title" className="heading">What I can help with</h2></div>
        <div className="split__main">
          <ol className="index">{[...CORE_SERVICES, ...SUPPORTING_SERVICES].map((service, i) => <li key={service.title}>
            <span className="index__num tabular" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <span className="index__title">{service.title}</span>
            <span className="index__text">{service.text}</span>
          </li>)}</ol>
          <Link href="/services/" className="link-arrow">Services in detail <ArrowRight /></Link>
        </div>
      </div>
    </section>

    <section className="block wrap" aria-labelledby="about-title">
      <div className="split">
        <div className="split__head"><p className="meta">About</p><h2 id="about-title" className="heading">A connected approach</h2></div>
        <div className="split__main prose-flow">
          <p>{BIO[1]}</p>
          <p>{BIO[2]}</p>
          <Link href="/about/" className="link-arrow">Read the full profile <ArrowRight /></Link>
        </div>
      </div>
    </section>

    <section className="block wrap" aria-labelledby="lastfx-title">
      <div className="split">
        <div className="split__head"><p className="meta">Software</p><h2 id="lastfx-title" className="heading">Also: {LASTFX.name}</h2></div>
        <div className="split__main prose-flow">
          <p>{LASTFX.summary} Current tools: {LASTFX.products.map(([name]) => name).join(", ")}.</p>
          <a href={LASTFX.url} target="_blank" rel="noopener noreferrer" className="link-arrow">Visit lastfxstudio.com <ArrowUpRight /><span className="sr-only">(opens in a new tab)</span></a>
        </div>
      </div>
    </section>

    <section className="closing wrap" aria-labelledby="closing-title">
      <p className="meta closing__status"><i className={flags.available ? "is-open" : ""} aria-hidden="true" />{flags.available ? "Open to selected collaborations" : "Currently booked, enquiries welcome"}</p>
      <h2 id="closing-title" className="closing__title">Have a project in mind?</h2>
      <div className="closing__actions">
        <Link href="/contact/" className="btn btn--primary">Start a conversation <ArrowUpRight className="btn__arrow" /></Link>
        <a href={`mailto:${email}`} className="link-arrow">{email}</a>
      </div>
    </section>
  </>;
}
