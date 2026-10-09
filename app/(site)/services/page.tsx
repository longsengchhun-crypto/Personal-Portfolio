import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@/components/ui/Icon";
import { pageMetadata, SERVICE_CHOICES, SITE_URL } from "@/lib/content";
import { toJsonLd } from "@/lib/jsonLd";
import { CORE_SERVICES, SUPPORTING_SERVICES } from "@/lib/profile";

export const metadata = pageMetadata("/services/", "Services", "Videography, video editing, post-production, visual effects, motion graphics, photography and 3D by Long Sengchhun in Phnom Penh, Cambodia.");

const enquiryHref = (title: string) => (SERVICE_CHOICES.includes(title as never) ? `/contact/?service=${encodeURIComponent(title)}` : "/contact/");

export default function ServicesPage() {
  const all = [...CORE_SERVICES, ...SUPPORTING_SERVICES];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: all.map((service, index) => ({
      "@type": "ListItem", position: index + 1,
      item: { "@type": "Service", name: service.title, description: service.text, provider: { "@id": `${SITE_URL}/#person` } },
    })),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
    <header className="page-head wrap">
      <p className="meta">Services</p>
      <h1 className="page-head__title">Film and video first, with the visual craft around it.</h1>
    </header>

    <section className="wrap block" aria-labelledby="core-title">
      <h2 id="core-title" className="meta rule">Primary</h2>
      <ol className="services">{CORE_SERVICES.map((service, i) => <li key={service.title}>
        <span className="index__num tabular" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
        <div><h3 className="services__title">{service.title}</h3><p className="services__text">{service.text}</p></div>
        <ul className="services__points">{service.points.map((point) => <li key={point}>{point}</li>)}</ul>
        <Link href={enquiryHref(service.title)} className="link-arrow services__link" aria-label={`Enquire about ${service.title}`}>Enquire <ArrowRight /></Link>
      </li>)}</ol>
    </section>

    <section className="wrap block" aria-labelledby="support-title">
      <h2 id="support-title" className="meta rule">Complementary</h2>
      <ul className="supporting">{SUPPORTING_SERVICES.map((service) => <li key={service.title}>
        <h3 className="services__title services__title--sm">{service.title}</h3>
        <p className="services__text">{service.text}</p>
      </li>)}</ul>
    </section>

    <section className="closing wrap" aria-labelledby="services-cta">
      <h2 id="services-cta" className="closing__title">Need a custom combination?</h2>
      <div className="closing__actions"><Link href="/contact/" className="btn btn--primary">Tell me about it <ArrowUpRight className="btn__arrow" /></Link></div>
    </section>
  </>;
}
