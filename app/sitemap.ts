import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content";

// The public site is five static pages; project and category pages were retired with the portfolio.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: "monthly" },
    { url: `${SITE_URL}/about/`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/services/`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/contact/`, priority: 0.7, changeFrequency: "yearly" },
    { url: `${SITE_URL}/privacy/`, priority: 0.2, changeFrequency: "yearly" },
  ];
}
