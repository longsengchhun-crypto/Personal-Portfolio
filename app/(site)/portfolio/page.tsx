import Link from "next/link";
import WorkGrid from "@/components/site/WorkGrid";
import { ArrowLeft, ArrowRight, Clapperboard, Play, Search } from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { OWNER, pageMetadata, SITE_URL } from "@/lib/content";
import { getPortfolio } from "@/lib/data";

export const metadata = pageMetadata("/portfolio/", "Work", "Selected film, VFX, photography, motion, 3D and graphic design projects by LONG SENGCHHUN.");

const text = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [category, type, year, search] = [text(params.category), text(params.type), text(params.year), text(params.search)];
  const page = Number(text(params.page)) || 1;
  const result = await getPortfolio({ category, type, year, search, page });
  const filtered = [category, type, year, search].filter(Boolean).length > 0;
  const activeCategory = result.categories.find((item) => item.slug === category);
  const pageQuery = (nextPage: number) => `/portfolio/?${new URLSearchParams(Object.entries({ category, type, year, search, page: String(nextPage) }).filter(([, value]) => value)).toString()}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Work", url: `${SITE_URL}/portfolio/`, description: metadata.description,
    isPartOf: { "@id": `${SITE_URL}/#website` }, author: { "@id": `${SITE_URL}/#person` },
    mainEntity: { "@type": "ItemList", itemListElement: result.projects.slice(0, 30).map((project, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}/portfolio/${project.slug}/`, name: project.title })) },
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <header className="page-head wrap">
      <p className="meta meta--accent">Selected work</p>
      <h1 className="display page-head__title">{activeCategory ? activeCategory.name : "Work"}</h1>
      <div className="page-head__row">
        <p className="lede">{result.projects.length} {result.projects.length === 1 ? "project" : "projects"}{filtered ? " match your filters" : ", curated by discipline"}. {OWNER.title}.</p>
        <Link href="/showreel/" className="btn btn--glass"><Play /> Watch showreel</Link>
      </div>
    </header>

    <div className="filterbar-wrap">
      <div className="wrap">
        <form className="filterbar glass" method="get" role="search" aria-label="Filter work">
          <nav className="filterbar__chips" aria-label="Disciplines">
            <Link className="chip" href="/portfolio/" aria-current={!category ? "true" : undefined}>All</Link>
            {result.categories.map((item) => <Link key={item.id} className="chip" href={`/portfolio/?category=${item.slug}`} aria-current={category === item.slug ? "true" : undefined}>{item.name}</Link>)}
          </nav>
          <div className="filterbar__search">
            <Search aria-hidden="true" />
            <input className="input input--sm" type="search" name="search" defaultValue={search} placeholder="Search work" aria-label="Search work" />
            {category && <input type="hidden" name="category" value={category} />}
          </div>
          {(result.types.length > 1 || result.years.length > 1) && <details className="filterbar__more">
            <summary className="btn btn--ghost btn--sm">More filters</summary>
            <div className="filterbar__panel glass glass--strong">
              <div className="field"><label htmlFor="f-type">Project type</label><select id="f-type" className="select select--sm" name="type" defaultValue={type}><option value="">All types</option>{result.types.map((item) => <option key={item}>{item}</option>)}</select></div>
              <div className="field"><label htmlFor="f-year">Year</label><select id="f-year" className="select select--sm" name="year" defaultValue={year}><option value="">All years</option>{result.years.map((item) => <option key={item}>{item}</option>)}</select></div>
              <button className="btn btn--primary btn--sm" type="submit">Apply</button>
            </div>
          </details>}
        </form>
      </div>
    </div>

    <section className="wrap work-section" aria-label="Projects">
      {result.projects.length > 0
        ? <WorkGrid projects={result.projects} priorityCount={2} />
        : <EmptyState icon={<Clapperboard />} title={filtered ? "No projects match those filters" : "New work is on its way"} action={filtered ? <Link className="btn btn--primary" href="/portfolio/">Show all work</Link> : <Link className="btn btn--primary" href="/contact/">Start a project</Link>}>
          {filtered ? "Try a different discipline, year or keyword." : "Projects will appear here as soon as they are published."}
        </EmptyState>}
      {result.pages > 1 && <nav className="pager" aria-label="Pagination">
        {result.page > 1 ? <Link className="btn btn--glass" href={pageQuery(result.page - 1)}><ArrowLeft /> Previous</Link> : <span />}
        <span className="caption tabular">Page {result.page} of {result.pages}</span>
        {result.page < result.pages ? <Link className="btn btn--glass" href={pageQuery(result.page + 1)}>Next <ArrowRight /></Link> : <span />}
      </nav>}
    </section>
  </>;
}
