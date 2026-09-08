import Link from "next/link";
import { redirect } from "next/navigation";
import { INQUIRY_STATUS_LABELS, ORDER_STATUS_LABELS } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getCustomerInquiries, getCustomerOrders } from "@/lib/data";
import { getProductDownloadLinks, mediaUrl } from "@/lib/supabase";

export const metadata = { title: "Client Studio" };

type NextAction = { key: string; icon: string; text: string; href?: string; linkLabel?: string; tone: "action" | "waiting" | "issue" | "good" };

export default async function ClientStudioPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/3d-store/account/login/?next=/3d-store/account/");

  const [orders, inquiries] = await Promise.all([getCustomerOrders(customer.id), getCustomerInquiries(customer.id)]);
  const ordersWithLinks = await Promise.all(orders.map(async (order) => {
    const isPaid = order.status === "paid" || order.status === "completed";
    const downloadLinks = isPaid ? await getProductDownloadLinks(order.product.id) : [];
    return { order, downloadLinks };
  }));

  const purchasedCount = ordersWithLinks.filter((o) => o.order.status === "paid" || o.order.status === "completed").length;
  const pendingOrderCount = ordersWithLinks.filter((o) => o.order.status === "pending_payment" || o.order.status === "payment_submitted" || o.order.status === "under_review").length;
  const totalSpent = ordersWithLinks.filter((o) => o.order.status === "paid" || o.order.status === "completed").reduce((sum, o) => sum + o.order.price_usd, 0);
  const initials = customer.fullName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

  // Built entirely from real order/inquiry state — nothing here is a placeholder or a
  // fabricated "next step"; if there's nothing that actually needs attention, none render.
  const actions: NextAction[] = [];
  for (const { order } of ordersWithLinks) {
    if (order.status === "pending_payment") actions.push({ key: `order-${order.id}`, icon: "bi-qr-code", text: `Complete payment for "${order.product.title}"`, href: `/3d-store/orders/${order.access_token}/`, linkLabel: "Pay now", tone: "action" });
    else if (order.status === "rejected") actions.push({ key: `order-${order.id}`, icon: "bi-exclamation-triangle", text: `Payment issue on "${order.product.title}"${order.admin_notes ? `: ${order.admin_notes}` : ""}`, href: `/3d-store/orders/${order.access_token}/`, linkLabel: "Review", tone: "issue" });
    else if (order.status === "payment_submitted" || order.status === "under_review") actions.push({ key: `order-${order.id}`, icon: "bi-hourglass-split", text: `Payment for "${order.product.title}" is being reviewed — usually within a day`, tone: "waiting" });
  }
  for (const inquiry of inquiries) {
    if (inquiry.status === "new" || inquiry.status === "reviewing") actions.push({ key: `inquiry-${inquiry.id}`, icon: "bi-hourglass-split", text: `Your "${inquiry.service_needed}" request is being reviewed`, tone: "waiting" });
    else if (inquiry.status === "replied") actions.push({ key: `inquiry-${inquiry.id}`, icon: "bi-chat-left-text", text: `You have a reply on your "${inquiry.service_needed}" request`, href: "#service-requests", linkLabel: "Read reply", tone: "action" });
    else if (inquiry.status === "accepted") actions.push({ key: `inquiry-${inquiry.id}`, icon: "bi-check-circle", text: `Your "${inquiry.service_needed}" request was accepted — I'll be in touch to arrange next steps`, tone: "good" });
  }

  return <>
    <section className="page-hero compact dashboard-auth"><div className="container">
      <div className="account-hero-head">
        <div className="account-avatar" aria-hidden="true">{initials}</div>
        <div><p className="eyebrow">Client Studio</p><h1>Welcome back, {customer.fullName.split(" ")[0] || customer.fullName}.</h1><p>{customer.email}</p></div>
      </div>
      <div className="account-stat-row">
        <article><span>Models Owned</span><strong>{purchasedCount}</strong></article>
        <article><span>Pending</span><strong>{pendingOrderCount}</strong></article>
        <article><span>Total Spent</span><strong>${totalSpent.toFixed(2)}</strong></article>
        <article><span>Service Requests</span><strong>{inquiries.length}</strong></article>
      </div>
    </div></section>

    <section className="section pt-0"><div className="container">
      <div className="account-toolbar">
        <Link className="btn btn-outline-light" href="/3d-store/"><i className="bi bi-box-seam" /> Browse More Models</Link>
        <Link className="btn btn-outline-light" href="/contact/"><i className="bi bi-send" /> Start a New Project</Link>
        <form method="post" action="/api/store/account/logout/"><button className="btn btn-quiet" type="submit"><i className="bi bi-box-arrow-right" /> Sign Out</button></form>
      </div>

      {actions.length > 0 && <div className="console-panel studio-actions-panel" style={{ marginBottom: 40 }}>
        <div className="console-panel-head"><div><span className="status-dot" /><h2>What needs your attention</h2></div></div>
        <ul className="studio-action-list">{actions.map((action) => <li className={`studio-action studio-action-${action.tone}`} key={action.key}>
          <i className={`bi ${action.icon}`} />
          <span>{action.text}</span>
          {action.href && <Link className="btn btn-accent" href={action.href}>{action.linkLabel}</Link>}
        </li>)}</ul>
      </div>}

      <h2 className="studio-section-title">3D Model Orders</h2>
      {ordersWithLinks.length === 0 ? <div className="empty-state portfolio-empty"><i className="bi bi-bag" /><h3>No orders yet</h3><p>Once you buy a model, it&apos;ll show up here — ready to download the moment payment is confirmed.</p><Link className="btn btn-accent" href="/3d-store/" style={{ marginTop: 14 }}>Browse the Store</Link></div> : (
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
                {order.status === "rejected" && <p className="analytics-note" style={{ color: "var(--danger)" }}>Payment issue: {order.admin_notes || "please contact me directly."}</p>}
              </div>
            </article>;
          })}
        </div>
      )}

      <h2 className="studio-section-title" id="service-requests">Service Requests</h2>
      {inquiries.length === 0 ? <div className="empty-state portfolio-empty"><i className="bi bi-send" /><h3>No project requests yet</h3><p>Send a project brief and track its status here — no more wondering if it arrived.</p><Link className="btn btn-accent" href="/contact/" style={{ marginTop: 14 }}>Start a Project</Link></div> : (
        <div className="account-order-list">
          {inquiries.map((inquiry) => <article className="account-order-card studio-inquiry-card" key={inquiry.id}>
            <div className="account-order-body" style={{ gridColumn: "1 / -1" }}>
              <div className="account-order-head">
                <div><h3>{inquiry.service_needed}</h3><p className="analytics-note">Submitted {new Date(inquiry.created_at).toLocaleDateString()}{inquiry.estimated_budget ? ` · ${inquiry.estimated_budget}` : ""}</p></div>
                <div className={`status-badge status-${inquiry.status === "accepted" ? "accepted" : inquiry.status === "declined" ? "declined" : "new"}`}>{INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}</div>
              </div>
              <p style={{ color: "var(--muted)", whiteSpace: "pre-line" }}>{inquiry.project_description}</p>
              {inquiry.messages.length > 0 && <ul className="message-history studio-message-history">{inquiry.messages.map((message, index) => <li key={index}><div><strong>{message.subject}</strong><p style={{ whiteSpace: "pre-line" }}>{message.body}</p><time>{new Date(message.created_at).toLocaleString()}</time></div></li>)}</ul>}
            </div>
          </article>)}
        </div>
      )}
    </div></section>
  </>;
}
