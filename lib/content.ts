import type { Metadata } from "next";

export const SITE_URL = "https://sengchhun.site";
export const DEFAULT_OG_IMAGE = "/opengraph-image";
export const SITE_TITLE = "LONG SENGCHHUN — Filmmaker & Visual Creative";
export const DEFAULT_DESCRIPTION = "Filmmaker and visual creative in Phnom Penh, Cambodia, working across filmmaking, videography, editing, visual effects, motion graphics, photography and 3D.";


export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Read",
  replied: "Replied",
  accepted: "Accepted",
  declined: "Declined",
  archived: "Archived",
};

// Next.js does not merge a route's `openGraph` object with the root layout's — a route that
// defines its own `openGraph` replaces the parent's entirely, dropping `images`/`siteName`/`type`
// unless the route repeats them. Every page here goes through this helper specifically so a
// pasted link always carries a preview image instead of silently losing one.
export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | LONG SENGCHHUN`, description, url: path,
      siteName: "LONG SENGCHHUN", type: "website", images: [{ url: DEFAULT_OG_IMAGE }],
    },
  };
}

export const OWNER = {
  name: "LONG SENGCHHUN",
  title: "Filmmaker & Visual Creative",
  roles: "Film · Video · VFX · Motion · Photography · 3D",
  location: "Phnom Penh, Cambodia",
  phone: "016 590 899",
  email: "longsengchhun@gmail.com",
  telegram: "@SENGCHHUN11",
  telegramUrl: "https://t.me/SENGCHHUN11",
};

export const SERVICE_CHOICES = ["Graphic Design", "Poster Design", "Video Editing", "Photo / Video Production", "Photography", "Videography", "Filmmaking", "3D Design and Modeling", "3D Modeling", "3D Animation", "Product Visualization", "Motion Graphics", "Social Media Content", "Other"] as const;
export const BUDGET_CHOICES = ["Not decided yet", "Under $100", "$100-$300", "$300-$700", "$700-$1,500", "Above $1,500", "Prefer to discuss privately"] as const;
export const INQUIRY_STATUSES = ["new", "reviewing", "replied", "accepted", "declined", "archived"] as const;
