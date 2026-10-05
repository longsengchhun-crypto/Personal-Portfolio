import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/site/AuthShell";
import { getCustomer } from "@/lib/customerAuth";
import { safeInternalPath } from "@/lib/safeRedirect";

export const metadata = { title: "Create account", robots: { index: false, follow: false } };

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

  return <AuthShell kicker="Client account" title="Create an account" intro="Sign up with your email or Google. You can follow every project request from one page." error={error}
    footer={<>Already have an account? <Link className="link-arrow" href={`/account/login/?next=${encodeURIComponent(next)}`}>Sign in</Link></>}>
    {googleEnabled && <>
      <a className="btn btn--glass btn--block" href={`/api/store/account/google/?next=${encodeURIComponent(next)}`}>Continue with Google</a>
      <div className="auth__divider"><span>or</span></div>
    </>}
    <form className="auth__form" method="post" action="/api/store/account/register/">
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="full_name">Full name</label><input className="input" id="full_name" name="full_name" autoComplete="name" required maxLength={120} /></div>
      <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /><span className="field__hint">At least 8 characters.</span></div>
      <button className="btn btn--primary btn--block btn--lg" type="submit">Create account</button>
    </form>
  </AuthShell>;
}
