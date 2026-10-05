import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter, Kantumruy_Pro } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { OWNER, SITE_URL } from "@/lib/content";
import { getSiteFlags, seoDescription } from "@/lib/siteFlags";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/ui.css";
import "./styles/site.css";
import { toJsonLd } from "@/lib/jsonLd";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const kantumruy = Kantumruy_Pro({ subsets: ["khmer", "latin"], variable: "--font-kantumruy", display: "swap", weight: ["400", "500", "600", "700"] });

const TITLE = `${OWNER.name} | Visual Creative & Media`;

export async function generateMetadata(): Promise<Metadata> {
  const description = seoDescription(await getSiteFlags());
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: TITLE, template: `%s | ${OWNER.name}` },
    description,
    applicationName: OWNER.name,
    authors: [{ name: OWNER.name, url: SITE_URL }],
    creator: OWNER.name,
    alternates: { canonical: "/" },
    openGraph: { siteName: OWNER.name, type: "website", locale: "en_US", title: TITLE, description, url: "/" },
    twitter: { card: "summary_large_image", title: TITLE, description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1 } },
  };
}

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#07080a" }, { media: "(prefers-color-scheme: light)", color: "#f5f3ef" }],
  colorScheme: "dark light",
};

// Runs before first paint so the saved theme never flashes. Dark is the default.
const themeScript = `(function(){try{var t=localStorage.getItem("portfolio-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}})();`;

const siteJsonLd = (description: string) => ({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: OWNER.name, description, inLanguage: "en", publisher: { "@id": `${SITE_URL}/#studio` } },
    {
      "@type": "ProfessionalService", "@id": `${SITE_URL}/#studio`, name: OWNER.name, url: SITE_URL, description,
      image: `${SITE_URL}/opengraph-image`, email: OWNER.email, telephone: OWNER.phone, priceRange: "$$",
      address: { "@type": "PostalAddress", addressLocality: "Phnom Penh", addressCountry: "KH" },
      areaServed: "Worldwide", founder: { "@id": `${SITE_URL}/#person` },
    },
  ],
});

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const description = seoDescription(await getSiteFlags());
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} ${kantumruy.variable}`}>
    <head>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {supabaseUrl && <link rel="preconnect" href={supabaseUrl} crossOrigin="anonymous" />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(siteJsonLd(description)) }} />
    </head>
    <body>
      <a className="skip-link" href="#main">Skip to content</a>
      <ToastProvider>{children}</ToastProvider>
      <Analytics />
    </body>
  </html>;
}
