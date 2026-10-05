"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="wrap fault">
    <p className="meta meta--accent">Something broke</p>
    <h1 className="display">Cut. Let&apos;s retake.</h1>
    <p className="lede">This page failed to load. That is on my side, not yours. Try again, or head back to the home page.</p>
    <div className="fault__actions">
      <button type="button" className="btn btn--primary btn--lg" onClick={reset}>Try again</button>
      <Link href="/" className="btn btn--glass btn--lg">Back to home</Link>
    </div>
  </section>;
}
