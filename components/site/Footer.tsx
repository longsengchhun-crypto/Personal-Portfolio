import Link from "next/link";
import { OWNER } from "@/lib/content";
import { LASTFX } from "@/lib/profile";
import { getSiteContext } from "@/lib/data";

export default async function Footer() {
  const { site } = await getSiteContext().catch(() => ({ site: null }));
  const email = site?.email || OWNER.email;
  return <footer className="footer">
    <div className="wrap footer__inner">
      <div className="footer__id">
        <p className="footer__name">Long Sengchhun</p>
        <p className="footer__line">Visual creative<br />{site?.location || OWNER.location}</p>
      </div>
      <nav aria-label="Footer" className="footer__col">
        <h2 className="meta">Pages</h2>
        <ul>
          <li><Link href="/about/">About</Link></li>
          <li><Link href="/services/">Services</Link></li>
          <li><Link href="/contact/">Contact</Link></li>
        </ul>
      </nav>
      <div className="footer__col">
        <h2 className="meta">Contact</h2>
        <ul>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          <li><a href={OWNER.telegramUrl} target="_blank" rel="noopener noreferrer">Telegram {OWNER.telegram}</a></li>
        </ul>
      </div>
      <div className="footer__col">
        <h2 className="meta">Also</h2>
        <ul>
          <li><a href={LASTFX.url} target="_blank" rel="noopener noreferrer">{LASTFX.name}<span className="sr-only"> (opens in a new tab)</span></a></li>
          <li><Link href="/account/login/">Client sign in</Link></li>
        </ul>
      </div>
    </div>
    <div className="wrap footer__bottom"><span>&copy; {new Date().getFullYear()} {OWNER.name}</span><Link href="/privacy/">Privacy</Link></div>
  </footer>;
}
