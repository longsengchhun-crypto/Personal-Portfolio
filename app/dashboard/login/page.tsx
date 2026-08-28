import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export const metadata = { title: "Dashboard Login" };

function safeNext(value: string | string[] | undefined) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/dashboard/") ? next : "";
}

export default async function DashboardLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await isAdmin()) redirect(next || "/dashboard/");
  return <><section className="page-hero compact dashboard-auth"><div className="container narrow"><p className="eyebrow">Private Dashboard</p><h1>Admin access only.</h1></div></section><section className="section pt-0"><div className="container narrow"><form className="inquiry-form login-form" method="post" action="/api/dashboard/login/">{params.error === "rate" && <div className="alert alert-danger">Too many login attempts. Please wait about 15 minutes and try again.</div>}{params.error === "1" && <div className="alert alert-danger">Username or password is not correct. Please check both fields and try again.</div>}{next && <input type="hidden" name="next" value={next} />}<div className="form-field"><label htmlFor="username">Username</label><input className="form-control" id="username" name="username" autoComplete="username" required /></div><div className="form-field"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="current-password" required /></div><button className="btn btn-accent" type="submit">Open Dashboard</button></form></div></section></>;
}
