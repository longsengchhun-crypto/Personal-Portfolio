import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const STATE_COOKIE = "google_oauth_state";

function safeNext(value: string | null) {
  return value && value.startsWith("/3d-store/") ? value : "/3d-store/account/";
}

// Kicks off the standard OAuth 2.0 authorization-code flow directly against Google's
// endpoints — no extra auth library, so a signed-in Google customer lands in the exact
// same `customers` table and session cookie as a password account (see the callback route
// and upsert_google_customer). The nonce guards against CSRF; `next` rides inside the same
// state value so no second cookie is needed to remember where to send the customer back.
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (!clientId) {
    return NextResponse.redirect(new URL(`/3d-store/account/login/?error=google_unavailable&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const nonce = randomUUID();
  const state = `${nonce}.${encodeURIComponent(next)}`;
  (await cookies()).set(STATE_COOKIE, nonce, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });

  const redirectUri = `${new URL(request.url).origin}/api/store/account/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl.toString(), 303);
}
