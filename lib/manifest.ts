import { getSupabaseAdmin } from "@/lib/supabase";

// Small JSON settings files (hero slides, site flags) live in the media bucket. The bucket only
// accepts media and generic binary types, so they are stored as application/octet-stream; reading
// them back does not depend on the declared type.
export async function saveManifest(path: string, value: unknown) {
  const { error } = await getSupabaseAdmin().storage.from("portfolio-media").upload(path, new Blob([JSON.stringify(value)], { type: "application/octet-stream" }), { upsert: true, contentType: "application/octet-stream", cacheControl: "0" });
  return error;
}
