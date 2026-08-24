import Link from "next/link";
import { getSiteContext } from "@/lib/data";
import { KHMER, OWNER } from "@/lib/content";

export default async function Footer() {
  const { site, social } = await getSiteContext();
  return <footer className="site-footer"><div className="container">
    <div className="footer-grid">
      <div><p className="eyebrow">Available for selected collaborations</p><h2>Let&apos;s create something worth remembering.</h2><p className="khmer-line">{KHMER.footerCta}</p></div>
      <div className="footer-contact">
        <a href={`mailto:${site?.email || OWNER.email}`}>{site?.email || OWNER.email}</a>
        <a href={`tel:${site?.phone || OWNER.phone}`}>{site?.phone || OWNER.phone}</a>
        <a href={OWNER.telegramUrl} target="_blank" rel="noreferrer">Telegram {OWNER.telegram}</a>
        <span>{site?.location || OWNER.location}</span>
        <div className="socials">{social.length ? social.map((link) => <a href={link.url} target="_blank" rel="noreferrer" aria-label={link.label} key={link.id}>{link.icon_name ? <i className={`bi bi-${link.icon_name}`} /> : link.label}</a>) : <span className="muted">Social links can be managed in Supabase.</span>}</div>
      </div>
    </div>
    <div className="footer-bottom"><span>&copy; {new Date().getFullYear()} LONG SENGCHHUN</span><Link href="/privacy/">Privacy Policy</Link></div>
  </div></footer>;
}
