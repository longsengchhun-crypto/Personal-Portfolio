import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "portfolio-admin";

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return new TextEncoder().encode(value);
}

const digest = (value: string) => createHash("sha256").update(value).digest();

export function validAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  const userOk = timingSafeEqual(digest(username), digest(expectedUser));
  const passOk = timingSafeEqual(digest(password), digest(expectedPass));
  return userOk && passOk;
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "portfolio-admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(secret());
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "portfolio-admin";
  } catch {
    return false;
  }
}

export async function requireAdmin(returnTo?: string) {
  if (!(await isAdmin())) redirect(returnTo ? `/dashboard/login/?next=${encodeURIComponent(returnTo)}` : "/dashboard/login/");
}
