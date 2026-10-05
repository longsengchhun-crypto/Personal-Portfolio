import { redirect } from "next/navigation";
import AuthShell from "@/components/site/AuthShell";
import { isAdmin } from "@/lib/auth";
import { safeInternalPath } from "@/lib/safeRedirect";

export const metadata = { title: "Sign in" };

export default async function DashboardLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeInternalPath(typeof params.next === "string" ? params.next : "", "/dashboard/", "");
  if (await isAdmin()) redirect(next || "/dashboard/");
  const error = params.error === "rate" ? "Too many sign-in attempts. Please wait about 15 minutes and try again." : params.error === "1" ? "That username and password don't match. Check both and try again." : "";

  return <AuthShell kicker="Private studio" title="Admin sign in" intro="Manage projects, media, services and messages." error={error}>
    <form className="auth__form" method="post" action="/api/dashboard/login/">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="field"><label htmlFor="username">Username</label><input className="input" id="username" name="username" autoComplete="username" required autoFocus /></div>
      <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn btn--primary btn--block btn--lg" type="submit">Sign in</button>
    </form>
  </AuthShell>;
}
