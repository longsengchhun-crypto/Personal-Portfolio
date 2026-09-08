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
      <div><p className="eyebrow">Overview</p><h1>Visitor intelligence, client messages, and project decisions.</h1></div>
    </header>
    <NotificationBanner emailStatus={notification.email} smsStatus={notification.sms} actionStatus={notification.action} dismissHref="/dashboard/" />

    <DashboardConsole initialData={data} emailReady={emailReady} emailReadinessMessage={emailReadiness.message} emailReadinessMode={emailReadiness.mode} smsReady={smsReady} />
  </div></section>;
}
