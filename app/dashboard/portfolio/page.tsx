import Link from "next/link";
import ProjectQuickRow from "@/components/ProjectQuickRow";
import QuickProjectUpload from "@/components/QuickProjectUpload";
import { requireAdmin } from "@/lib/auth";
import { getDashboardPortfolioContent } from "@/lib/data";

export const metadata = { title: "Portfolio" };

const SAVED_LABELS: Record<string, string> = { category: "Category saved." };

export default async function PortfolioAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin("/dashboard/portfolio/");
  const { saved } = await searchParams;
  const { categories, projects } = await getDashboardPortfolioContent();
  const categoryName = (id: number | null) => categories.find((c) => c.id === id)?.name || "Uncategorized";

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head">
      <div><p className="eyebrow">Portfolio</p><h1>Manage categories and projects.</h1></div>
      <div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/"><i className="bi bi-arrow-left" />Dashboard</Link><Link className="btn btn-outline-light" href="/dashboard/content/"><i className="bi bi-camera-reels" />Showreel Video</Link><Link className="btn btn-outline-light" href="/dashboard/portfolio/new/"><i className="bi bi-plus-lg" />Detailed Project</Link></div>
    </header>

    {saved && <div className={`alert ${saved === "error" ? "alert-danger" : "alert-success"}`} role="alert">{saved === "error" ? "That change could not be saved." : SAVED_LABELS[saved] || "Saved."}</div>}

    <QuickProjectUpload categories={categories} />

    <section className="console-panel content-editor-panel">
      <div className="console-panel-head"><div><span className="status-dot" /><h2>Categories</h2></div><small>Shown as filters on the Work page</small></div>
      <div className="content-item-list">
        {categories.map((category) => <form key={category.id} method="post" action="/api/dashboard/portfolio/categories/" className="content-item-form">
          <input type="hidden" name="id" value={category.id} />
          <div className="form-field"><label>Name</label><input className="form-control" name="name" defaultValue={category.name} required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={category.order} /></div>
          <div className="content-item-actions"><button className="btn btn-outline-light" type="submit" name="action" value="save">Save</button><button className="btn btn-outline-danger" type="submit" name="action" value="delete">Delete</button></div>
        </form>)}
        <form method="post" action="/api/dashboard/portfolio/categories/" className="content-item-form is-new">
          <div className="form-field"><label>New category name</label><input className="form-control" name="name" required /></div>
          <div className="form-field"><label>Order</label><input className="form-control" type="number" name="order" min={0} defaultValue={categories.length} /></div>
          <div className="content-item-actions"><button className="btn btn-accent" type="submit" name="action" value="save">Add Category</button></div>
        </form>
      </div>
    </section>

    <section className="console-panel message-board"><div className="console-panel-head"><div><span className="status-dot message-dot" /><h2>Projects</h2></div><small>{projects.length} project{projects.length === 1 ? "" : "s"}</small></div>
      <div className="request-table-wrap"><table className="request-table"><thead><tr><th></th><th>Title</th><th>Status</th><th>Featured</th><th>Action</th></tr></thead><tbody>
        {projects.length ? projects.map((project) => <ProjectQuickRow key={project.id} project={project} categoryName={categoryName(project.category_id)} />) : <tr><td colSpan={5}><p className="empty-state">No projects yet. Drop your first poster above.</p></td></tr>}
      </tbody></table></div>
    </section>
  </div></section>;
}
