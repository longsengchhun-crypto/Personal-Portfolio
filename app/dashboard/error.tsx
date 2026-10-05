"use client";

import { AlertTriangle } from "@/components/ui/Icon";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const unauthorized = /unauthorized/i.test(error.message);
  return <div className="adm-fault">
    <AlertTriangle aria-hidden="true" />
    <h1>{unauthorized ? "Your session has expired" : "This page could not load"}</h1>
    <p>{unauthorized ? "Sign in again to continue where you left off." : "The data for this page could not be fetched, usually a brief connection problem. Your work is not lost. Try again."}</p>
    <div className="adm-fault__actions">
      {unauthorized ? <a className="btn btn--primary" href="/dashboard/login/">Sign in</a> : <button type="button" className="btn btn--primary" onClick={reset}>Try again</button>}
      <a className="btn btn--glass" href="/dashboard/">Back to overview</a>
    </div>
  </div>;
}
