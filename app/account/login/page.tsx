import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customerAuth";
import { safeInternalPath } from "@/lib/safeRedirect";

export const metadata = { title: "Sign In", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  rate: "Too many attempts. Please wait about 15 minutes and try again.",
  invalid: "Email or password is not correct.",
  google: "Google sign-in did not complete. Please try again.",
  google_unverified: "That Google account's email is not verified. Please use another sign-in method.",
  google_unavailable: "Google sign-in is not available right now. Please sign in with email.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeInternalPath(typeof params.next === "string" ? params.next : "", "/", "/account/");
  if (await getCustomer()) redirect(next);
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);
  const error = typeof params.error === "string" ? ERRORS[params.error] : "";

  return <section className="st-auth"><div className="container st-auth-grid">
    <div>
      <p className="eyebrow">Client account</p>
      <h1 className="st-auth-title">Sign in</h1>
      <p className="st-copy">Your account keeps your details and project requests in one place, so I can follow up with you faster.</p>
    </div>
    <div className="st-auth-card">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {googleEnabled && <>
        <a className="st-btn st-btn-line st-btn-block" href={`/api/store/account/google/?next=${encodeURIComponent(next)}`}>Continue with Google</a>
        <div className="auth-divider"><span>or</span></div>
      </>}
      <form className="inquiry-form login-form" method="post" action="/api/store/account/login/">
        <input type="hidden" name="next" value={next} />
        <div className="form-field"><label htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="form-field"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="st-btn st-btn-solid st-btn-block" type="submit">Sign in</button>
      </form>
      <p className="st-auth-switch">New here? <Link href={`/account/register/?next=${encodeURIComponent(next)}`}>Create an account</Link></p>
    </div>
  </div></section>;
}
