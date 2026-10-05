import type { NextConfig } from "next";

// Content Security Policy. Inline scripts/styles stay allowed because Next injects its own
// hydration and theme scripts; everything else is limited to this site, Supabase and https media.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.storage.supabase.co wss://*.supabase.co",
  "frame-src https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [30, 75, 80, 85],
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2560],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      { source: "/3d-store/account/login", destination: "/account/login/", permanent: true },
      { source: "/3d-store/account/register", destination: "/account/register/", permanent: true },
      { source: "/3d-store/account", destination: "/account/", permanent: true },
      { source: "/3d-store/:path*", destination: "/", permanent: true },
      { source: "/dashboard/store/:path*", destination: "/dashboard/", permanent: false },
      { source: "/portfolio/khmer-new-year-2026", destination: "/portfolio/khmer-new-year-2023/", permanent: true },
      // Admin sections were renamed; old bookmarks and emailed links keep working.
      { source: "/dashboard/portfolio", destination: "/dashboard/projects/", permanent: true },
      { source: "/dashboard/portfolio/:path*", destination: "/dashboard/projects/:path*", permanent: true },
      { source: "/dashboard/content", destination: "/dashboard/settings/", permanent: true },
      { source: "/dashboard/hero", destination: "/dashboard/settings/?tab=homepage", permanent: true },
      { source: "/dashboard/inquiries/:id", destination: "/dashboard/messages/:id/", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/dashboard/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
