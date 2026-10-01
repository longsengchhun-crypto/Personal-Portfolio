import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customerAuth";
import { safeInternalPath } from "@/lib/safeRedirect";

export const metadata = { title: "Create Account", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  taken: "That email already has an account. Try signing in instead.",
  weak: "Password must be at least 8 characters.",
  form: "Please check your details and try again.",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeInternalPath(typeof params.next === "string" ? params.next : "", "/", "/account/");
  if (await getCustomer()) redirect(next);
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);
  const error = typeof params.error === "string" ? ERRORS[params.error] : "";

  return <section className="st-auth"><div className="container st-auth-grid">
    <div>
      <p className="eyebrow">Client account</p>
      <h1 className="st-auth-title">Create an account</h1>
      <p className="st-copy">Sign up with your email or Google. I will know who I am talking to, and you can follow every project request from one page.</p>
    </div>
    <div className="st-auth-card">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {googleEnabled && <>
        <a className="st-btn st-btn-line st-btn-block" href={`/api/store/account/google/?next=${encodeURIComponent(next)}`}>Continue with Google</a>
        <div className="auth-divider"><span>or</span></div>
      </>}
      <form className="inquiry-form login-form" method="post" action="/api/store/account/register/">
        <input type="hidden" name="next" value={next} />
        <div className="form-field"><label htmlFor="full_name">Full name</label><input className="form-control" id="full_name" name="full_name" autoComplete="name" required maxLength={120} /></div>
        <div className="form-field"><label htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="form-field"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /><small>At least 8 characters.</small></div>
        <button className="st-btn st-btn-solid st-btn-block" type="submit">Create account</button>
      </form>
      <p className="st-auth-switch">Already have an account? <Link href={`/account/login/?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
    </div>
  </div></section>;
}
