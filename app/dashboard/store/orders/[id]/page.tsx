import Link from "next/link";
import { notFound } from "next/navigation";
import OrderReviewPanel from "@/components/OrderReviewPanel";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStoreOrder } from "@/lib/data";
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

  return <section className="dashboard-console"><div className="container">
    <header className="console-head compact-console-head"><div><p className="eyebrow">Order {order.order_number}</p><h1>{order.customer_name}</h1></div><div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/store/orders/"><i className="bi bi-arrow-left" />Orders</Link></div></header>

    {notification.action && <div className="alert alert-success" role="alert">{notification.action === "approved" ? "Order approved" : "Order rejected"} — customer email: {notification.email}.</div>}

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
            {screenshotUrl && <div className="message-copy"><h2>Payment Screenshot</h2><a href={screenshotUrl} target="_blank" rel="noreferrer"><img src={screenshotUrl} alt="Payment screenshot" style={{ maxWidth: 320, border: "1px solid var(--border)" }} /></a></div>}
          </div>
        </article>

        <section className="console-panel message-history"><div className="console-panel-head"><div><span className="status-dot model-dot" /><h2>Email History</h2></div><small>{order.messages?.length || 0} records</small></div>{order.messages?.length ? <ol>{order.messages.map((message) => <li key={message.id}><span className={`history-status history-${message.delivery_status}`}><i className={`bi ${message.delivery_status === "sent" ? "bi-envelope-check" : "bi-envelope-exclamation"}`} /></span><div><div className="history-heading"><strong>{message.subject || message.message_type}</strong><time>{formatDate(message.created_at)}</time></div><p>{message.body}</p><small>{message.message_type} · {message.delivery_status}</small></div></li>)}</ol> : <p className="empty-state">No emails sent yet.</p>}</section>
      </div>

      <aside className="console-panel inquiry-action-panel"><div className="console-panel-head"><div><span className="status-dot" /><h2>Review</h2></div></div>
        {canReview ? <OrderReviewPanel orderId={order.id} customerName={order.customer_name} canReview={canReview} /> : <p className="analytics-note">This order is {order.status.replace("_", " ")} — no action needed{order.status === "pending_payment" ? " until the customer submits payment." : "."}</p>}
      </aside>
    </div>
  </div></section>;
}
