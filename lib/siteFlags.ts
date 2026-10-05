import { DEFAULT_DESCRIPTION } from "@/lib/content";
import { getSupabaseAdmin } from "@/lib/supabase";

// Small site-wide switches managed from Settings. Like the hero slides they live in a JSON file in
// the media bucket, so no database migration is needed.
export type SiteFlags = { available: boolean; availabilityNote: string; seoDescription: string };

export const FLAGS_PATH = "site/flags.json";
const DEFAULT_FLAGS: SiteFlags = { available: true, availabilityNote: "", seoDescription: "" };

export function normalizeFlags(raw: unknown): SiteFlags {
  const value = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    available: value.available !== false,
    availabilityNote: String(value.availabilityNote ?? "").trim().slice(0, 120),
    seoDescription: String(value.seoDescription ?? "").trim().slice(0, 300),
  };
}

/** Server-only. Falls back to the defaults if nothing was ever saved or storage is unreachable. */
export async function getSiteFlags(): Promise<SiteFlags> {
  try {
    const { data, error } = await getSupabaseAdmin().storage.from("portfolio-media").download(FLAGS_PATH);
    if (error || !data) return DEFAULT_FLAGS;
    return normalizeFlags(JSON.parse(await data.text()));
  } catch {
    return DEFAULT_FLAGS;
  }
}

export const availabilityLabel = (flags: SiteFlags) => flags.availabilityNote || (flags.available ? "Available for selected collaborations" : "Currently booked, taking enquiries for later dates");
export const seoDescription = (flags: SiteFlags) => flags.seoDescription || DEFAULT_DESCRIPTION;
