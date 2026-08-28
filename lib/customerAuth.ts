import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "portfolio-customer";

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  return new TextEncoder().encode(`customer:${value}`);
}

export type CustomerSession = { id: number; email: string; fullName: string };

export async function createCustomerSession(customer: CustomerSession) {
  const token = await new SignJWT(customer).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  (await cookies()).set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearCustomerSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getCustomer(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.id !== "number" || typeof payload.email !== "string") return null;
    return { id: payload.id, email: payload.email, fullName: String(payload.fullName || "") };
  } catch {
    return null;
  }
}
