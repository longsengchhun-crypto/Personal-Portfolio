import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import WishlistButton from "@/components/WishlistButton";
import { mediaUrl } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export default function StoreProductCard({ product, signedIn = false, isWishlisted = false }: { product: Product; signedIn?: boolean; isWishlisted?: boolean }) {
  const href = `/3d-store/${product.slug}/`;
  const formats = product.file_formats.split(",").map((f) => f.trim()).filter(Boolean);
  const shownFormats = formats.slice(0, 3);
  const extraFormats = formats.length - shownFormats.length;
  return <article className="store-card">
    <div className="store-card-media">
      <Link href={href} className="store-card-image" aria-label={`View ${product.title}`} tabIndex={-1}>
        {product.cover_image ? <img src={mediaUrl(product.cover_image, { width: 720 })} alt={product.title} loading="lazy" decoding="async" /> : <div className="project-placeholder"><span>{product.category?.name || "3D Model"}</span></div>}
      </Link>
      <div className="store-card-chips">
        {product.is_featured && <span className="store-chip store-chip-featured"><i className="bi bi-star-fill" />Featured</span>}
        <span className="store-chip">{product.category?.name || "3D Model"}</span>
      </div>
      <WishlistButton productId={product.id} initialWishlisted={isWishlisted} signedIn={signedIn} />
    </div>
    <div className="store-card-body">
      <h3 className="store-card-title"><Link href={href}>{product.title}</Link></h3>
      {product.short_description && <p className="store-card-desc">{product.short_description}</p>}
      {shownFormats.length > 0 && <div className="store-card-formats">{shownFormats.map((f) => <span key={f}>{f}</span>)}{extraFormats > 0 && <span>+{extraFormats}</span>}</div>}
      <div className="store-card-footer">
        <div className="store-card-price"><strong>${product.price_usd.toFixed(2)}</strong>{product.price_khr > 0 && <span>{product.price_khr.toLocaleString()}៛</span>}</div>
        <AddToCartButton productId={product.id} />
      </div>
    </div>
  </article>;
}
