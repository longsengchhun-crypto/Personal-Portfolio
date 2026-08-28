import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { inferDeviceVendor, parseUserAgent } from "@/lib/validation";

const numberOrNull = (value: unknown) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.floor(Number(value)) : null;
const decimalOrNull = (value: unknown) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const textValue = (value: unknown, length: number) => String(value || "").trim().slice(0, length);
const decodedHeader = (value: string | null) => {
  if (!value) return "";
  try { return decodeURIComponent(value).slice(0, 120); } catch { return value.slice(0, 120); }
};

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
  const sessionKey = request.cookies.get("portfolio-session")?.value || randomUUID();
  const userAgent = request.headers.get("user-agent") || "";
  const parsed = parseUserAgent(userAgent);
  const hintedModel = textValue(payload.deviceModel, 120);
  const deviceModel = hintedModel || parsed.device_model;
  const countryCode = textValue(request.headers.get("x-vercel-ip-country"), 8).toUpperCase();
  let country = countryCode;
  try { country = new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode; } catch { /* Keep the country code. */ }
  const { error } = await getSupabase().from("visitor_events").insert({
    session_key: sessionKey, path: String(payload.path || "/").slice(0, 255),
    referrer: String(payload.referrer || "").slice(0, 1000),
    ip_address: (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
    user_agent: userAgent, ...parsed, device_model: deviceModel,
    device_vendor: inferDeviceVendor(deviceModel) || parsed.device_vendor,
    browser_version: textValue(payload.browserVersion, 40) || parsed.browser_version,
    os_version: textValue(payload.osVersion, 60) || parsed.os_version,
    platform: textValue(payload.platform, 120), language: textValue(payload.language, 40),
    timezone: textValue(payload.timezone, 80), connection_type: textValue(payload.connectionType, 24),
    cpu_cores: numberOrNull(payload.cpuCores), device_memory: decimalOrNull(payload.deviceMemory),
    touch_support: Boolean(payload.touchSupport),
    city: decodedHeader(request.headers.get("x-vercel-ip-city")),
    region: decodedHeader(request.headers.get("x-vercel-ip-country-region")),
    country: country.slice(0, 120), country_code: countryCode,
    screen_width: numberOrNull(payload.screenWidth), screen_height: numberOrNull(payload.screenHeight),
    viewport_width: numberOrNull(payload.viewportWidth), viewport_height: numberOrNull(payload.viewportHeight),
  });
  const response = NextResponse.json({ ok: !error, tracked: !error }, { status: error ? 500 : 200 });
  if (!request.cookies.has("portfolio-session")) response.cookies.set("portfolio-session", sessionKey, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}
