import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export const metadata = { title: "Dashboard Login" };

export default async function DashboardLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (await isAdmin()) redirect("/dashboard/");
  const params = await searchParams;
  return <><section className="page-hero compact dashboard-auth"><div className="container narrow"><p className="eyebrow">Private Dashboard</p><h1>Admin access only.</h1></div></section><section className="section pt-0"><div className="container narrow"><form className="inquiry-form login-form" method="post" action="/api/dashboard/login/">{params.error && <div className="alert alert-danger">Username or password is not correct. Please check both fields and try again.</div>}<div className="form-field"><label htmlFor="username">Username</label><input className="form-control" id="username" name="username" autoComplete="username" required /></div><div className="form-field"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="current-password" required /></div><button className="btn btn-accent" type="submit">Open Dashboard</button></form></div></section></>;
}
