import Link from "next/link";
import { KHMER, SERVICES } from "@/lib/content";

export const metadata = { title: "Services" };

export default function ServicesPage() { return <><section className="page-hero"><div className="container"><p className="eyebrow">Services</p><h1>Creative services built around clear communication and strong visual outcomes.</h1><p className="khmer-line">{KHMER.projectCta}</p></div></section><section className="section pt-0"><div className="container"><div className="service-grid detailed">{SERVICES.map(([title, description], index) => <article className="service-item reveal" key={title}><span>{String(index + 1).padStart(2, "0")}</span><h2>{title}</h2><p>{description}</p></article>)}</div></div></section><section className="section cta-section"><div className="container"><h2>Need a custom combination of services?</h2><Link className="btn btn-accent" href="/contact/">Tell me about your project</Link></div></section></>; }
