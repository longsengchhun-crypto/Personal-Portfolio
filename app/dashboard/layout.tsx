import AdminDropGuard from "@/components/AdminDropGuard";
import AdminSidebar from "@/components/AdminSidebar";
import { isAdmin } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) return <>{children}</>;
  return <div className="admin-shell">
    <AdminDropGuard /><AdminSidebar />
    <div className="admin-content">{children}</div>
  </div>;
}
