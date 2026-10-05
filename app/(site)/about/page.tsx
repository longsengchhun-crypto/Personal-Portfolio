import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/Icon";
import Picture from "@/components/ui/Picture";
import { DEFAULT_DESCRIPTION, OWNER, pageMetadata } from "@/lib/content";
import { getSiteContext, getSkillGroups, getSoftwareTools } from "@/lib/data";

export const revalidate = 60;
export const metadata = pageMetadata("/about/", "About", DEFAULT_DESCRIPTION);

export default async function AboutPage() {
  const [{ site }, skillGroups, software] = await Promise.all([getSiteContext(), getSkillGroups(), getSoftwareTools()]);
  const paragraphs = (site?.professional_intro || "").split(/\n{2,}|\r\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const [lead, ...rest] = paragraphs;

  return <>
    <header className="wrap about-hero">
      <div className="about-hero__text">
        <p className="meta meta--accent">About</p>
        <h1 className="title">Visual creative &amp; media, with practical production depth.</h1>
        <p className="lede">{lead || "I work across VFX, photography, videography, filmmaking, motion graphics and 3D, bringing one connected visual direction to every project, from production through post."}</p>
        {rest.map((part, index) => <p key={index} className="copy">{part}</p>)}
        <div className="signoff"><Image className="signature" src="/static/site-assets/signature/signature.png" alt="Signature of Long Sengchhun" width={190} height={136} /></div>
        <dl className="facts facts--stack">
          <div><dt className="meta">Based in</dt><dd>{site?.location || OWNER.location}</dd></div>
          <div><dt className="meta">Disciplines</dt><dd>{OWNER.roles}</dd></div>
        </dl>
      </div>
      <div className="about-hero__portrait">
        <Picture src="/static/site-assets/profile/profile-cutout-fade.png" alt="Portrait of Long Sengchhun" fill priority sizes="(min-width: 900px) 40vw, 90vw" />
      </div>
    </header>

    {skillGroups.length > 0 && <section className="section" aria-labelledby="skills-heading">
      <div className="wrap">
        <header className="section-head"><div><p className="meta meta--accent">Capabilities</p><h2 id="skills-heading" className="title">What I bring to a project.</h2></div></header>
        <div className="skills">{skillGroups.map((group, index) => <section key={group.id} className="skills__group" data-r={index % 3}>
          <h3 className="heading">{group.name}</h3>
          <ul>{group.skills.map((skill) => <li key={skill.id}>{skill.name}</li>)}</ul>
        </section>)}</div>
      </div>
    </section>}

    {software.length > 0 && <section className="section section--flush-top" aria-labelledby="software-heading">
      <div className="wrap">
        <h2 id="software-heading" className="meta">Tools of the trade</h2>
        <ul className="software software--large">{software.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
      </div>
    </section>}

    <section className="cta cta--compact" aria-labelledby="about-cta">
      <div className="wrap cta__inner">
        <h2 id="about-cta" className="title cta__title">Let&apos;s talk about your project.</h2>
        <Link href="/contact/" className="btn btn--primary btn--lg">Get in touch <ArrowUpRight className="btn__arrow" /></Link>
      </div>
    </section>
  </>;
}
