import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/ui/Icon";
import { pageMetadata, SERVICE_CHOICES, SITE_URL } from "@/lib/content";
import { getServices } from "@/lib/data";
import { toJsonLd } from "@/lib/jsonLd";

export const revalidate = 60;
export const metadata = pageMetadata("/services/", "Services", "Filmmaking, VFX, photography, video editing, motion graphics, 3D and graphic design services by LONG SENGCHHUN.");

const PROCESS = [
  ["Discover", "Understanding the goal, audience and message before any concept work begins."],
  ["Pre-production", "Concept, script, shot list and planning so production runs smoothly."],
  ["Production", "Camera, lighting, sound and design work captured or built to plan."],
  ["Post-production", "Editing, colour, motion graphics and sound design refine the result."],
  ["Delivery", "Final master and platform-ready versions in the agreed formats."],
] as const;

const enquiryHref = (title: string) => (SERVICE_CHOICES.includes(title as never) ? `/contact/?service=${encodeURIComponent(title)}` : "/contact/");

export default async function ServicesPage() {
  const services = await getServices();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem", position: index + 1,
      item: { "@type": "Service", name: service.title, description: service.description, provider: { "@id": `${SITE_URL}/#studio` }, areaServed: "Worldwide" },
    })),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
    <header className="page-head wrap">
      <p className="meta meta--accent">Services</p>
      <h1 className="display page-head__title">Capabilities</h1>
      <p className="lede">From the first frame to the final delivery, one point of contact for the whole picture.</p>
    </header>

    <section className="wrap section--tight" aria-label="Services">
      <ol className="capabilities capabilities--page">{services.map((service, index) => <li key={service.id} data-r={index % 3}>
        <span className="capabilities__num tabular" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <h2 className="capabilities__title">{service.title}</h2>
        <p className="capabilities__text">{service.description}</p>
        <Link href={enquiryHref(service.title)} className="capabilities__link link-arrow" aria-label={`Enquire about ${service.title}`}>Enquire <ArrowRight /></Link>
      </li>)}</ol>
    </section>

    <section className="section" aria-labelledby="process-heading">
      <div className="wrap">
        <header className="section-head"><div><p className="meta meta--accent">Process</p><h2 id="process-heading" className="title">How a project runs.</h2></div></header>
        <ol className="steps">{PROCESS.map(([title, text], index) => <li key={title} data-r={index % 3}><span className="steps__num tabular">{String(index + 1).padStart(2, "0")}</span><h3 className="steps__title">{title}</h3><p>{text}</p></li>)}</ol>
      </div>
    </section>

    <section className="cta cta--compact" aria-labelledby="services-cta">
      <div className="wrap cta__inner">
        <h2 id="services-cta" className="title cta__title">Need a custom combination?</h2>
        <Link href="/contact/" className="btn btn--primary btn--lg">Tell me about it <ArrowUpRight className="btn__arrow" /></Link>
      </div>
    </section>
  </>;
}
