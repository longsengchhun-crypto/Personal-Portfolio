import Link from "next/link";
import DashboardConsole from "@/components/DashboardConsole";
import NotificationBanner from "@/components/NotificationBanner";
import { requireAdmin } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";
import { emailNotificationReadiness, smsNotificationsConfigured } from "@/lib/notifications";

export const metadata = { title: "Admin Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ email?: string; sms?: string; action?: string }> }) {
  await requireAdmin();
  const notification = await searchParams;
  const data = await getDashboardSnapshot();
  const emailReadiness = emailNotificationReadiness();
  const emailReady = emailReadiness.configured && emailReadiness.mode === "production";
  const smsReady = smsNotificationsConfigured();

  return <section className="dashboard-console"><div className="container">
    <header className="console-head">
      <div><p className="eyebrow">Private Studio Console</p><h1>Visitor intelligence, client messages, and project decisions.</h1></div>
      <div className="console-actions"><Link className="btn btn-outline-light" href="/dashboard/content/"><i className="bi bi-pencil-square" />Content</Link><Link className="btn btn-outline-light" href="/dashboard/store/"><i className="bi bi-box-seam" />3D Store</Link><a className="btn btn-outline-light" href="https://supabase.com/dashboard/project/dyjzccnatslknumnbplj/editor" target="_blank" rel="noreferrer"><i className="bi bi-sliders" />Supabase</a><form method="post" action="/api/dashboard/logout/"><button className="btn btn-outline-light" type="submit"><i className="bi bi-box-arrow-right" />Log Out</button></form></div>
    </header>
    <NotificationBanner emailStatus={notification.email} smsStatus={notification.sms} actionStatus={notification.action} dismissHref="/dashboard/" />

    <DashboardConsole initialData={data} emailReady={emailReady} emailReadinessMessage={emailReadiness.message} emailReadinessMode={emailReadiness.mode} smsReady={smsReady} />
  </div></section>;
}
