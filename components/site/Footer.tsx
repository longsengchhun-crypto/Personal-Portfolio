import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/Icon";
import { OWNER } from "@/lib/content";
import { getSiteContext } from "@/lib/data";
import { availabilityLabel, getSiteFlags } from "@/lib/siteFlags";

const SOCIAL_NAMES: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", tiktok: "TikTok", telegram: "Telegram", linkedin: "LinkedIn", behance: "Behance", vimeo: "Vimeo", github: "GitHub", twitter: "X", "twitter-x": "X" };

export default async function Footer() {
  const [{ site, social }, flags] = await Promise.all([getSiteContext().catch(() => ({ site: null, social: [] })), getSiteFlags()]);
  const email = site?.email || OWNER.email;
  const phone = site?.phone || OWNER.phone;
  return <footer className="footer">
    <div className="wrap">
      <div className="footer__grid">
        <div><h2 className="meta">Contact</h2><ul>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          <li><a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></li>
          <li><a href={OWNER.telegramUrl} target="_blank" rel="noreferrer">Telegram {OWNER.telegram}</a></li>
        </ul></div>
        <div><h2 className="meta">Index</h2><ul>
          <li><Link href="/portfolio/">Work</Link></li>
          <li><Link href="/about/">About</Link></li>
          <li><Link href="/services/">Services</Link></li>
          <li><Link href="/showreel/">Showreel</Link></li>
        </ul></div>
        <div><h2 className="meta">Elsewhere</h2><ul>
          {social.map((link) => <li key={link.id}><a href={link.url} target="_blank" rel="noreferrer">{SOCIAL_NAMES[link.icon_name?.replace(/^bi-/, "")] || link.label} <ArrowUpRight className="footer__ext" aria-hidden="true" /></a></li>)}
          <li><a href="https://lastfxstudio.com" target="_blank" rel="noopener noreferrer">LASTFX Studio <ArrowUpRight className="footer__ext" aria-hidden="true" /></a></li>
        </ul></div>
        <div><h2 className="meta">Based in</h2><ul>
          <li>{site?.location || OWNER.location}</li>
          <li className="footer__status"><i className={flags.available ? "is-open" : ""} aria-hidden="true" />{availabilityLabel(flags)}</li>
        </ul></div>
      </div>
      <p className="footer__mark" aria-hidden="true">Long Sengchhun</p>
      <div className="footer__bottom"><span>&copy; {new Date().getFullYear()} {OWNER.name}</span><span><Link href="/privacy/">Privacy</Link> · <Link href="/account/login/">Client sign in</Link></span></div>
    </div>
  </footer>;
}
