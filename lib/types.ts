export type Category = { id: number; name: string; slug: string; order: number };

export type SiteSetting = {
  id: number; site_name: string; professional_title: string; hero_intro: string;
  khmer_intro: string; professional_intro: string; portrait: string;
  showreel_title: string; showreel_thumbnail: string; youtube_url: string;
  vimeo_url: string; local_video_url: string; email: string; phone: string; location: string;
};

export type SocialLink = { id: number; label: string; url: string; icon_name: string; order: number; is_active: boolean };

export type Project = {
  id: number; category_id: number; title: string; slug: string; year: number;
  short_description: string; project_type: string; cover_image: string; cover_video_url: string;
  video_file: string; client: string; role: string; project_duration: string;
  software_used: string; introduction: string; objective: string; creative_approach: string;
  process: string; final_result: string; embedded_video_url: string; before_image: string;
  after_image: string; credits: string; is_featured: boolean; status: "draft" | "published";
  order: number; created_at: string; updated_at: string; category: Category; gallery_items?: GalleryItem[];
};

export type GalleryItem = {
  id: number; project_id: number; item_type: "image" | "video"; image: string;
  video_url: string; video_file: string; caption: string; alt_text: string;
  layout: "landscape" | "portrait" | "full"; order: number;
};

export type Inquiry = {
  id: number; full_name: string; email: string; phone_or_telegram: string; company: string;
  service_needed: string; estimated_budget: string; preferred_timeline: string;
  project_description: string; attachment: string; consent: boolean; status: string;
  admin_notes: string; client_response: string; last_notification_status: string;
  last_notified_at: string | null; is_reviewed: boolean; created_at: string; updated_at: string;
  messages?: InquiryMessage[];
};

export type InquiryMessage = {
  id: number; inquiry_id: number; message_type: "receipt" | "accepted" | "declined" | "reply" | "status";
  subject: string; body: string; delivery_status: string; created_at: string;
};

export type Visit = {
  id: number; path: string; referrer: string; device_type: string; device_model: string;
  device_vendor: string; browser: string; browser_version: string; os: string; os_version: string;
  platform: string; language: string; timezone: string; connection_type: string;
  cpu_cores: number | null; device_memory: number | null; touch_support: boolean; is_bot: boolean;
  city: string; region: string; country: string; country_code: string;
  screen_width: number | null; screen_height: number | null;
  viewport_width: number | null; viewport_height: number | null; created_at: string;
};

export type DashboardSnapshot = {
  total_visits: number; today_visits: number; unique_visitors: number;
  new_inquiries: number; accepted_projects: number; latest_visits: Visit[];
  latest_inquiries: Inquiry[]; device_breakdown: { device_type: string; total: number }[];
  model_breakdown: { device_model: string; device_vendor: string; total: number }[];
  location_breakdown: { city: string; region: string; country: string; total: number }[];
  top_pages: { path: string; total: number }[];
};
