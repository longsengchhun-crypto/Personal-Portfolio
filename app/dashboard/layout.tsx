import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { isAdmin } from "@/lib/auth";
import "../styles/admin.css";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Signed-out visitors only ever see the login page, without the admin frame.
  if (!(await isAdmin())) return <main id="main">{children}</main>;
  return <AdminShell><main id="main" className="adm-page">{children}</main></AdminShell>;
}
