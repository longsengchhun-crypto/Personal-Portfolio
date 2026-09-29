import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customerAuth";

export const metadata = { title: "Sign In — 3D Store" };

function safeNext(value: string | string[] | undefined) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/3d-store/") ? next : "/3d-store/account/";
}

export default async function StoreLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCustomer()) redirect(next);
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  return <section className="auth-split">
    <div className="auth-split-copy">
      <p className="eyebrow">3D Store</p>
      <h1>Welcome back.</h1>
      <p className="auth-split-lede">Sign in to see every order, track a pending payment, or download a model you already own.</p>
      <ul className="auth-benefit-list">
        <li><i className="bi bi-clock-history" /><div><strong>Full order history</strong><span>Every purchase, past and present, in one place.</span></div></li>
        <li><i className="bi bi-download" /><div><strong>Re-download anytime</strong><span>Lost the file? Get a fresh signed link in one click.</span></div></li>
      </ul>
    </div>
    <div className="auth-split-form">
      <div className="auth-card">
        <p className="eyebrow">Sign in</p>
        {params.error === "rate" && <div className="alert alert-danger">Too many attempts. Please wait about 15 minutes and try again.</div>}
        {params.error === "invalid" && <div className="alert alert-danger">Email or password is not correct.</div>}
        {params.error === "google" && <div className="alert alert-danger">Google sign-in did not complete. Please try again.</div>}
        {params.error === "google_unverified" && <div className="alert alert-danger">That Google account's email is not verified. Please use another sign-in method.</div>}
        {params.error === "google_unavailable" && <div className="alert alert-danger">Google sign-in is not configured yet. Please sign in with email instead.</div>}
        {googleEnabled && <>
          <a className="btn btn-outline-light btn-google" href={`/api/store/account/google/?next=${encodeURIComponent(next)}`} style={{ width: "100%", justifyContent: "center" }}><i className="bi bi-google" /> Continue with Google</a>
          <div className="auth-divider"><span>or</span></div>
        </>}
        <form className="inquiry-form login-form" method="post" action="/api/store/account/login/">
          <input type="hidden" name="next" value={next} />
          <div className="form-field"><label htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="form-field"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="current-password" required /></div>
          <button className="btn btn-accent" type="submit" style={{ width: "100%", justifyContent: "center" }}>Sign In</button>
        </form>
      </div>
      <p className="analytics-note" style={{ marginTop: 16, textAlign: "center" }}>New here? <Link className="text-link" href={`/3d-store/account/register/?next=${encodeURIComponent(next)}`}>Create a free account</Link></p>
    </div>
  </section>;
}
