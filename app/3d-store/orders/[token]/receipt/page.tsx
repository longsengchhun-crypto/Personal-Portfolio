import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PrintReceiptButton from "@/components/PrintReceiptButton";
import { OWNER } from "@/lib/content";
import { getOrderByToken, getSiteContext } from "@/lib/data";

export const metadata = { title: "Receipt" };

const SIGNATURE_IMAGE = "/static/site-assets/signature/signature.png";
// A dedicated square headshot crop, not the homepage's full-body cutout — that photo is
// 1355x2490, and center-cropping it into a small circle shows the torso, not the face.
const LOGO_IMAGE = "/static/site-assets/profile/headshot-square.png";

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  // A batch checkout is several order rows under one payment — the receipt is evidence of what
  // was actually paid, so it only ever lists items that are actually paid/completed, even if a
  // sibling in the same batch was rejected or is still pending.
  const allItems = [
    { id: order.id, status: order.status, price_usd: order.price_usd, price_khr: order.price_khr, product: order.product },
    ...order.batch_items,
  ];
  const paidItems = allItems.filter((item) => item.status === "paid" || item.status === "completed");
  if (!paidItems.length) redirect(`/3d-store/orders/${token}/`);

  const { site } = await getSiteContext();
  const totalUsd = paidItems.reduce((sum, item) => sum + item.price_usd, 0);
  const totalKhr = paidItems.reduce((sum, item) => sum + item.price_khr, 0);
  const paidDate = new Date(order.reviewed_at || order.created_at);

  return <section className="section receipt-page" style={{ paddingTop: 150 }}><div className="container narrow">
    <div className="receipt-toolbar no-print">
      <Link className="text-link" href={`/3d-store/orders/${token}/`}><i className="bi bi-arrow-left" /> Back to order</Link>
      <PrintReceiptButton />
    </div>

    <article className="receipt-card">
      <header className="receipt-head">
        <div className="receipt-brand">
          <img src={LOGO_IMAGE} alt="" className="receipt-logo" />
          <div>
            <strong>{OWNER.name}</strong>
            <p>{site?.location || OWNER.location}</p>
            <p>{site?.phone || OWNER.phone} · {site?.email || OWNER.email}</p>
          </div>
        </div>
        <div className="receipt-meta">
          <span className="receipt-badge">Receipt for {order.order_number}</span>
          <p>Paid on {paidDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </header>

      <div className="receipt-parties">
        <div>
          <p className="receipt-label">Billed To</p>
          <strong>{order.customer_name}</strong>
          <p>{order.customer_email}</p>
        </div>
        <div>
          <p className="receipt-label">Payment Method</p>
          <strong>ABA Bank (QR Payment)</strong>
          <p>{order.payment_reference ? `Ref: ${order.payment_reference}` : "—"}</p>
        </div>
      </div>

      <table className="receipt-table">
        <thead><tr><th>Product / Service</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          {paidItems.map((item) => <tr key={item.id}>
            <td>{item.product.title}</td>
            <td>1</td>
            <td>${item.price_usd.toFixed(2)}</td>
            <td>${item.price_usd.toFixed(2)}</td>
          </tr>)}
        </tbody>
      </table>

      <div className="receipt-total-row">
        <div>
          <p className="receipt-label">Total Paid</p>
          <strong className="receipt-total-amount">${totalUsd.toFixed(2)}{totalKhr > 0 ? ` · ${totalKhr.toLocaleString()}៛` : ""}</strong>
        </div>
      </div>

      <footer className="receipt-footer">
        <div>
          <p>Thank you for your purchase!</p>
          <p className="receipt-label">This receipt confirms payment has been received and verified.</p>
        </div>
        <div className="receipt-signature">
          <img src={SIGNATURE_IMAGE} alt={`${OWNER.name} signature`} />
          <strong>{OWNER.name}</strong>
          <p>{OWNER.title}</p>
        </div>
      </footer>
    </article>
  </div></section>;
}
