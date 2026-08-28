import Link from "next/link";
import { redirect } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getCustomerOrders } from "@/lib/data";
import { getProductDownloadLinks, mediaUrl } from "@/lib/supabase";

export const metadata = { title: "My Account — 3D Store" };

export default async function StoreAccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/3d-store/account/login/?next=/3d-store/account/");

  const orders = await getCustomerOrders(customer.id);
  const ordersWithLinks = await Promise.all(orders.map(async (order) => {
    const isPaid = order.status === "paid" || order.status === "completed";
    const downloadLinks = isPaid ? await getProductDownloadLinks(order.product.id) : [];
    return { order, downloadLinks };
  }));

  const purchasedCount = ordersWithLinks.filter((o) => o.order.status === "paid" || o.order.status === "completed").length;

  return <>
    <section className="page-hero compact dashboard-auth"><div className="container">
      <p className="eyebrow">3D Store</p>
      <h1>Welcome back, {customer.fullName.split(" ")[0] || customer.fullName}.</h1>
      <p>{customer.email} · {purchasedCount} model{purchasedCount === 1 ? "" : "s"} ready to download</p>
    </div></section>

    <section className="section pt-0"><div className="container">
      <div className="account-toolbar">
        <Link className="btn btn-outline-light" href="/3d-store/"><i className="bi bi-box-seam" /> Browse More Models</Link>
        <form method="post" action="/api/store/account/logout/"><button className="btn btn-quiet" type="submit"><i className="bi bi-box-arrow-right" /> Sign Out</button></form>
      </div>

      {ordersWithLinks.length === 0 ? <div className="empty-state portfolio-empty"><i className="bi bi-bag" /><h2>No orders yet</h2><p>Once you buy a model, it'll show up here — ready to download the moment payment is confirmed.</p><Link className="btn btn-accent" href="/3d-store/" style={{ marginTop: 14 }}>Browse the Store</Link></div> : (
        <div className="account-order-list">
          {ordersWithLinks.map(({ order, downloadLinks }) => {
            const isPaid = order.status === "paid" || order.status === "completed";
            return <article className="account-order-card" key={order.id}>
              <div className="account-order-media">
                {order.product.cover_image ? <img src={mediaUrl(order.product.cover_image, { width: 320 })} alt={order.product.title} /> : <div className="project-placeholder"><span>3D Model</span></div>}
              </div>
              <div className="account-order-body">
                <div className="account-order-head">
                  <div><h3><Link href={`/3d-store/${order.product.slug}/`}>{order.product.title}</Link></h3><p className="analytics-note">Order {order.order_number} · {new Date(order.created_at).toLocaleDateString()}</p></div>
                  <div className={`status-badge status-${isPaid ? "accepted" : order.status === "rejected" ? "declined" : "new"}`}>{ORDER_STATUS_LABELS[order.status] || order.status}</div>
                </div>

                {isPaid && (downloadLinks.length ? <ul className="content-item-list">{downloadLinks.map((link) => <li className="content-item-form" key={link.name}><strong>{link.name}</strong><div className="content-item-actions"><a className="btn btn-accent" href={link.url!} target="_blank" rel="noreferrer"><i className="bi bi-download" /> Download</a></div></li>)}</ul> : <p className="analytics-note">Files are being prepared — check back shortly.</p>)}

                {order.status === "pending_payment" && <p className="analytics-note"><Link className="text-link" href={`/3d-store/orders/${order.access_token}/`}>Complete payment</Link> to unlock your download.</p>}
                {(order.status === "payment_submitted" || order.status === "under_review") && <p className="analytics-note"><i className="bi bi-hourglass-split" /> Payment under review — usually confirmed within a day.</p>}
                {order.status === "rejected" && <p className="analytics-note" style={{ color: "var(--danger, #e5484d)" }}>Payment issue: {order.admin_notes || "please contact me directly."}</p>}
              </div>
            </article>;
          })}
        </div>
      )}
    </div></section>
  </>;
}
