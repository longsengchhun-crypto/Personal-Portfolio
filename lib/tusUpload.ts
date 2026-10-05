import * as tus from "tus-js-client";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// Supabase serves resumable (TUS) uploads from a dedicated `<project-ref>.storage.supabase.co` host.
const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, "").replace(/\.supabase\.co\/?$/, "");
const TUS_ENDPOINT = PROJECT_REF ? `https://${PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable` : "";

export type PreparedUpload = { bucket?: string; path: string; token: string; publicUrl: string };

/** Resumable upload to a signed Supabase Storage URL; resolves when the whole file has landed. */
export function uploadViaTus(file: File, prepared: PreparedUpload, options: { contentType?: string; cacheControl?: string; onProgress?: (percent: number) => void } = {}) {
  if (!TUS_ENDPOINT) return Promise.reject(new Error("Upload is misconfigured (missing Supabase URL)."));
  return new Promise<void>((resolve, reject) => {
    new tus.Upload(file, {
      endpoint: TUS_ENDPOINT,
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}`, "x-signature": prepared.token, "x-upsert": "true" },
      metadata: { bucketName: prepared.bucket || "portfolio-media", objectName: prepared.path, contentType: options.contentType || file.type || "application/octet-stream", cacheControl: options.cacheControl || "3600" },
      onError: (error) => reject(error instanceof Error ? error : new Error(String(error))),
      onProgress: (sent, total) => options.onProgress?.(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    }).start();
  });
}
