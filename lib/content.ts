import type { Metadata } from "next";

export const SITE_URL = "https://creativeservices.vercel.app";

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Awaiting Payment",
  payment_submitted: "Under Review",
  under_review: "Under Review",
  paid: "Paid — Ready to Download",
  rejected: "Payment Issue",
  completed: "Completed",
};

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | LONG SENGCHHUN`, description, url: path },
  };
}

export const OWNER = {
  name: "LONG SENGCHHUN",
  title: "Multidisciplinary Creative Designer",
  roles: "Film | Motion | Design | Photography | 3D",
  location: "Phnom Penh, Cambodia",
  phone: "016 590 899",
  email: "longsengchhun@gmail.com",
  telegram: "@SENGCHHUN11",
  telegramUrl: "https://t.me/SENGCHHUN11",
};

export const KHMER = {
  home: "ទំព័រដើម",
  showreel: "សូវរីល",
  store: "ហាងម៉ូដែល 3D",
  work: "ស្នាដៃ",
  services: "សេវាកម្ម",
  about: "អំពីខ្ញុំ",
  contact: "ទំនាក់ទំនង",
  hero: "បង្កើតស្នាដៃដែលភ្ជាប់ជាមួយគំនិត និងការរចនារបស់លោកអ្នកជាមួយយើងឥឡូវនេះ",
  projectCta: "មានគម្រោងចង់សហការជាមួយខ្ញុំមែនទេ?",
  footerCta: "តោះបង្កើតស្នាដៃដែលមានអត្ថន័យជាមួយគ្នា។",
};

export const DISCIPLINES = [
  ["Graphic Design", "graphic-design"],
  ["Video and Film", "video-editing"],
  ["Photography", "photography"],
  ["3D Design and Modeling", "video-and-3d-modeling"],
] as const;

export const EDITING_TOOLS = ["after-effects", "audition", "illustrator", "indesign", "lightroom", "photoshop", "blender", "capcut", "coreldraw", "davinci-resolve", "creative-tool-1", "creative-tool-2"].map((slug) => ({
  name: slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
  image: `/static/site-assets/tools/${slug}.png`,
}));

export const SERVICE_CHOICES = ["Graphic Design", "Poster Design", "Video Editing", "Photo / Video Production", "Photography", "Videography", "Filmmaking", "3D Design and Modeling", "3D Modeling", "3D Animation", "Product Visualization", "Motion Graphics", "Social Media Content", "Other"] as const;
export const BUDGET_CHOICES = ["Not decided yet", "Under $100", "$100-$300", "$300-$700", "$700-$1,500", "Above $1,500", "Prefer to discuss privately"] as const;
export const INQUIRY_STATUSES = ["new", "reviewing", "replied", "accepted", "declined", "archived"] as const;
