import { NextRequest, NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/customerAuth";

export async function POST(request: NextRequest) {
  await clearCustomerSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
