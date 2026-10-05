import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import TrafficPanel from "@/components/admin/TrafficPanel";
import { ArrowUpRight, FolderKanban, ImagePlus, Inbox, Pencil, Plus } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { getDashboardPortfolioContent, getDashboardSnapshot } from "@/lib/data";
import { emailNotificationReadiness } from "@/lib/notifications";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const when = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));

export default async function OverviewPage() {
  await requireAdmin("/dashboard/");
  const [snapshot, { projects }] = await Promise.all([getDashboardSnapshot(), getDashboardPortfolioContent()]);
  const readiness = emailNotificationReadiness();
  const emailReady = readiness.configured && readiness.mode === "production";

  const published = projects.filter((project) => project.status === "published").length;
  const drafts = projects.length - published;
  const unread = snapshot.latest_inquiries.filter((inquiry) => inquiry.status === "new").length;
  const messages = snapshot.latest_inquiries.slice(0, 5);

  // One merged timeline of what changed lately: project edits and incoming messages.
  const activity = [
    ...projects.map((project) => ({ id: `p${project.id}`, at: project.updated_at, text: `${project.status === "published" ? "Updated" : "Draft saved"}: ${project.title}`, href: `/dashboard/projects/${project.id}/` })),
    ...snapshot.latest_inquiries.map((inquiry) => ({ id: `i${inquiry.id}`, at: inquiry.created_at, text: `New message from ${inquiry.full_name}`, href: `/dashboard/messages/${inquiry.id}/` })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 7);

  return <>
    <PageHeader title="Overview" description="What needs your attention, and the fastest way to get things done." />

    <nav className="adm-quick" aria-label="Quick actions">
      <Link className="btn btn--primary" href="/dashboard/projects/new/"><Plus /> New project</Link>
      <Link className="btn btn--glass" href="/dashboard/media/?upload=1"><ImagePlus /> Upload media</Link>
      <Link className="btn btn--glass" href="/dashboard/settings/?tab=homepage"><Pencil /> Edit homepage</Link>
      <Link className="btn btn--glass" href="/dashboard/messages/"><Inbox /> View messages</Link>
      <Link className="btn btn--glass" href="/" target="_blank"><ArrowUpRight /> Open website</Link>
    </nav>

    {!emailReady && <div className="notice notice--warn adm-gap" role="status"><strong>Client emails are not fully set up.</strong><span>{readiness.mode === "testing" ? "Email is in test mode, so replies may not reach clients." : "The sender address is not valid, so replies will not be delivered."} Check the email settings on the server.</span></div>}

    <section className="adm-kpis" aria-label="Summary">
      <Link href="/dashboard/projects/" className="adm-kpi"><span className="adm-kpi__label">Projects</span><strong className="tabular">{projects.length}</strong><small>{published} published · {drafts} draft{drafts === 1 ? "" : "s"}</small></Link>
      <Link href="/dashboard/projects/?status=published" className="adm-kpi"><span className="adm-kpi__label">Published</span><strong className="tabular">{published}</strong><small>Live on the website</small></Link>
      <Link href="/dashboard/projects/?status=draft" className="adm-kpi"><span className="adm-kpi__label">Drafts</span><strong className="tabular">{drafts}</strong><small>{drafts ? "Waiting to be published" : "Nothing pending"}</small></Link>
      <Link href="/dashboard/messages/" className={`adm-kpi${unread ? " is-hot" : ""}`}><span className="adm-kpi__label">Unread messages</span><strong className="tabular">{unread}</strong><small>{unread ? "Waiting for a reply" : "You're all caught up"}</small></Link>
    </section>

    <div className="adm-split">
      <section className="adm-card" aria-labelledby="recent-messages">
        <header className="adm-card__head"><h2 id="recent-messages">Recent messages</h2><Link href="/dashboard/messages/" className="link-arrow">Open inbox</Link></header>
        {messages.length ? <ul className="adm-rows">{messages.map((inquiry) => <li key={inquiry.id}>
          <Link href={`/dashboard/messages/${inquiry.id}/`} className={`adm-row${inquiry.status === "new" ? " is-unread" : ""}`}>
            <span className="adm-row__main"><strong>{inquiry.full_name}</strong><small>{inquiry.service_needed} · {inquiry.project_description.slice(0, 70)}{inquiry.project_description.length > 70 ? "…" : ""}</small></span>
            <span className="adm-row__side"><StatusBadge status={inquiry.status} /><time className="caption" dateTime={inquiry.created_at}>{when(inquiry.created_at)}</time></span>
          </Link>
        </li>)}</ul> : <p className="adm-empty-line">No messages yet. Inquiries from the contact form will appear here.</p>}
      </section>

      <section className="adm-card" aria-labelledby="activity-heading">
        <header className="adm-card__head"><h2 id="activity-heading">Recent activity</h2></header>
        {activity.length ? <ul className="adm-activity">{activity.map((item) => <li key={item.id}><Link href={item.href}><span>{item.text}</span><time className="caption" dateTime={item.at}>{when(item.at)}</time></Link></li>)}</ul> : <p className="adm-empty-line">Nothing has changed yet.</p>}
        {projects.length === 0 && <Link href="/dashboard/projects/new/" className="btn btn--glass btn--sm"><FolderKanban /> Create your first project</Link>}
      </section>
    </div>

    <TrafficPanel initialData={snapshot} />
  </>;
}
