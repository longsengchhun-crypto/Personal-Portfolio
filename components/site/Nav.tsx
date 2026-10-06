"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Clapperboard, Home, LayoutDashboard, Mail, Sparkles, User, UserRound } from "@/components/ui/Icon";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { label: "Work", href: "/portfolio/", icon: Clapperboard },
  { label: "Services", href: "/services/", icon: Sparkles },
  { label: "About", href: "/about/", icon: User },
  { label: "Contact", href: "/contact/", icon: Mail },
] as const;

const PLUGINS_URL = "https://lastfxstudio.com";

const TABS = [{ label: "Home", href: "/", icon: Home }, ...LINKS] as const;

type Session = { isAdmin: boolean; customerName: string | null };

// Fetched client-side so the root layout never reads cookies, which would force every page
// to render dynamically and block caching.
function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/session/").then((res) => res.json()).then((data: Session) => { if (!cancelled) setSession(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return session;
}

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

const isActive = (href: string, path: string) => (href === "/" ? path === "/" : path.startsWith(href) || (href === "/portfolio/" && path.startsWith("/showreel/")));

function AccountLink({ session }: { session: Session | null }) {
  const [href, label, Icon] = session?.isAdmin ? ["/dashboard/", "Open admin dashboard", LayoutDashboard] as const
    : session?.customerName ? ["/account/", `Your account, ${session.customerName.split(" ")[0]}`, UserRound] as const
    : ["/account/login/", "Sign in", UserRound] as const;
  return <Link href={href} className="btn btn--ghost btn--icon btn--sm" aria-label={label} title={label}><Icon /></Link>;
}

export default function Nav() {
  const path = usePathname();
  const scrolled = useScrolled();
  const session = useSession();
  // On the home page the bar floats over the hero, so it keeps light-on-dark colours until scroll.
  return <>
    <header className={`nav${path === "/" ? " nav--over-media" : ""}`} data-scrolled={scrolled || undefined}>
      <nav className="nav__bar" aria-label="Primary">
        <Link href="/" className="nav__brand" aria-label="LONG SENGCHHUN — home"><span>LONG SENGCHHUN</span></Link>
        <ul className="nav__links">
          {LINKS.filter((link) => link.href !== "/contact/").map((link) => <Fragment key={link.href}>
            <li><Link href={link.href} className="nav__link" aria-current={isActive(link.href, path) ? "page" : undefined}>{link.label}</Link></li>
            {link.href === "/portfolio/" && <li><a href={PLUGINS_URL} target="_blank" rel="noopener noreferrer" className="nav__link">Plugins <ArrowUpRight className="nav__ext" aria-hidden="true" /><span className="sr-only">(opens lastfxstudio.com in a new tab)</span></a></li>}
          </Fragment>)}
        </ul>
        <div className="nav__tools">
          <a href={PLUGINS_URL} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm nav__plugins-mobile">Plugins <ArrowUpRight aria-hidden="true" /><span className="sr-only">(opens lastfxstudio.com in a new tab)</span></a>
          <Link href="/contact/" className="btn btn--glass btn--sm nav__cta" aria-current={isActive("/contact/", path) ? "page" : undefined}>Start a project</Link>
          <AccountLink session={session} />
          <ThemeToggle />
        </div>
      </nav>
    </header>
    <nav className="tabbar glass glass--strong" aria-label="Primary mobile">
      {TABS.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="tabbar__item" aria-current={isActive(href, path) ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
  </>;
}
