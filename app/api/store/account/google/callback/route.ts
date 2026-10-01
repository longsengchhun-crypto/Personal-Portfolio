import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createCustomerSession } from "@/lib/customerAuth";
import { safeInternalPath } from "@/lib/safeRedirect";
import { getSupabase } from "@/lib/supabase";

const STATE_COOKIE = "google_oauth_state";

function safeNext(value: string) {
  return safeInternalPath(value, "/", "/account/");
}

function fail(request: NextRequest, next: string, reason: string) {
  return NextResponse.redirect(new URL(`/account/login/?error=${reason}&next=${encodeURIComponent(next)}`, request.url), 303);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const [nonce, encodedNext] = state.split(".");
  const next = safeNext(decodeURIComponent(encodedNext || ""));

  const jar = await cookies();
  const expectedNonce = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  if (url.searchParams.get("error")) return fail(request, next, "google");
  if (!code || !nonce || !expectedNonce || nonce !== expectedNonce) return fail(request, next, "google");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(request, next, "google_unavailable");

  const redirectUri = `${url.origin}/api/store/account/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  if (!tokenResponse.ok) return fail(request, next, "google");
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) return fail(request, next, "google");

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileResponse.ok) return fail(request, next, "google");
  const profile = (await profileResponse.json()) as { email?: string; email_verified?: boolean; name?: string };
  if (!profile.email || !profile.email_verified) return fail(request, next, "google_unverified");

  const { data, error } = await getSupabase().rpc("upsert_google_customer", { p_email: profile.email, p_full_name: profile.name || "" });
  if (error || !data) return fail(request, next, "google");

  await createCustomerSession({ id: data.id, email: data.email, fullName: data.full_name });
  return NextResponse.redirect(new URL(next, request.url), 303);
}
