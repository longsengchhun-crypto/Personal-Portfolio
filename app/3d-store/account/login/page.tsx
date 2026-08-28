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

  return <>
    <section className="page-hero compact dashboard-auth"><div className="container narrow">
      <p className="eyebrow">3D Store</p>
      <h1>Sign in to your account.</h1>
      <p>Access every model you've purchased, from any device, anytime.</p>
    </div></section>
    <section className="section pt-0"><div className="container narrow">
      <form className="inquiry-form login-form" method="post" action="/api/store/account/login/">
        {params.error === "rate" && <div className="alert alert-danger">Too many attempts. Please wait about 15 minutes and try again.</div>}
        {params.error === "invalid" && <div className="alert alert-danger">Email or password is not correct.</div>}
        <input type="hidden" name="next" value={next} />
        <div className="form-field"><label htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="form-field"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="btn btn-accent" type="submit" style={{ width: "100%", justifyContent: "center" }}>Sign In</button>
      </form>
      <p className="analytics-note" style={{ marginTop: 16, textAlign: "center" }}>New here? <Link className="text-link" href={`/3d-store/account/register/?next=${encodeURIComponent(next)}`}>Create a free account</Link></p>
    </div></section>
  </>;
}
