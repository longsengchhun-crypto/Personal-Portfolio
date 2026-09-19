import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import Script from "next/script";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { isAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/content";
import { getCustomer } from "@/lib/customerAuth";

const DEFAULT_DESCRIPTION = "Portfolio and creative services by LONG SENGCHHUN, a multidisciplinary creative designer based in Phnom Penh, Cambodia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "LONG SENGCHHUN | Multidisciplinary Creative Designer", template: "%s | LONG SENGCHHUN" },
  description: DEFAULT_DESCRIPTION,
  icons: { icon: "/static/site-assets/profile/profile-cutout-fade.png" },
  openGraph: {
    siteName: "LONG SENGCHHUN",
    type: "website",
    title: "LONG SENGCHHUN | Multidisciplinary Creative Designer",
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [{ url: "/static/site-assets/profile/profile-cutout-fade.png" }],
  },
};

export const dynamic = "force-dynamic";

const themeScript = `(function(){try{var saved=localStorage.getItem("portfolio-theme");var theme=saved||(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=theme}catch(e){document.documentElement.dataset.theme="dark"}})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [admin, customer] = await Promise.all([isAdmin(), getCustomer()]);
  return <html lang="en" suppressHydrationWarning><head>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700;800&family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />
    {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
    <link href="/static/css/site.css?v=20260919-cart-versioning" rel="stylesheet" />
  </head><body data-track-url="/api/track-visit/">
    <a className="skip-link" href="#main">Skip to content</a><Nav isAdmin={admin} customerName={customer?.fullName || null} /><main id="main">{children}</main><Footer />
    <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
    <Script src="/static/js/site.js?v=20260909-perf-video-lazy" strategy="afterInteractive" />
    <Analytics />
  </body></html>;
}
