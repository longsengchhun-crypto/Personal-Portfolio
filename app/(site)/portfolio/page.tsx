import Link from "next/link";
import WorkGrid, { ReelGrid } from "@/components/site/WorkGrid";
import { ArrowLeft, ArrowRight, Clapperboard, Play, Search } from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { OWNER, pageMetadata, SITE_URL } from "@/lib/content";
import { groupByTheme, sortThemes } from "@/lib/posterThemes";
import type { Project } from "@/lib/types";
import { getPortfolio } from "@/lib/data";

export const metadata = pageMetadata("/portfolio/", "Work", "Selected film, VFX, photography, motion, 3D and graphic design projects by LONG SENGCHHUN.");

const text = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

// Animation work is shown as a video wall in the video's own shape; everything else uses the editorial grid.
const wallShape = (slug: string | undefined): "reel" | "wide" | null => (slug === "2d-animation" ? "reel" : slug === "3d-animation" ? "wide" : null);

// Posters are one category, shown theme by theme.
function ThemedPosters({ projects, priority }: { projects: Project[]; priority: boolean }) {
  return <div className="themes">{groupByTheme(projects).map(({ theme, projects: group }, index) => <div key={theme} className="theme">
    <h3 className="theme__title">{theme}<span className="cat-section__count tabular">{group.length}</span></h3>
    <WorkGrid projects={group} compact priorityCount={priority && index === 0 ? 2 : 0} />
  </div>)}</div>;
}

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [category, type, year, search] = [text(params.category), text(params.type), text(params.year), text(params.search)];
  const page = Number(text(params.page)) || 1;
  const result = await getPortfolio({ category, type, year, search, page });
  const filtered = [category, type, year, search].filter(Boolean).length > 0;
  const activeCategory = result.categories.find((item) => item.slug === category);
  const themes = activeCategory ? sortThemes(result.typesByCategory[activeCategory.id] ?? []) : [];
  const themeLink = (theme: string) => `/portfolio/?${new URLSearchParams({ category, type: theme })}`;
  const pageQuery = (nextPage: number) => `/portfolio/?${new URLSearchParams(Object.entries({ category, type, year, search, page: String(nextPage) }).filter(([, value]) => value)).toString()}`;

  // With no filter the work is laid out category by category, in the order set in the admin.
  const sections = result.categories.map((item) => ({ category: item, projects: result.projects.filter((project) => project.category_id === item.id) })).filter((section) => section.projects.length > 0);
  const grouped = !filtered && sections.length > 0;

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

    {themes.length > 1 && <div className="wrap themebar"><nav className="themebar__chips" aria-label={`${activeCategory?.name} themes`}>
      <Link className="chip" href={`/portfolio/?category=${category}`} aria-current={!type ? "true" : undefined}>All {activeCategory?.name.toLowerCase()}s</Link>
      {themes.map((theme) => <Link key={theme} className="chip" href={themeLink(theme)} aria-current={type === theme ? "true" : undefined}>{theme}</Link>)}
    </nav></div>}

    <section className="wrap work-section" aria-label="Projects">
      {result.projects.length === 0
        ? <EmptyState icon={<Clapperboard />} title={activeCategory && !type && !year && !search ? `${activeCategory.name} work is coming soon` : filtered ? "No projects match those filters" : "New work is on its way"} action={filtered ? <Link className="btn btn--primary" href="/portfolio/">Show all work</Link> : <Link className="btn btn--primary" href="/contact/">Start a project</Link>}>
          {activeCategory && !type && !year && !search ? "Nothing is published in this category yet. Check back soon, or browse the rest of the work." : filtered ? "Try a different discipline, year or keyword." : "Projects will appear here as soon as they are published."}
        </EmptyState>
        : grouped
          ? sections.map(({ category: item, projects }, index) => <section key={item.id} className="cat-section" aria-labelledby={`cat-${item.id}`}>
            <header className="cat-section__head"><h2 id={`cat-${item.id}`}>{item.name}<span className="cat-section__count tabular">{projects.length}</span></h2><Link className="link-arrow" href={`/portfolio/?category=${item.slug}`}>View all <ArrowRight /></Link></header>
            {wallShape(item.slug) ? <ReelGrid projects={projects} shape={wallShape(item.slug)!} /> : item.slug === "poster" ? <ThemedPosters projects={projects} priority={index === 0} /> : <WorkGrid projects={projects} compact priorityCount={index === 0 ? 2 : 0} />}
          </section>)
          : wallShape(activeCategory?.slug) ? <ReelGrid projects={result.projects} shape={wallShape(activeCategory?.slug)!} /> : activeCategory?.slug === "poster" && !type ? <ThemedPosters projects={result.projects} priority /> : <WorkGrid projects={result.projects} priorityCount={2} />}
      {result.pages > 1 && <nav className="pager" aria-label="Pagination">
        {result.page > 1 ? <Link className="btn btn--glass" href={pageQuery(result.page - 1)}><ArrowLeft /> Previous</Link> : <span />}
        <span className="caption tabular">Page {result.page} of {result.pages}</span>
        {result.page < result.pages ? <Link className="btn btn--glass" href={pageQuery(result.page + 1)}>Next <ArrowRight /></Link> : <span />}
      </nav>}
    </section>
  </>;
}
