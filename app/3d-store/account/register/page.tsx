import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customerAuth";

export const metadata = { title: "Create Account — 3D Store" };

function safeNext(value: string | string[] | undefined) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/3d-store/") ? next : "/3d-store/account/";
}

export default async function StoreRegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCustomer()) redirect(next);

  return <>
    <section className="page-hero compact dashboard-auth"><div className="container narrow">
      <p className="eyebrow">3D Store</p>
      <h1>Create your free account.</h1>
      <p>One place to buy models and download everything you own — no waiting on email links.</p>
    </div></section>
    <section className="section pt-0"><div className="container narrow">
      <form className="inquiry-form login-form" method="post" action="/api/store/account/register/">
        {params.error === "taken" && <div className="alert alert-danger">That email already has an account. Try signing in instead.</div>}
        {params.error === "weak" && <div className="alert alert-danger">Password must be at least 8 characters.</div>}
        {params.error === "form" && <div className="alert alert-danger">Please check your details and try again.</div>}
        <input type="hidden" name="next" value={next} />
        <div className="form-field"><label htmlFor="full_name">Full name</label><input className="form-control" id="full_name" name="full_name" autoComplete="name" required maxLength={120} /></div>
        <div className="form-field"><label htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="form-field"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /><small>At least 8 characters.</small></div>
        <button className="btn btn-accent" type="submit" style={{ width: "100%", justifyContent: "center" }}>Create Account</button>
      </form>
      <p className="analytics-note" style={{ marginTop: 16, textAlign: "center" }}>Already have an account? <Link className="text-link" href={`/3d-store/account/login/?next=${encodeURIComponent(next)}`}>Sign in</Link></p>
    </div></section>
  </>;
}
