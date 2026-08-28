import Link from "next/link";
import { KHMER, pageMetadata } from "@/lib/content";
import { getServices } from "@/lib/data";

export const metadata = pageMetadata("/services/", "Services", "Graphic design, poster design, video editing, photography, and 3D services by LONG SENGCHHUN.");

const PRODUCTION_PROCESS = [
  ["Discover", "Understanding the goal, audience, and message before any concept work begins."],
  ["Pre-Production", "Concept, script, shot list, and planning so production runs smoothly."],
  ["Production", "Camera, lighting, sound, and design work captured or built to plan."],
  ["Post-Production", "Editing, color, motion graphics, and sound design refine the result."],
  ["Delivery", "Final master and platform-ready versions delivered on the agreed format."],
] as const;

export default async function ServicesPage() {
  const services = await getServices();
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Services</p><h1>Creative services built around clear communication and strong visual outcomes.</h1><p className="khmer-line">{KHMER.projectCta}</p></div></section><section className="section pt-0"><div className="container"><div className="service-grid detailed">{services.map((service, index) => <article className="service-item reveal" key={service.id}><span>{String(index + 1).padStart(2, "0")}</span><h2>{service.title}</h2><p>{service.description}</p></article>)}</div></div></section>
    <section className="section pt-0"><div className="container"><div className="section-heading"><div><p className="eyebrow">How Projects Run</p><h2>A clear production process, start to finish.</h2></div></div><div className="project-process five-step">{PRODUCTION_PROCESS.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><p>{description}</p></article>)}</div></div></section>
    <section className="section cta-section"><div className="container"><h2>Need a custom combination of services?</h2><Link className="btn btn-accent" href="/contact/">Tell me about your project</Link></div></section></>;
}
