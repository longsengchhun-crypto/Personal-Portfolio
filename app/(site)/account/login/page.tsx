import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/site/AuthShell";
import { getCustomer } from "@/lib/customerAuth";
import { safeInternalPath } from "@/lib/safeRedirect";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  rate: "Too many attempts. Please wait about 15 minutes and try again.",
  invalid: "That email and password do not match. Check both and try again.",
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

  return <AuthShell kicker="Client account" title="Sign in" intro="Your account keeps your details and project requests in one place, so follow-ups are faster." error={error}
    footer={<>New here? <Link className="link-arrow" href={`/account/register/?next=${encodeURIComponent(next)}`}>Create an account</Link></>}>
    {googleEnabled && <>
      <a className="btn btn--glass btn--block" href={`/api/store/account/google/?next=${encodeURIComponent(next)}`}>Continue with Google</a>
      <div className="auth__divider"><span>or</span></div>
    </>}
    <form className="auth__form" method="post" action="/api/store/account/login/">
      <input type="hidden" name="next" value={next} />
      <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn btn--primary btn--block btn--lg" type="submit">Sign in</button>
    </form>
  </AuthShell>;
}
