import Link from "next/link";
import ProductRowActions from "@/components/ProductRowActions";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStoreContent } from "@/lib/data";

export const metadata = { title: "3D Store" };

const SAVED_LABELS: Record<string, string> = { categories: "Category saved." };

export default async function StoreAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin("/dashboard/store/");
  const { saved } = await searchParams;
  const { categories, products } = await getDashboardStoreContent();
  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name || "Uncategorized";

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head">
      <div><p className="eyebrow">3D Store</p><h1>Manage categories and products.</h1></div>
      <div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/"><i className="bi bi-arrow-left" />Dashboard</Link><Link className="btn btn-outline-light" href="/dashboard/store/orders/"><i className="bi bi-receipt" />Orders</Link><Link className="btn btn-accent" href="/dashboard/store/products/new/"><i className="bi bi-plus-lg" />New Product</Link></div>
    </header>

    {saved && <div className={`alert ${saved === "error" ? "alert-danger" : "alert-success"}`} role="alert">{saved === "error" ? "That change could not be saved." : SAVED_LABELS[saved] || "Saved."}</div>}

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Categories</h2></div><small>Shown as filters in the 3D Store</small></div>
      <div className="content-item-list">
        {categories.map((category) => <form key={category.id} method="post" action="/api/dashboard/store/categories/" className="content-item-form">
          <input type="hidden" name="id" value={category.id} />
          <div className="form-field"><label>Name</label><input className="form-control" name="name" defaultValue={category.name} required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={category.order} /></div>
          <div className="content-item-actions"><button className="btn btn-outline-light" type="submit" name="action" value="save">Save</button><button className="btn btn-outline-danger" type="submit" name="action" value="delete">Delete</button></div>
        </form>)}
        <form method="post" action="/api/dashboard/store/categories/" className="content-item-form is-new">
          <div className="form-field"><label>New category name</label><input className="form-control" name="name" required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={categories.length} /></div>
          <div className="content-item-actions"><button className="btn btn-accent" type="submit" name="action" value="save">Add Category</button></div>
        </form>
      </div>
    </section>

    <section className="console-panel message-board"><div className="console-panel-head"><div><span className="status-dot message-dot" /><h2>Products</h2></div><small>{products.length} product{products.length === 1 ? "" : "s"}</small></div>
      <div className="request-table-wrap"><table className="request-table"><thead><tr><th>Status</th><th>Product</th><th>Category</th><th>Price</th><th>Featured</th><th>Action</th></tr></thead><tbody>
        {products.length ? products.map((product) => <tr key={product.id}>
          <td><span className={`status-badge status-${product.status === "published" ? "accepted" : "new"}`}>{product.status[0].toUpperCase() + product.status.slice(1)}</span></td>
          <td><strong>{product.title}</strong><small>{product.short_description}</small></td>
          <td>{categoryName(product.category_id)}</td>
          <td><strong>${product.price_usd.toFixed(2)}</strong><small>{product.price_khr ? `${product.price_khr.toLocaleString()}៛` : ""}</small></td>
          <td>{product.is_featured ? <i className="bi bi-star-fill" style={{ color: "var(--accent)" }} /> : <i className="bi bi-star" />}</td>
          <td><div className="request-actions"><Link className="btn btn-accent" href={`/dashboard/store/products/${product.id}/`}>Edit</Link><ProductRowActions productId={product.id} /></div></td>
        </tr>) : <tr><td colSpan={6}><p className="empty-state">No products yet. Create your first one.</p></td></tr>}
      </tbody></table></div>
    </section>
  </div></section>;
}
