import { randomUUID } from "node:crypto";
import { parseVideoLink, type VideoLink } from "@/lib/embed";
import { getSupabaseAdmin } from "@/lib/supabase";

// Server-only. Turns a pasted video link (TikTok, YouTube, Vimeo) into everything a project needs:
// a canonical link, the embeddable player, a title, and a thumbnail copied into our own storage.
// Only the official oEmbed endpoints of those three services are ever contacted.
export type ResolvedVideo = VideoLink & { canonicalUrl: string; title: string; thumbnailPath: string };

const FETCH_TIMEOUT = 12_000;
const TIKTOK_SHORT = /^https:\/\/(?:vm|vt)\.tiktok\.com\//i;
const TIKTOK_T = /^https:\/\/(?:www\.)?tiktok\.com\/t\//i;
const KNOWN_HOST = /^https:\/\/(?:www\.|m\.)?(?:tiktok\.com|youtube\.com|youtu\.be|vimeo\.com)\//i;

const get = (url: string, init: RequestInit = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT), headers: { "User-Agent": "Mozilla/5.0 (compatible; PortfolioImport/1.0)", ...init.headers } });

/** Follows a short TikTok link to the real video page and strips tracking parameters. */
async function canonicalTikTok(url: string) {
  let target = url;
  if (TIKTOK_SHORT.test(url) || TIKTOK_T.test(url)) {
    const response = await get(url, { redirect: "follow" });
    target = response.url;
  }
  const match = target.match(/^https:\/\/(?:www\.|m\.)?tiktok\.com\/(@[\w.-]+)\/video\/(\d{8,})/i);
  return match ? `https://www.tiktok.com/${match[1]}/video/${match[2]}` : target;
}

type OEmbed = { title?: string; thumbnail_url?: string };

async function oembed(provider: VideoLink["provider"], url: string): Promise<OEmbed> {
  const endpoint = provider === "tiktok" ? "https://www.tiktok.com/oembed" : provider === "youtube" ? "https://www.youtube.com/oembed" : provider === "vimeo" ? "https://vimeo.com/api/oembed.json" : "";
  if (!endpoint) return {};
  try {
    const response = await get(`${endpoint}?url=${encodeURIComponent(url)}${provider === "youtube" ? "&format=json" : ""}`);
    return response.ok ? ((await response.json()) as OEmbed) : {};
  } catch {
    return {};
  }
}

const cleanTitle = (raw: string) => raw.replace(/#[^\s#]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

async function storeThumbnail(provider: string, id: string, thumbnailUrl: string) {
  if (!/^https:\/\//i.test(thumbnailUrl)) return "";
  try {
    const response = await get(thumbnailUrl);
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !/^image\/(jpeg|png|webp)/i.test(type)) return "";
    const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
    const path = `projects/covers/${provider}-${id}-${randomUUID().slice(0, 8)}.${extension}`;
    const { error } = await getSupabaseAdmin().storage.from("portfolio-media").upload(path, await response.arrayBuffer(), { contentType: type.split(";")[0], upsert: false });
    return error ? "" : path;
  } catch {
    return "";
  }
}

export async function resolveVideoLink(input: string): Promise<ResolvedVideo | { error: string }> {
  const raw = input.trim();
  if (!/^https:\/\//i.test(raw)) return { error: "That doesn't look like a link. Paste the full address starting with https://" };
  if (!KNOWN_HOST.test(raw)) {
    const link = parseVideoLink(raw);
    return link ? { ...link, canonicalUrl: raw, title: "", thumbnailPath: "" } : { error: "That link can't be embedded." };
  }
  const canonicalUrl = /tiktok\.com/i.test(raw) ? await canonicalTikTok(raw).catch(() => raw) : raw;
  const link = parseVideoLink(canonicalUrl);
  if (!link) return { error: "That link isn't a video page. For TikTok, open the video and copy its address." };
  if (link.provider === "other") return { error: "That link isn't a single video page. Open the video itself and copy its address." };
  const meta = await oembed(link.provider, canonicalUrl);
  const id = link.embedUrl.split("/").pop()!.split("?")[0];
  const thumbnailUrl = link.provider === "youtube" ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : meta.thumbnail_url || "";
  return { ...link, canonicalUrl, title: cleanTitle(meta.title || ""), thumbnailPath: thumbnailUrl ? await storeThumbnail(link.provider, id, thumbnailUrl) : "" };
}
