import Link from "next/link";
import { redirect } from "next/navigation";
import { INQUIRY_STATUS_LABELS, OWNER } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getCustomerInquiries } from "@/lib/data";

export const metadata = { title: "My Account", robots: { index: false, follow: false } };

const formatDate = (value: string) => new Date(value).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login/");
  const inquiries = await getCustomerInquiries(customer.id).catch(() => []);
  const firstName = customer.fullName.split(" ")[0] || customer.fullName;

  return <>
    <section className="page-hero compact"><div className="container">
      <p className="eyebrow">My account</p>
      <h1>Hello, {firstName}.</h1>
      <p>{customer.fullName} &middot; {customer.email}</p>
    </div></section>

    <section className="section pt-0"><div className="container st-account">
      <div className="st-account-main">
        <h2 className="st-label">Your project requests</h2>
        {inquiries.length === 0
          ? <div className="st-empty"><p>You have not sent a project request yet.</p><Link className="st-btn st-btn-solid" href="/contact/">Start a project</Link></div>
          : <ul className="st-request-list">{inquiries.map((inquiry) => <li key={inquiry.id}>
            <div className="st-request-head">
              <div><strong>{inquiry.service_needed}</strong><small>Sent {formatDate(inquiry.created_at)}{inquiry.estimated_budget ? ` · ${inquiry.estimated_budget}` : ""}</small></div>
              <span className={`status-badge status-${inquiry.status}`}>{INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status}</span>
            </div>
            <p className="st-request-body">{inquiry.project_description}</p>
            {inquiry.messages.map((message, index) => <div className="st-request-reply" key={index}><strong>{message.subject}</strong><p>{message.body}</p><time>{new Date(message.created_at).toLocaleString("en")}</time></div>)}
          </li>)}</ul>}
      </div>

      <aside className="st-account-side">
        <h2 className="st-label">Reach me directly</h2>
        <ul className="st-contact-list">
          <li><span>Project</span><Link href="/contact/">Send a new brief</Link></li>
          <li><span>Telegram</span><a href={OWNER.telegramUrl} target="_blank" rel="noreferrer">{OWNER.telegram}</a></li>
          <li><span>Phone</span><a href={`tel:${OWNER.phone}`}>{OWNER.phone}</a></li>
          <li><span>Email</span><a href={`mailto:${OWNER.email}`}>{OWNER.email}</a></li>
        </ul>
        <form method="post" action="/api/store/account/logout/"><button className="st-btn st-btn-line" type="submit">Sign out</button></form>
      </aside>
    </div></section>
  </>;
}
