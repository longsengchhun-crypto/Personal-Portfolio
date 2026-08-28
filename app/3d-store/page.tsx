import Link from "next/link";
import StoreProductCard from "@/components/StoreProductCard";
import { pageMetadata } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getStoreProducts } from "@/lib/data";

export const metadata = pageMetadata("/3d-store/", "3D Store", "Premium 3D assets for creators, designers, and production by LONG SENGCHHUN.");

const SORT_OPTIONS = [
  ["newest", "Newest"], ["oldest", "Oldest"], ["price-low", "Price: Low to High"], ["price-high", "Price: High to Low"], ["featured", "Featured"],
] as const;

export default async function StorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const search = typeof params.search === "string" ? params.search : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const { products, categories } = await getStoreProducts({ category, search, sort });
  const customer = await getCustomer();

  return <>
    <section className="page-hero compact"><div className="container">
      <div className="store-hero-account"><p className="eyebrow">3D Store</p>{customer ? <Link className="text-link" href="/3d-store/account/"><i className="bi bi-person-circle" /> My Account</Link> : <Link className="text-link" href="/3d-store/account/login/"><i className="bi bi-person-circle" /> Sign In / Register</Link>}</div>
      <h1>Premium 3D assets for creators, designers &amp; production.</h1><p>Browse ready-to-use 3D models with clear licensing, file formats, and pricing in USD or KHR.</p>
    </div></section>
    <section className="section pt-0"><div className="container">
      <nav className="portfolio-category-nav" aria-label="3D Store categories"><Link className={!category ? "is-active" : ""} href="/3d-store/">All models</Link>{categories.map((item) => <Link className={category === item.slug ? "is-active" : ""} href={`/3d-store/?category=${item.slug}`} key={item.id}>{item.name}</Link>)}</nav>

      <form className="filter-bar portfolio-filter-bar" method="get"><div className="filter-search"><i className="bi bi-search" /><input className="form-control" type="search" name="search" defaultValue={search} placeholder="Search models, tags" aria-label="Search 3D store" /></div><input type="hidden" name="category" value={category} /><select className="form-select" name="sort" aria-label="Sort" defaultValue={sort}>{SORT_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="btn btn-accent" type="submit">Show Models</button></form>

      <div className="portfolio-result-summary"><p><strong>{products.length}</strong> model{products.length === 1 ? "" : "s"}{category || search ? " matching your filters" : " available"}.</p>{(category || search) && <Link className="text-link" href="/3d-store/"><i className="bi bi-x-circle" />Clear all filters</Link>}</div>

      {products.length ? <div className="project-grid editorial-grid">{products.map((product) => <StoreProductCard product={product} key={product.id} />)}</div> : <div className="empty-state portfolio-empty"><i className="bi bi-box-seam" /><h2>No models yet</h2><p>New 3D assets are on the way — check back soon.</p></div>}
    </div></section>
  </>;
}
