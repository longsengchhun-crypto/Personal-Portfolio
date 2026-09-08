import Link from "next/link";
import { mediaUrl } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export default function StoreProductCard({ product }: { product: Product }) {
  const href = `/3d-store/${product.slug}/`;
  const formats = product.file_formats.split(",").map((f) => f.trim()).filter(Boolean).slice(0, 4);
  return <article className="project-card store-product-card reveal">
    <Link href={href} className="project-media" aria-label={`View ${product.title}`}>
      {product.cover_image ? <img src={mediaUrl(product.cover_image, { width: 640 })} alt={product.title} loading="lazy" decoding="async" /> : <div className="project-placeholder"><span>{product.category?.name || "3D Model"}</span></div>}
    </Link>
    <div className="project-card-body">
      <div className="project-meta"><span>{product.category?.name || "Uncategorized"}</span></div>
      {product.is_featured && <div className="card-badge-row"><span className="card-badge card-badge-accent"><i className="bi bi-star-fill" />Featured</span></div>}
      <h3><Link href={href}>{product.title}</Link></h3>
      <p>{product.short_description}</p>
      {formats.length > 0 && <div className="product-format-tags">{formats.map((f) => <span key={f}>{f}</span>)}</div>}
      <div className="product-price"><strong>${product.price_usd.toFixed(2)}</strong>{product.price_khr > 0 && <span>{product.price_khr.toLocaleString()}៛</span>}</div>
      <Link className="text-link" href={href}>View Model</Link>
    </div>
  </article>;
}
