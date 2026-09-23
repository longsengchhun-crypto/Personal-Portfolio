import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStoreOrders } from "@/lib/data";

export const metadata = { title: "Orders" };

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));
const STATUS_TONE: Record<string, string> = { pending_payment: "new", payment_submitted: "new", under_review: "new", paid: "accepted", completed: "accepted", rejected: "declined" };
const STATUS_LABEL: Record<string, string> = { pending_payment: "Pending Payment", payment_submitted: "Payment Submitted", under_review: "Under Review", paid: "Paid", completed: "Completed", rejected: "Rejected" };

export default async function OrdersPage() {
  await requireAdmin("/dashboard/store/orders/");
  const orders = await getDashboardStoreOrders();
  const needsReview = orders.filter((o) => o.status === "payment_submitted" || o.status === "under_review");
  // One cart checkout creates one order row per product, sharing a batch_id and a single
  // payment screenshot — approving/rejecting is still per-row, so make that grouping visible
  // here rather than letting sibling items look like unrelated, separately-paid orders.
  const batchCounts = orders.reduce<Record<string, number>>((acc, o) => { if (o.batch_id) acc[o.batch_id] = (acc[o.batch_id] || 0) + 1; return acc; }, {});

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">3D Store</p><h1>Orders</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/store/"><i className="bi bi-arrow-left" />Store</Link></div></header>

    {needsReview.length > 0 && <div className="alert alert-danger" role="alert">{needsReview.length} order{needsReview.length === 1 ? "" : "s"} awaiting review.</div>}

    <section className="console-panel message-board"><div className="console-panel-head"><div><span className="status-dot message-dot" /><h2>All Orders</h2></div><small>{orders.length} order{orders.length === 1 ? "" : "s"}</small></div>
      <div className="request-table-wrap"><table className="request-table"><thead><tr><th>Status</th><th>Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th><th>Action</th></tr></thead><tbody>
        {orders.length ? orders.map((order) => <tr key={order.id}>
          <td><span className={`status-badge status-${STATUS_TONE[order.status] || "new"}`}>{STATUS_LABEL[order.status] || order.status}</span></td>
          <td><strong>{order.order_number}</strong>{order.batch_id && batchCounts[order.batch_id] > 1 && <small><i className="bi bi-link-45deg" /> 1 of {batchCounts[order.batch_id]} in this payment</small>}</td>
          <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
          <td>{order.product_title}</td>
          <td><strong>${order.price_usd.toFixed(2)}</strong></td>
          <td><time>{formatDate(order.created_at)}</time></td>
          <td><Link className="btn btn-accent" href={`/dashboard/store/orders/${order.id}/`}>Review</Link></td>
        </tr>) : <tr><td colSpan={7}><p className="empty-state">No orders yet.</p></td></tr>}
      </tbody></table></div>
    </section>
  </div></section>;
}
