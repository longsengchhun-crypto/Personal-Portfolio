import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OWNER } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";
import { getCustomerInquiries } from "@/lib/data";

export const metadata = { title: "Your account", robots: { index: false, follow: false } };

const date = (value: string) => new Date(value).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login/");
  const inquiries = await getCustomerInquiries(customer.id).catch(() => []);
  const firstName = customer.fullName.split(" ")[0] || customer.fullName;

  return <>
    <header className="page-head wrap">
      <p className="meta meta--accent">Your account</p>
      <h1 className="display page-head__title">Hello, {firstName}.</h1>
      <p className="lede">{customer.fullName} · {customer.email}</p>
    </header>

    <section className="wrap account">
      <div>
        <h2 className="meta">Your project requests</h2>
        {inquiries.length === 0
          ? <EmptyState icon={<Inbox />} title="No requests yet" action={<Link className="btn btn--primary" href="/contact/">Start a project</Link>}>When you send a brief, it will appear here along with any replies.</EmptyState>
          : <ul className="requests">{inquiries.map((inquiry) => <li key={inquiry.id}>
            <div className="requests__head">
              <div><strong>{inquiry.service_needed}</strong><span className="caption">Sent {date(inquiry.created_at)}{inquiry.estimated_budget ? ` · ${inquiry.estimated_budget}` : ""}</span></div>
              <StatusBadge status={inquiry.status} />
            </div>
            <p className="requests__body">{inquiry.project_description}</p>
            {inquiry.messages.map((message, index) => <div className="requests__reply" key={index}><strong>{message.subject}</strong><p>{message.body}</p><time className="caption" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString("en")}</time></div>)}
          </li>)}</ul>}
      </div>
      <aside className="account__side">
        <h2 className="meta">Reach me directly</h2>
        <ul className="contact__direct">
          <li><span className="meta">New brief</span><Link href="/contact/">Send a project request</Link></li>
          <li><span className="meta">Telegram</span><a href={OWNER.telegramUrl} target="_blank" rel="noreferrer">{OWNER.telegram}</a></li>
          <li><span className="meta">Email</span><a href={`mailto:${OWNER.email}`}>{OWNER.email}</a></li>
        </ul>
        <form method="post" action="/api/store/account/logout/"><button className="btn btn--glass" type="submit">Sign out</button></form>
      </aside>
    </section>
  </>;
}
