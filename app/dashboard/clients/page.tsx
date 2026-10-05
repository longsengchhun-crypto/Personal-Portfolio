import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Users } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { getDashboardClients } from "@/lib/data";

export const metadata = { title: "Client accounts" };
export const dynamic = "force-dynamic";

const date = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));

export default async function ClientsPage() {
  await requireAdmin("/dashboard/clients/");
  const clients = await getDashboardClients().catch(() => null);
  return <>
    <PageHeader eyebrow="Messages" title="Client accounts" description="People who created an account before sending a brief." actions={<Link className="btn btn--glass" href="/dashboard/messages/">Back to inbox</Link>} />
    {clients === null
      ? <div className="notice notice--error" role="alert"><span>Client accounts could not be loaded. This is usually a brief connection problem. Refresh the page to try again.</span></div>
      : clients.length === 0
        ? <EmptyState icon={<Users />} title="No client accounts yet">When someone signs up on the site, they'll appear here with their request history.</EmptyState>
        : <section className="adm-card adm-card--flush"><div className="adm-table-wrap"><table className="adm-table">
          <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Joined</th><th scope="col">Requests</th><th scope="col">Latest</th></tr></thead>
          <tbody>{clients.map((client) => <tr key={client.id}>
            <td><strong>{client.full_name}</strong></td>
            <td><a href={`mailto:${client.email}`}>{client.email}</a></td>
            <td><time dateTime={client.created_at}>{date(client.created_at)}</time></td>
            <td className="tabular">{client.inquiry_count}</td>
            <td>{client.last_status ? <span className="adm-inline"><StatusBadge status={client.last_status} />{client.last_inquiry_at && <span className="caption">{date(client.last_inquiry_at)}</span>}</span> : <span className="caption">No requests</span>}</td>
          </tr>)}</tbody>
        </table></div></section>}
  </>;
}
