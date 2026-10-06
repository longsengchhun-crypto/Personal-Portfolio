// Editorial curation for the public site. The database stays the source of truth; this file only
// decides which published projects lead the homepage and which duplicates stay off the work pages.

// Homepage "Selected work", in display order.
export const SELECTED_SLUGS = [
  "copy-b1mz",
  "asus-phone-product-poster",
  "snt-group-3",
  "panasonic-product-poster",
  "national-women-day",
  "constitution-day-poster",
  "tuf-gaming-laptop-poster",
  "copy-ayy3",
] as const;

// Duplicates and weaker variants of stronger pieces. Still reachable by direct link.
export const HIDDEN_SLUGS = ["copy-b4dj", "cosmetic-group-product-poster", "restaurant-menu-poster", "pb-new-copy", "pb00-copy", "10-copy"] as const;

// Display titles for projects whose stored title is a working file name.
export const TITLE_OVERRIDES: Record<string, string> = {
  "snt-group-3": "Victory Over Genocide Day",
  "copy-b1mz": "Pchum Ben",
};
