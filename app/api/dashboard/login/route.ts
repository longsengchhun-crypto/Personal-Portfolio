import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, validAdminCredentials } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");
  if (!validAdminCredentials(username, password)) return NextResponse.redirect(new URL("/dashboard/login/?error=1", request.url), 303);
  await createAdminSession();
  return NextResponse.redirect(new URL("/dashboard/", request.url), 303);
}
