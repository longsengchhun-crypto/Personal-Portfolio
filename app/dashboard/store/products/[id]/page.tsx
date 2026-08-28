import Link from "next/link";
import { notFound } from "next/navigation";
import ProductEditor from "@/components/ProductEditor";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStoreContent, getDashboardStoreProduct } from "@/lib/data";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  await requireAdmin(`/dashboard/store/products/${id}/`);
  if (!Number.isInteger(id)) notFound();
  const [{ categories }, product] = await Promise.all([getDashboardStoreContent(), getDashboardStoreProduct(id)]);
  if (!product) notFound();

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">3D Store</p><h1>{product.title}</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/store/"><i className="bi bi-arrow-left" />Store</Link></div></header>
    <ProductEditor product={product} categories={categories} />
  </div></section>;
}
