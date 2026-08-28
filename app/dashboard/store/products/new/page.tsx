import Link from "next/link";
import ProductEditor from "@/components/ProductEditor";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStoreContent } from "@/lib/data";

export const metadata = { title: "New Product" };

export default async function NewProductPage() {
  await requireAdmin("/dashboard/store/products/new/");
  const { categories } = await getDashboardStoreContent();

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">3D Store</p><h1>New Product</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/store/"><i className="bi bi-arrow-left" />Store</Link></div></header>
    <ProductEditor product={null} categories={categories} />
  </div></section>;
}
