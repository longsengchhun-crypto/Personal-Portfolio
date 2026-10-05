import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/Icon";
import { OWNER } from "@/lib/content";
import { getSiteContext } from "@/lib/data";

const SOCIAL_ICON_NAMES: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", tiktok: "TikTok", telegram: "Telegram", linkedin: "LinkedIn", behance: "Behance", vimeo: "Vimeo", github: "GitHub", twitter: "X", "twitter-x": "X" };

export default async function Footer() {
  const { site, social } = await getSiteContext().catch(() => ({ site: null, social: [] }));
  const email = site?.email || OWNER.email;
  const phone = site?.phone || OWNER.phone;
  return <footer className="footer">
    <div className="wrap">
      <div className="footer__top">
        <div>
          <p className="meta meta--accent">Available for selected collaborations</p>
          <p className="title footer__title">Let&apos;s make something worth watching.</p>
        </div>
        <Link href="/contact/" className="btn btn--primary btn--lg">Start a project <ArrowUpRight className="btn__arrow" /></Link>
      </div>
      <div className="footer__grid">
        <div><h2 className="meta">Contact</h2><ul>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          <li><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>
          <li><a href={OWNER.telegramUrl} target="_blank" rel="noreferrer">Telegram {OWNER.telegram}</a></li>
          <li>{site?.location || OWNER.location}</li>
        </ul></div>
        <div><h2 className="meta">Explore</h2><ul>
          <li><Link href="/portfolio/">Work</Link></li>
          <li><Link href="/showreel/">Showreel</Link></li>
          <li><Link href="/services/">Services</Link></li>
          <li><Link href="/about/">About</Link></li>
        </ul></div>
        <div><h2 className="meta">Elsewhere</h2><ul>
          {social.map((link) => <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer">{SOCIAL_ICON_NAMES[link.icon_name?.replace(/^bi-/, "")] || link.label}</a></li>)}
          <li><a href="https://lastfxstudio.com" target="_blank" rel="noopener noreferrer">LASTFX Studio plugins <ArrowUpRight className="footer__ext" aria-hidden="true" /></a></li>
          <li><Link href="/account/login/">Client sign in</Link></li>
        </ul></div>
      </div>
      <div className="footer__bottom"><span>&copy; {new Date().getFullYear()} {OWNER.name}</span><Link href="/privacy/">Privacy</Link></div>
    </div>
  </footer>;
}
