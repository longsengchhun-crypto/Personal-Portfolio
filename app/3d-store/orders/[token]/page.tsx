import { after } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import PaymentProofForm from "@/components/PaymentProofForm";
import { ORDER_STATUS_LABELS } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getOrderByToken, getSiteContext } from "@/lib/data";
import { getProductDownloadLinks, getSupabase, mediaUrl } from "@/lib/supabase";

export const metadata = { title: "Order Status" };

const STATUS_LABELS = ORDER_STATUS_LABELS;

export default async function OrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [order, customer] = await Promise.all([getOrderByToken(token), getCustomer()]);
  if (!order) notFound();

  if (customer) {
    // Best-effort: link this order to the signed-in account so it shows up in "My Orders".
    // The RPC only attaches when the order has no owner yet, so this is safe to call every visit.
    after(async () => {
      await getSupabase().rpc("attach_order_customer", { p_access_token: token, p_customer_id: customer.id });
    });
  }

  const { site } = await getSiteContext();
  const isPaid = order.status === "paid" || order.status === "completed";
  const isBatch = order.batch_items.length > 0;

  // A batch checkout still creates one ordinary order row per product — combine the row this
  // page was opened with plus its siblings into one list so a multi-item order renders as a
  // single coherent order instead of pretending it's just the one item in the URL.
  const allItems = [
    { id: order.id, status: order.status, price_usd: order.price_usd, price_khr: order.price_khr, product: order.product },
    ...order.batch_items,
  ];
  const totalUsd = allItems.reduce((sum, item) => sum + item.price_usd, 0);
  const totalKhr = allItems.reduce((sum, item) => sum + item.price_khr, 0);
  const anyPending = allItems.some((item) => item.status === "pending_payment");
  const anyReviewing = allItems.some((item) => item.status === "payment_submitted" || item.status === "under_review");
  const anyRejected = allItems.some((item) => item.status === "rejected");

  const downloadLinksByItem = await Promise.all(allItems.map(async (item) => ({
    item,
    links: (item.status === "paid" || item.status === "completed") ? await getProductDownloadLinks(item.product.id) : [],
  })));

  return <section className="section" style={{ paddingTop: 150 }}><div className="container narrow">
    {customer ? <p className="analytics-note" style={{ marginBottom: 10 }}><Link className="text-link" href="/3d-store/account/">View all your orders</Link></p>
      : <div className="alert alert-success" role="status" style={{ marginBottom: 18 }}>Bookmark this page, or <Link href={`/3d-store/account/register/?next=${encodeURIComponent(`/3d-store/orders/${token}/`)}`}>create a free account</Link> to see every order and download in one place, anytime.</div>}
    <p className="eyebrow">Order {order.order_number}{isBatch && ` · ${allItems.length} items`}</p>
    <h1>{isBatch ? "Your order" : order.product.title}</h1>
    {!isBatch && <div className={`status-badge status-${isPaid ? "accepted" : order.status === "rejected" ? "declined" : "new"}`} style={{ marginTop: 8, marginBottom: 26 }}>{STATUS_LABELS[order.status] || order.status}</div>}

    <div className="inquiry-form" style={{ marginBottom: 26 }}>
      {isBatch ? <ul className="content-item-list" style={{ margin: 0 }}>{allItems.map((item) => <li className="content-item-form" key={item.id}><div><strong>{item.product.title}</strong><small style={{ display: "block", color: "var(--muted)" }}>${item.price_usd.toFixed(2)}{item.price_khr > 0 ? ` · ${item.price_khr.toLocaleString()}៛` : ""}</small></div><div className={`status-badge status-${item.status === "paid" || item.status === "completed" ? "accepted" : item.status === "rejected" ? "declined" : "new"}`}>{STATUS_LABELS[item.status] || item.status}</div></li>)}</ul>
        : <div className="form-grid">
          <div className="form-field"><label>Product</label><strong>{order.product.title}</strong></div>
          <div className="form-field"><label>Price</label><strong>${order.price_usd.toFixed(2)}{order.price_khr > 0 ? ` · ${order.price_khr.toLocaleString()}៛` : ""}</strong></div>
          <div className="form-field"><label>Customer</label><strong>{order.customer_name}</strong></div>
          <div className="form-field"><label>Email</label><strong>{order.customer_email}</strong></div>
        </div>}
      {isBatch && <div className="form-grid" style={{ marginTop: 18 }}>
        <div className="form-field"><label>Total</label><strong>${totalUsd.toFixed(2)}{totalKhr > 0 ? ` · ${totalKhr.toLocaleString()}៛` : ""}</strong></div>
        <div className="form-field"><label>Customer</label><strong>{order.customer_name}</strong></div>
        <div className="form-field"><label>Email</label><strong>{order.customer_email}</strong></div>
      </div>}
    </div>

    {anyPending && <>
      {site?.aba_qr_image ? <div className="inquiry-form" style={{ textAlign: "center", marginBottom: 26 }}>
        <p className="eyebrow">Scan to Pay</p>
        <img src={mediaUrl(site.aba_qr_image, { width: 400 })} alt="ABA QR code" style={{ maxWidth: 260, margin: "0 auto", display: "block" }} />
        {site.aba_account_info && <p style={{ whiteSpace: "pre-line", marginTop: 14, color: "var(--muted)" }}>{site.aba_account_info}</p>}
        {isBatch && <p className="analytics-note" style={{ marginTop: 10 }}>One payment reference/screenshot covers every item in this order.</p>}
      </div> : <p className="analytics-note">Payment QR is not configured yet — please contact me directly to arrange payment.</p>}
      <PaymentProofForm accessToken={token} />
    </>}

    {!anyPending && anyReviewing && <div className="empty-state"><i className="bi bi-hourglass-split" /><p>Your payment is under review. You'll receive an email as soon as it's confirmed — usually within a day.</p></div>}

    {anyRejected && <div className="alert alert-danger"><strong>There was an issue with {isBatch ? "at least one item in your payment" : "your payment"}.</strong>{order.admin_notes && <p style={{ marginTop: 8, marginBottom: 0 }}>{order.admin_notes}</p>}<p style={{ marginTop: 8, marginBottom: 0 }}>Contact me directly if you believe this is a mistake.</p></div>}

    {downloadLinksByItem.some(({ links }) => links.length > 0 || allItems.find((i) => i.status === "paid" || i.status === "completed")) && <div className="inquiry-form">
      <p className="eyebrow">Your Files</p>
      {downloadLinksByItem.map(({ item, links }) => {
        const itemPaid = item.status === "paid" || item.status === "completed";
        if (!itemPaid) return null;
        return <div key={item.id} style={{ marginBottom: 14 }}>
          {isBatch && <strong style={{ display: "block", marginBottom: 6 }}>{item.product.title}</strong>}
          {links.length ? <ul className="content-item-list">{links.map((link) => <li className="content-item-form" key={link.name}><strong>{link.name}</strong><div className="content-item-actions"><a className="btn btn-accent" href={link.url!} target="_blank" rel="noreferrer">Download</a></div></li>)}</ul> : <p className="analytics-note">Files are being prepared — check back shortly or contact me directly.</p>}
        </div>;
      })}
      <small className="analytics-note">Download links expire after 1 hour for security. Revisit this page anytime to get fresh links.</small>
    </div>}

    <p style={{ marginTop: 26 }}><Link className="text-link" href="/3d-store/">Back to 3D Store</Link></p>
  </div></section>;
}
