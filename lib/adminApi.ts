export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

const SESSION_EXPIRED = "Your admin session has expired. Please sign in again.";

/** POSTs JSON to an admin endpoint and always returns a human-readable error instead of throwing. */
export async function adminJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, status: 0, error: "No connection to the server. Check your internet and try again." };
  }
  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (response.status === 401 || response.redirected) return { ok: false, status: 401, error: SESSION_EXPIRED };
  if (!response.ok || (data && typeof data === "object" && "error" in data && data.error)) {
    const message = data?.error || (response.status === 413 ? "That request was too large." : `The server could not complete this action (code ${response.status}). Please try again.`);
    return { ok: false, status: response.status, error: message };
  }
  return { ok: true, data: (data ?? {}) as T };
}

/** Turns raw upload-library failures into something an admin can act on. */
export function describeUploadError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/413|too large|exceeded the maximum|payload/i.test(raw)) return "This file is larger than the storage plan allows. Compress it and try again.";
  if (/401|403|unauthorized|signature|not authorized|row-level/i.test(raw)) return "The server refused this upload. Refresh the page, sign in again if asked, and retry.";
  if (/network|failed to fetch|timeout|offline|ECONN/i.test(raw)) return "The connection dropped during upload. Check your internet and press Retry.";
  if (/misconfigured/i.test(raw)) return raw;
  return raw && raw.length < 140 && !/tus:|request \(method/i.test(raw) ? raw : "The upload failed. Press Retry, or try a smaller file.";
}

export const IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 2 * 1024 * 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
