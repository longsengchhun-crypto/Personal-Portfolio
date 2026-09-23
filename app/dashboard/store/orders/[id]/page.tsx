import Link from "next/link";
import { notFound } from "next/navigation";
import OrderReviewPanel from "@/components/OrderReviewPanel";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStoreOrder, getDashboardStoreOrders } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata = { title: "Order" };

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ email?: string; action?: string }> }) {
  const id = Number((await params).id);
  await requireAdmin(`/dashboard/store/orders/${id}/`);
  if (!Number.isInteger(id)) notFound();
  const order = await getDashboardStoreOrder(id);
  if (!order) notFound();
  const notification = await searchParams;

  let screenshotUrl: string | null = null;
  if (order.payment_screenshot) {
    const { data } = await getSupabaseAdmin().storage.from("product-downloads").createSignedUrl(order.payment_screenshot, 3600);
    screenshotUrl = data?.signedUrl || null;
  }

  const canReview = order.status === "payment_submitted" || order.status === "under_review";

  // A batch checkout creates one order row per product sharing one payment screenshot — approve
  // or reject here only ever affects this one row, so surface the siblings explicitly instead of
  // letting the admin assume this is a standalone, fully-handled order.
  const batchSiblings = order.batch_id ? (await getDashboardStoreOrders()).filter((o) => o.batch_id === order.batch_id && o.id !== order.id) : [];

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">Order {order.order_number}</p><h1>{order.customer_name}</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/store/orders/"><i className="bi bi-arrow-left" />Orders</Link></div></header>

    {notification.action && <div className={`alert ${notification.email === "sent" ? "alert-success" : "alert-danger"}`} role="alert">{notification.action === "approved" ? "Order approved" : "Order rejected"} — customer notification email {notification.email === "sent" ? "sent." : `${notification.email === "failed" ? "FAILED to send" : `status: ${notification.email}`} — follow up with the customer directly.`}</div>}

    <div className="inquiry-detail-layout">
      <div className="inquiry-main-column">
        <article className="console-panel inquiry-detail-card"><div className="console-panel-head"><div><span className="status-dot message-dot" /><h2>Order Details</h2></div><small>{formatDate(order.created_at)}</small></div>
          <div className="inquiry-detail-body">
            <dl className="detail-matrix">
              <div><dt>Product</dt><dd>{order.product.title}</dd></div>
              <div><dt>Amount</dt><dd>${order.price_usd.toFixed(2)}{order.price_khr > 0 ? ` · ${order.price_khr.toLocaleString()}៛` : ""}</dd></div>
              <div><dt>Customer</dt><dd>{order.customer_name}</dd></div>
              <div><dt>Email</dt><dd>{order.customer_email}</dd></div>
              <div><dt>Phone</dt><dd>{order.customer_phone || "—"}</dd></div>
              <div><dt>Payment reference</dt><dd>{order.payment_reference || "—"}</dd></div>
            </dl>
            {screenshotUrl ? <div className="message-copy"><h2>Payment Screenshot</h2><a href={screenshotUrl} target="_blank" rel="noreferrer"><img src={screenshotUrl} alt="Payment screenshot" style={{ maxWidth: 320, border: "1px solid var(--border)" }} /></a></div>
              : canReview && <div className="alert alert-danger" role="alert">No payment screenshot on file for this order — verify payment another way before approving.</div>}
          </div>
        </article>

        {batchSiblings.length > 0 && <article className="console-panel inquiry-detail-card">
          <div className="console-panel-head"><div><span className="status-dot message-dot" /><h2>Same Payment — Other Items</h2></div><small>{batchSiblings.length + 1} items total</small></div>
          <div className="inquiry-detail-body">
            <p className="analytics-note">This order shares one payment screenshot with {batchSiblings.length} other item{batchSiblings.length === 1 ? "" : "s"} from the same checkout. Approving or rejecting this order only affects this row — review each one.</p>
            <ul className="content-item-list">{batchSiblings.map((sib) => <li className="content-item-form" key={sib.id}>
              <div><strong>{sib.product_title}</strong><small style={{ display: "block", color: "var(--muted)" }}>{sib.order_number} · ${sib.price_usd.toFixed(2)}</small></div>
              <div className="content-item-actions"><span className={`status-badge status-${sib.status === "paid" || sib.status === "completed" ? "accepted" : sib.status === "rejected" ? "declined" : "new"}`}>{sib.status.replace("_", " ")}</span><Link className="btn btn-quiet" href={`/dashboard/store/orders/${sib.id}/`}>Open</Link></div>
            </li>)}</ul>
          </div>
        </article>}

        <section className="console-panel message-history"><div className="console-panel-head"><div><span className="status-dot model-dot" /><h2>Email History</h2></div><small>{order.messages?.length || 0} records</small></div>{order.messages?.length ? <ol>{order.messages.map((message) => <li key={message.id}><span className={`history-status history-${message.delivery_status}`}><i className={`bi ${message.delivery_status === "sent" ? "bi-envelope-check" : "bi-envelope-exclamation"}`} /></span><div><div className="history-heading"><strong>{message.subject || message.message_type}</strong><time>{formatDate(message.created_at)}</time></div><p>{message.body}</p><small>{message.message_type} · {message.delivery_status}</small></div></li>)}</ol> : <p className="empty-state">No emails sent yet.</p>}</section>
      </div>

      <aside className="console-panel inquiry-action-panel"><div className="console-panel-head"><div><span className="status-dot" /><h2>Review</h2></div></div>
        {canReview ? <OrderReviewPanel orderId={order.id} customerName={order.customer_name} canReview={canReview} /> : <p className="analytics-note">This order is {order.status.replace("_", " ")} — no action needed{order.status === "pending_payment" ? " until the customer submits payment." : "."}</p>}
      </aside>
    </div>
  </div></section>;
}
