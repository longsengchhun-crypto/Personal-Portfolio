import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ModelViewer from "@/components/ModelViewer";
import StoreProductCard from "@/components/StoreProductCard";
import WishlistButton from "@/components/WishlistButton";
import { OWNER, SITE_URL } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getCustomerWishlistIds, getStoreProduct } from "@/lib/data";
import { mediaUrl } from "@/lib/supabase";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await getStoreProduct((await params).slug);
  if (!result) return { title: "Model not found" };
  const { product } = result;
  const canonical = `/3d-store/${product.slug}/`;
  const image = product.cover_image ? mediaUrl(product.cover_image, { width: 1200, quality: 80 }) : undefined;
  return {
    title: product.title,
    description: product.short_description,
    alternates: { canonical },
    openGraph: { title: product.title, description: product.short_description, url: canonical, images: image ? [{ url: image }] : undefined },
  };
}

export default async function ProductDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string }> }) {
  const result = await getStoreProduct((await params).slug);
  if (!result) notFound();
  const { product, related } = result;
  const { error } = await searchParams;
  const customer = await getCustomer();
  const wishlistIds = customer ? await getCustomerWishlistIds(customer.id) : new Set<number>();

  const facts: [string, string][] = [
    ["Category", product.category?.name || "Uncategorized"],
    ["Software", product.software],
    ["File formats", product.file_formats],
    ["Polygon count", product.polygon_count],
    ["Textures", product.texture_info],
    ["Dimensions", product.dimensions],
    ["File size", product.file_size],
    ["Version", product.version],
    ["Compatibility", product.compatibility],
  ].filter(([, value]) => value) as [string, string][];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description,
    url: `${SITE_URL}/3d-store/${product.slug}/`,
    ...(product.cover_image ? { image: mediaUrl(product.cover_image, { width: 1200, quality: 80 }) } : {}),
    offers: { "@type": "Offer", price: product.price_usd, priceCurrency: "USD", availability: "https://schema.org/InStock", seller: { "@type": "Person", name: OWNER.name } },
  };

  const galleryImages = (product as unknown as { media?: { id: number; media_type: string; file_path: string; caption: string }[] }).media || [];

  const quickSpecs: [string, string][] = [
    ["Software", product.software],
    ["File formats", product.file_formats],
    ["File size", product.file_size],
  ].filter(([, value]) => value) as [string, string][];

  return <article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="project-detail-hero"><div className="container">
      <nav className="store-breadcrumb" aria-label="Breadcrumb"><Link href="/3d-store/">3D Store</Link><i className="bi bi-chevron-right" />{product.category?.name ? <Link href={`/3d-store/?category=${product.category.slug}`}>{product.category.name}</Link> : <span>Uncategorized</span>}<i className="bi bi-chevron-right" /><span>{product.title}</span></nav>
      <div className="project-kicker"><span>{product.category?.name || "3D Model"}</span>{product.version && <span>v{product.version}</span>}</div>
      <h1>{product.title}</h1>
      <p>{product.short_description}</p>
    </div></section>

    <section className="section pt-0"><div className="container case-grid">
      <div>
        {product.viewer_model ? <ModelViewer src={mediaUrl(product.viewer_model)} alt={product.title} poster={product.cover_image ? mediaUrl(product.cover_image, { width: 1200 }) : undefined} />
          : product.cover_image ? <img src={mediaUrl(product.cover_image, { width: 1600, quality: 80 })} alt={product.title} className="detail-cover poster-detail-cover" />
          : <div className="showreel-empty"><i className="bi bi-box-seam" /><p>No preview available yet.</p></div>}

        {galleryImages.length > 0 && <div className="gallery-grid" style={{ marginTop: 24 }}>{galleryImages.map((item) => item.media_type === "image" ? <figure className="gallery-item landscape" key={item.id}><img src={mediaUrl(item.file_path, { width: 900, quality: 80 })} alt={item.caption || product.title} loading="lazy" /></figure> : null)}</div>}

        {product.description && <div className="case-copy" style={{ marginTop: 32 }}><section><h2>Description</h2><p style={{ whiteSpace: "pre-line" }}>{product.description}</p></section></div>}
        {product.requirements && <div className="case-copy"><section><h2>Requirements</h2><p>{product.requirements}</p></section></div>}
        {product.license && <div className="case-copy"><section><h2>License</h2><p style={{ whiteSpace: "pre-line" }}>{product.license}</p></section></div>}
      </div>

      <aside className="product-buy-panel">
        <div className="product-price-row">
          <div className="product-price"><strong>${product.price_usd.toFixed(2)}</strong>{product.price_khr > 0 && <span>{product.price_khr.toLocaleString()}៛</span>}</div>
          <div className="wishlist-button-labeled"><WishlistButton productId={product.id} initialWishlisted={wishlistIds.has(product.id)} signedIn={Boolean(customer)} /></div>
        </div>

        {quickSpecs.length > 0 && <div className="product-quick-specs">{quickSpecs.map(([label, value]) => <span key={label}><i className="bi bi-check2" />{value}</span>)}</div>}

        {error && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{error === "rate" ? "Please wait a few minutes before trying again." : "Please check your details and try again."}</div>}
        <form method="post" action="/api/store/orders/">
          <input type="hidden" name="product_id" value={product.id} />
          <input type="hidden" name="product_slug" value={product.slug} />
          <div className="form-field"><label htmlFor="customer_name">Your name</label><input className="form-control" id="customer_name" name="customer_name" defaultValue={customer?.fullName} required maxLength={120} /></div>
          <div className="form-field"><label htmlFor="customer_email">Email</label><input className="form-control" id="customer_email" name="customer_email" type="email" defaultValue={customer?.email} required /></div>
          <div className="form-field"><label htmlFor="customer_phone">Phone / Telegram (optional)</label><input className="form-control" id="customer_phone" name="customer_phone" /></div>
          <button className="btn btn-accent" type="submit" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}><i className="bi bi-bag-check" />Buy Now</button>
        </form>
        <div style={{ marginTop: 10 }}><AddToCartButton productId={product.id} labeled /></div>
        <p className="analytics-note" style={{ marginTop: 12 }}>{customer ? <>This order will be saved to your <Link href="/3d-store/account/">account</Link> automatically.</> : <>Have an account? <Link href={`/3d-store/account/login/?next=${encodeURIComponent(`/3d-store/${product.slug}/`)}`}>Sign in</Link> so this order saves to it.</>} Buying more than one model? <Link href="/3d-store/cart/">Add items to your cart</Link> and check out together.</p>

        <div className="product-trust-strip">
          <span><i className="bi bi-qr-code" />Pay securely via ABA QR</span>
          <span><i className="bi bi-person-check" />Manually reviewed before release</span>
          <span><i className="bi bi-folder2-open" />Downloads from your account, anytime</span>
        </div>

        {facts.length > 0 && <ul className="product-detail-facts">{facts.map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul>}
      </aside>
    </div></section>

    {!!related.length && <section className="section pt-0"><div className="container"><div className="section-heading"><div><p className="eyebrow">Related Models</p><h2>More from this category.</h2></div></div><div className="project-grid store-grid">{related.map((item) => <StoreProductCard product={item} signedIn={Boolean(customer)} isWishlisted={wishlistIds.has(item.id)} key={item.id} />)}</div></div></section>}

    <section className="section project-navigation"><div className="container"><div /><Link className="text-link" href="/3d-store/">All Models</Link><div /></div></section>
  </article>;
}
