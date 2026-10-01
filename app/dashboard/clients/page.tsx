import { requireAdmin } from "@/lib/auth";
import { INQUIRY_STATUS_LABELS } from "@/lib/content";
import { getDashboardClients } from "@/lib/data";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Phnom_Penh" }).format(new Date(value));

export default async function DashboardClientsPage() {
  await requireAdmin("/dashboard/clients/");
  const clients = await getDashboardClients().catch(() => null);

  return <section className="dashboard-console"><div className="container">
    <header className="console-head"><div><p className="eyebrow">Daily operations</p><h1>Clients</h1></div></header>
    <section className="ad-panel" aria-labelledby="clients-heading">
      <div className="ad-panel-head"><h2 id="clients-heading">Registered accounts</h2><span className="live-refresh-state">{clients ? `${clients.length} total` : ""}</span></div>
      {clients === null ? <p className="empty-state">Could not load clients. Please refresh the page.</p> : clients.length === 0 ? <p className="empty-state">Nobody has created an account yet.</p> :
        <div className="request-table-wrap"><table className="request-table"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Requests</th><th>Latest</th></tr></thead><tbody>{clients.map((client) => <tr key={client.id}>
          <td><strong>{client.full_name}</strong></td>
          <td><a href={`mailto:${client.email}`}>{client.email}</a></td>
          <td><time dateTime={client.created_at}>{formatDate(client.created_at)}</time></td>
          <td>{client.inquiry_count}</td>
          <td>{client.last_status ? <><span className={`status-badge status-${client.last_status}`}>{INQUIRY_STATUS_LABELS[client.last_status] || client.last_status}</span>{client.last_inquiry_at && <small> {formatDate(client.last_inquiry_at)}</small>}</> : <small>No requests</small>}</td>
        </tr>)}</tbody></table></div>}
    </section>
  </div></section>;
}
