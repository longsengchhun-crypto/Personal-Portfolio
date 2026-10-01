import DashboardConsole from "@/components/DashboardConsole";
import NotificationBanner from "@/components/NotificationBanner";
import { requireAdmin } from "@/lib/auth";
import { getDashboardSnapshot, getDashboardStoreOrders } from "@/lib/data";
import { emailNotificationReadiness, smsNotificationsConfigured } from "@/lib/notifications";

export const metadata = { title: "Admin Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ email?: string; sms?: string; action?: string }> }) {
  await requireAdmin();
  const notification = await searchParams;
  const [data, orders] = await Promise.all([getDashboardSnapshot(), getDashboardStoreOrders().catch(() => [])]);
  const pendingOrders = orders.filter((order) => order.status === "payment_submitted" || order.status === "under_review").length;
  const emailReadiness = emailNotificationReadiness();
  const emailReady = emailReadiness.configured && emailReadiness.mode === "production";
  const smsReady = smsNotificationsConfigured();

  return <section className="dashboard-console"><div className="container">
    <header className="console-head">
      <div><p className="eyebrow">Overview</p><h1>What needs your attention</h1></div>
    </header>
    <NotificationBanner emailStatus={notification.email} smsStatus={notification.sms} actionStatus={notification.action} dismissHref="/dashboard/" />

    <DashboardConsole initialData={data} emailReady={emailReady} emailReadinessMessage={emailReadiness.message} emailReadinessMode={emailReadiness.mode} smsReady={smsReady} pendingOrders={pendingOrders} />
  </div></section>;
}
