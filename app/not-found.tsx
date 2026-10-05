import Link from "next/link";
import SiteChrome from "@/components/site/SiteChrome";

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return <SiteChrome>
    <section className="wrap fault">
      <p className="meta meta--accent">404</p>
      <h1 className="display">Out of frame.</h1>
      <p className="lede">That page does not exist, or it has moved. The work is still right where you left it.</p>
      <div className="fault__actions">
        <Link href="/" className="btn btn--primary btn--lg">Back to home</Link>
        <Link href="/portfolio/" className="btn btn--glass btn--lg">View work</Link>
      </div>
    </section>
  </SiteChrome>;
}
