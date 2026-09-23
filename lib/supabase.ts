import { createClient } from "@supabase/supabase-js";

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Server-only. Uses the service-role key, which bypasses RLS — never expose to the client. */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Server-only. Resolves an order's purchasable files into short-lived signed download URLs. */
export async function getProductDownloadLinks(productId: number) {
  const admin = getSupabaseAdmin();
  const { data: files } = await admin.from("product_files").select("*").eq("product_id", productId).order("order");
  if (!files?.length) return [];
  const links = await Promise.all(files.map(async (file) => {
    // Without a `download` filename, the signed URL has no Content-Disposition header, so the
    // browser saves it under the last segment of the storage path — a randomized
    // "<timestamp>-<uuid>-<name>" string, not the clean original filename the customer
    // actually uploaded/expects.
    //
    // NOT using storage-js's own `{ download }` option for this: it builds the query string
    // with URLSearchParams (which correctly percent-encodes the filename), then wraps the
    // *entire already-encoded URL* in `encodeURI()` again — which re-encodes every `%` into
    // `%25`, double-encoding it. For any non-ASCII filename (several products here have Khmer
    // filenames) the browser then downloads the file with the literal, undecoded
    // "%E1%9E%9A%E1..." string as its name instead of the real filename. Appending the
    // `download` param ourselves, after the SDK call, avoids that second encoding pass.
    const { data } = await admin.storage.from("product-downloads").createSignedUrl(file.file_path, 3600);
    const url = data?.signedUrl ? `${data.signedUrl}&download=${encodeURIComponent(file.file_name as string)}` : null;
    return { name: file.file_name as string, url };
  }));
  return links.filter((link): link is { name: string; url: string } => Boolean(link.url));
}

export function mediaUrl(path: string | null | undefined, transform?: { width: number; quality?: number }) {
  if (!path) return "";
  if (path.startsWith("/")) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return `/media/${path.replace(/^\//, "")}`;
  const cleanPath = path.replace(/^\//, "");
  if (transform) {
    // resize=contain is required whenever only one dimension is given — Supabase's image
    // transform otherwise leaves the other dimension at its original pixel size instead of
    // scaling it proportionally, silently distorting every thumbnail's aspect ratio.
    const params = new URLSearchParams({ width: String(transform.width), quality: String(transform.quality ?? 75), resize: "contain" });
    return `${base}/storage/v1/render/image/public/portfolio-media/${cleanPath}?${params.toString()}`;
  }
  return `${base}/storage/v1/object/public/portfolio-media/${cleanPath}`;
}
