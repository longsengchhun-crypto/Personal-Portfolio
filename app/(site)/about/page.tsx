import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { OWNER, pageMetadata } from "@/lib/content";
import { getSiteContext } from "@/lib/data";
import { BIO, LASTFX, PRACTICE, PROFILE_SUMMARY, TOOLS } from "@/lib/profile";
import { availabilityLabel, getSiteFlags } from "@/lib/siteFlags";

export const revalidate = 60;
export const metadata = pageMetadata("/about/", "About & Profile", "Long Sengchhun is a visual creative in Phnom Penh, Cambodia, working across videography, editing, visual effects, motion graphics, photography and 3D.");

export default async function AboutPage() {
  const [{ site }, flags] = await Promise.all([getSiteContext().catch(() => ({ site: null })), getSiteFlags()]);
  const email = site?.email || OWNER.email;
  const phone = site?.phone || OWNER.phone;

  return <>
    <header className="page-head wrap">
      <p className="meta">About</p>
      <h1 className="page-head__title">Visual creative, working from capture to finish.</h1>
    </header>

    <section className="wrap bio" aria-label="Biography">
      <div className="bio__text prose-flow">
        {BIO.map((paragraph, i) => <p key={i} className={i === 0 ? "lede" : undefined}>{paragraph}</p>)}
      </div>
      <div className="bio__portrait"><Picture src="/static/site-assets/profile/profile-cutout.webp" alt="Portrait of Long Sengchhun" fill priority sizes="(min-width: 900px) 30vw, 70vw" /></div>
    </section>

    <section className="block wrap" aria-labelledby="profile-title">
      <div className="split">
        <div className="split__head"><p className="meta">Profile</p><h2 id="profile-title" className="heading">At a glance</h2></div>
        <dl className="facts split__main">
          <div><dt>Name</dt><dd>{OWNER.name}</dd></div>
          <div><dt>Titles</dt><dd>Visual creative</dd></div>
          <div><dt>Location</dt><dd>{site?.location || OWNER.location}</dd></div>
          <div><dt>Practice</dt><dd>{PRACTICE}</dd></div>
          {TOOLS.map(([group, list]) => <div key={group}><dt>{group}</dt><dd>{list}</dd></div>)}
          <div><dt>Availability</dt><dd>{availabilityLabel(flags)}</dd></div>
          <div><dt>Contact</dt><dd><a href={`mailto:${email}`}>{email}</a><br /><a href={OWNER.telegramUrl} target="_blank" rel="noopener noreferrer">Telegram {OWNER.telegram}</a><br /><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></dd></div>
          <div><dt>Software</dt><dd><a href={LASTFX.url} target="_blank" rel="noopener noreferrer">{LASTFX.name}<span className="sr-only"> (opens in a new tab)</span></a>: {LASTFX.products.map(([name]) => name).join(", ")}</dd></div>
        </dl>
      </div>
    </section>

    <section className="block wrap" aria-labelledby="summary-title">
      <div className="split">
        <div className="split__head"><p className="meta">Summary</p><h2 id="summary-title" className="heading">Short version</h2></div>
        <div className="split__main prose-flow"><p>{PROFILE_SUMMARY}</p></div>
      </div>
    </section>

    <section className="closing wrap" aria-labelledby="about-cta">
      <h2 id="about-cta" className="closing__title">Let&apos;s talk about your project.</h2>
      <div className="closing__actions"><Link href="/contact/" className="btn btn--primary">Get in touch <ArrowUpRight className="btn__arrow" /></Link></div>
    </section>
  </>;
}
