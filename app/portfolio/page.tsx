import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { getPortfolio } from "@/lib/data";
import type { Project } from "@/lib/types";

export const metadata = { title: "Work" };

const collectionOrder = ["Video & 3D", "Food & Beverage", "Beauty & Skincare", "Technology & Gaming", "Culture & Events", "Campaigns & Lifestyle", "Other Creative Work"];
const collectionDescriptions: Record<string, string> = {
  "Video & 3D": "Motion, editing, modeling, and visualization work presented as focused case studies.",
  "Food & Beverage": "Appetite-led promotional artwork for restaurants, products, drinks, and campaigns.",
  "Beauty & Skincare": "Clean commercial compositions for cosmetics, wellness, and personal-care brands.",
  "Technology & Gaming": "High-energy product visuals for devices, gaming, electronics, and launches.",
  "Culture & Events": "Respectful visual storytelling for Cambodian heritage, public moments, and events.",
  "Campaigns & Lifestyle": "Travel, services, sports, and broader promotional communication.",
  "Other Creative Work": "Additional selected creative projects and visual studies.",
};

function collectionFor(project: Project) {
  if (project.category?.slug === "video-and-3d-modeling") return "Video & 3D";
  const value = `${project.title} ${project.project_type}`.toLowerCase();
  if (/food|bakery|restaurant|grill|smoothie|beverage|tea|menu/.test(value)) return "Food & Beverage";
  if (/cosmetic|skincare|beauty|mineral|cerave|cetaphil/.test(value)) return "Beauty & Skincare";
  if (/gaming|technology|phone|laptop|electronics|panasonic|ps5|asus|tuf/.test(value)) return "Technology & Gaming";
  if (/cultural|heritage|constitution|civic|event/.test(value)) return "Culture & Events";
  if (/travel|service|passapp|racing|campaign|promo/.test(value)) return "Campaigns & Lifestyle";
  return "Other Creative Work";
}

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const type = typeof params.type === "string" ? params.type : "";
  const year = typeof params.year === "string" ? params.year : "";
  const search = typeof params.search === "string" ? params.search : "";
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const result = await getPortfolio({ category, type, year, search, page });
  const query = new URLSearchParams({ category, type, year, search });
  const activeFilters = [category, type, year, search].filter(Boolean).length;
  const grouped = result.projects.reduce((collections, project) => {
    const name = collectionFor(project);
    collections.set(name, [...(collections.get(name) || []), project]);
    return collections;
  }, new Map<string, Project[]>());
  const orderedGroups = collectionOrder.filter((name) => grouped.has(name));

  return <>
    <section className="page-hero compact"><div className="container"><p className="eyebrow">Selected Portfolio</p><h1>Creative work, organized for easy browsing.</h1><p>Browse by discipline, artwork type, year, or keyword. Each collection is arranged around what the work was designed to achieve.</p></div></section>
    <section className="section pt-0"><div className="container">
      <nav className="portfolio-category-nav" aria-label="Portfolio disciplines"><Link className={!category ? "is-active" : ""} href="/portfolio/">All selected work</Link>{result.categories.map((item) => <Link className={category === item.slug ? "is-active" : ""} href={`/portfolio/?category=${item.slug}`} key={item.id}>{item.name}</Link>)}</nav>
      <form className="filter-bar portfolio-filter-bar" method="get"><div className="filter-search"><i className="bi bi-search" /><input className="form-control" type="search" name="search" defaultValue={search} placeholder="Search title or project type" aria-label="Search portfolio" /></div><select className="form-select" name="category" aria-label="Filter by discipline" defaultValue={category}><option value="">All disciplines</option>{result.categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select><select className="form-select" name="type" aria-label="Filter by artwork type" defaultValue={type}><option value="">All artwork types</option>{result.types.map((item) => <option value={item} key={item}>{item}</option>)}</select><select className="form-select" name="year" aria-label="Filter by year" defaultValue={year}><option value="">All years</option>{result.years.map((item) => <option value={item} key={item}>{item}</option>)}</select><button className="btn btn-accent" type="submit">Show Work</button></form>
      <div className="portfolio-result-summary"><p><strong>{result.projects.length}</strong> selected project{result.projects.length === 1 ? "" : "s"}{activeFilters ? ` matching ${activeFilters} active filter${activeFilters === 1 ? "" : "s"}` : " across curated collections"}.</p>{activeFilters > 0 && <Link className="text-link" href="/portfolio/"><i className="bi bi-x-circle" />Clear all filters</Link>}</div>

      {orderedGroups.length ? <div className="portfolio-collections">{orderedGroups.map((name, index) => {
        const projects = grouped.get(name) || [];
        return <section className="portfolio-collection" id={`collection-${index + 1}`} key={name}><header><div><span>{String(index + 1).padStart(2, "0")}</span><p className="eyebrow">Curated Collection</p><h2>{name}</h2><p>{collectionDescriptions[name]}</p></div><strong>{projects.length} project{projects.length === 1 ? "" : "s"}</strong></header><div className="project-grid curated-grid">{projects.map((project) => <ProjectCard project={project} key={project.id} />)}</div></section>;
      })}</div> : <div className="empty-state portfolio-empty"><i className="bi bi-search" /><h2>No matching projects</h2><p>Try another artwork type, year, or keyword.</p><Link className="btn btn-accent" href="/portfolio/">View all selected work</Link></div>}

      {result.pages > 1 && <nav className="pagination-row" aria-label="Portfolio pagination">{result.page > 1 && <Link className="btn btn-outline-light" href={`/portfolio/?${query.toString()}&page=${result.page - 1}`}>Previous</Link>}<span>Page {result.page} of {result.pages}</span>{result.page < result.pages && <Link className="btn btn-outline-light" href={`/portfolio/?${query.toString()}&page=${result.page + 1}`}>Next</Link>}</nav>}
    </div></section>
  </>;
}
