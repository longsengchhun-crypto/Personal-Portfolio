import { z } from "zod";
import { BUDGET_CHOICES, SERVICE_CHOICES } from "@/lib/content";

export const inquirySchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone_or_telegram: z.string().trim().max(80).default(""),
  company: z.string().trim().max(140).default(""),
  service_needed: z.enum(SERVICE_CHOICES),
  estimated_budget: z.union([z.enum(BUDGET_CHOICES), z.literal("")]).default(""),
  preferred_timeline: z.string().trim().max(120).default(""),
  project_description: z.string().trim().min(10).max(10000),
  consent: z.literal("on"),
  honeypot: z.string().max(0).optional().default(""),
});

export function inferDeviceVendor(deviceModel: string) {
  return /^(sm-|gt-|samsung)/i.test(deviceModel) ? "Samsung" : /^(pixel|nexus)/i.test(deviceModel) ? "Google" : /^(huawei|honor|[a-z]{3}-l\d)/i.test(deviceModel) ? "Huawei / Honor" : /^(mi |redmi|poco)/i.test(deviceModel) ? "Xiaomi" : /^(cph|oppo)/i.test(deviceModel) ? "OPPO" : /^(vivo|v\d{4})/i.test(deviceModel) ? "vivo" : /^(oneplus|in\d{4})/i.test(deviceModel) ? "OnePlus" : /^(rmx|realme)/i.test(deviceModel) ? "realme" : /iphone|ipad|mac/i.test(deviceModel) ? "Apple" : "Unknown";
}

export function parseUserAgent(userAgent: string) {
  const value = userAgent.toLowerCase();
  const is_bot = /bot|crawler|spider|slurp|headless|preview|facebookexternalhit|whatsapp/.test(value);
  const device_type = is_bot ? "Bot" : /smart-tv|smarttv|hbbtv|appletv/.test(value) ? "TV" : /playstation|xbox|nintendo/.test(value) ? "Console" : /ipad|tablet|kindle|silk\//.test(value) || (/android/.test(value) && !/mobile/.test(value)) ? "Tablet" : /mobile|android|iphone|ipod/.test(value) ? "Phone" : "Desktop";
  const androidModel = userAgent.match(/Android[^;)]*;\s*(?:[a-z]{2}[-_][a-z]{2};\s*)?([^;)]+?)(?:\s+Build\/|;\s*wv|\))/i)?.[1]?.trim();
  const device_model = androidModel || (value.includes("iphone") ? "iPhone" : value.includes("ipad") ? "iPad" : value.includes("macintosh") ? "Mac" : value.includes("windows") ? "Windows PC" : value.includes("cros") ? "Chromebook" : "Unknown");
  const device_vendor = inferDeviceVendor(device_model);
  const browserMatch = userAgent.match(/(?:Edg|OPR|Chrome|CriOS|Firefox|FxiOS|Version)\/([\d.]+)/i);
  const browser = /edg\//.test(value) ? "Microsoft Edge" : /opr\//.test(value) ? "Opera" : /crios\//.test(value) ? "Chrome Mobile" : /chrome\//.test(value) && !value.includes("chromium") ? "Chrome" : /fxios\//.test(value) ? "Firefox Mobile" : /firefox\//.test(value) ? "Firefox" : /safari\//.test(value) ? "Safari" : "Unknown";
  const browser_version = browserMatch?.[1] || "";
  const androidVersion = userAgent.match(/Android\s+([\d.]+)/i)?.[1];
  const iosVersion = userAgent.match(/OS\s([\d_]+)/i)?.[1]?.replaceAll("_", ".");
  const windowsVersion = userAgent.match(/Windows NT\s([\d.]+)/i)?.[1];
  const macVersion = userAgent.match(/Mac OS X\s([\d_]+)/i)?.[1]?.replaceAll("_", ".");
  const os = value.includes("android") ? "Android" : /iphone|ipad|ipod/.test(value) ? "iOS" : value.includes("windows") ? "Windows" : /mac os|macintosh/.test(value) ? "macOS" : value.includes("cros") ? "ChromeOS" : value.includes("linux") ? "Linux" : "Unknown";
  const os_version = androidVersion || iosVersion || windowsVersion || macVersion || "";
  return { device_type, device_model, device_vendor, browser, browser_version, os, os_version, is_bot };
}
