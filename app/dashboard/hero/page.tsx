import Link from "next/link";
import HeroSlidesManager from "@/components/HeroSlidesManager";
import { requireAdmin } from "@/lib/auth";
import { getHeroSlides } from "@/lib/heroSlides";

export const metadata = { title: "Hero Slides" };
export const dynamic = "force-dynamic";

export default async function HeroSlidesPage() {
  await requireAdmin("/dashboard/hero/");
  const { slides, isDefault } = await getHeroSlides();
  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">Home page</p><h1>Hero Slides</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/"><i className="bi bi-arrow-left" />Dashboard</Link><Link className="btn btn-outline-light" href="/" target="_blank"><i className="bi bi-box-arrow-up-right" />View Site</Link></div></header>
    <HeroSlidesManager initial={slides} isDefault={isDefault} />
  </div></section>;
}
