export type Category = { id: number; name: string; slug: string; order: number };

export type SiteSetting = {
  id: number; site_name: string; professional_title: string; hero_intro: string;
  khmer_intro: string; professional_intro: string; portrait: string;
  showreel_title: string; showreel_thumbnail: string; youtube_url: string;
  vimeo_url: string; local_video_url: string; email: string; phone: string; location: string;
  aba_qr_image: string; aba_account_info: string;
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

export type Service = {
  id: number; title: string; description: string; order: number; is_active: boolean;
  created_at: string; updated_at: string;
};

export type SkillGroup = { id: number; name: string; order: number };
export type Skill = { id: number; group_id: number; name: string; order: number };
export type SoftwareTool = { id: number; name: string; order: number };

export type DashboardContent = {
  site_settings: SiteSetting | null;
  services: Service[];
  skill_groups: SkillGroup[];
  skills: Skill[];
  software_tools: SoftwareTool[];
};

export type ProductCategory = { id: number; name: string; slug: string; order: number };

export type Product = {
  id: number; category_id: number | null; title: string; slug: string;
  short_description: string; description: string; price_usd: number; price_khr: number;
  tags: string; software: string; file_formats: string; polygon_count: string;
  texture_info: string; dimensions: string; file_size: string; version: string;
  license: string; compatibility: string; requirements: string; notes: string;
  cover_image: string; preview_video: string; viewer_model: string;
  is_featured: boolean; status: "draft" | "published"; order: number;
  created_at: string; updated_at: string; category?: ProductCategory | null;
};

export type ProductMedia = { id: number; product_id: number; media_type: "image" | "video"; file_path: string; caption: string; order: number };
export type ProductFile = { id: number; product_id: number; file_name: string; file_path: string; file_size: number | null; order: number; created_at: string };

export type DashboardStoreContent = { categories: ProductCategory[]; products: Product[] };
export type DashboardStoreProduct = Product & { media: ProductMedia[]; files: ProductFile[] };

export type OrderStatus = "pending_payment" | "payment_submitted" | "under_review" | "paid" | "rejected" | "completed";

export type Order = {
  id: number; order_number: string; product_id: number; customer_name: string; customer_email: string;
  customer_phone: string; price_usd: number; price_khr: number; payment_reference: string;
  payment_screenshot: string; status: OrderStatus; admin_notes: string; created_at: string;
  updated_at: string; reviewed_at: string | null; product_title?: string; batch_id: string | null;
};

export type OrderMessage = { id: number; order_id: number; message_type: "created" | "submitted" | "approved" | "rejected"; subject: string; body: string; delivery_status: string; created_at: string };
// dashboard_store_order (singular) includes access_token so admin can share/reference the
// customer's order link; dashboard_store_orders (list) deliberately strips it.
export type DashboardStoreOrder = Order & { access_token: string; product: Product; messages: OrderMessage[] };

export type OrderProductRef = { id: number; title: string; slug: string; cover_image: string; version: string; updated_at: string };

export type BatchSiblingOrder = {
  id: number; status: OrderStatus; price_usd: number; price_khr: number;
  product: OrderProductRef;
};

export type OrderStatusView = {
  id: number; order_number: string; status: OrderStatus; customer_name: string; customer_email: string;
  price_usd: number; price_khr: number; created_at: string; reviewed_at: string | null; admin_notes: string;
  batch_id: string | null; batch_items: BatchSiblingOrder[];
  product: OrderProductRef;
};

// get_customer_orders additionally returns access_token (the customer already fully controls
// each of their own orders' tokens) so the account dashboard can link to the guest payment page.
export type CustomerOrderView = OrderStatusView & { access_token: string };

export type WishlistProductView = {
  id: number; slug: string; title: string; short_description: string; price_usd: number; price_khr: number;
  cover_image: string; file_formats: string; is_featured: boolean; status: "draft" | "published"; added_at: string;
};

export type InquiryStatus = "new" | "reviewing" | "replied" | "accepted" | "declined" | "archived";

export type CustomerInquiryMessage = { message_type: "reply" | "accepted" | "declined"; subject: string; body: string; created_at: string };

export type CustomerInquiryView = {
  id: number; service_needed: string; project_description: string; estimated_budget: string;
  preferred_timeline: string; status: InquiryStatus; created_at: string; updated_at: string;
  messages: CustomerInquiryMessage[];
};

export type DashboardSnapshot = {
  total_visits: number; today_visits: number; unique_visitors: number;
  new_inquiries: number; accepted_projects: number; latest_visits: Visit[];
  latest_inquiries: Inquiry[]; device_breakdown: { device_type: string; total: number }[];
  model_breakdown: { device_model: string; device_vendor: string; total: number }[];
  location_breakdown: { city: string; region: string; country: string; total: number }[];
  top_pages: { path: string; total: number }[];
};
