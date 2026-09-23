import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getCustomer } from "@/lib/customerAuth";

// Reading cookies for the nav's account pill used to happen in the root layout, which forces
// every single page on the site into fully dynamic, uncached rendering (Next's dynamic-API
// rule applies to the whole route, not just the layout) — even pages with almost-static content
// like the homepage. Moving the cookie read here, fetched client-side by Nav, lets those pages
// be cached/ISR'd instead while the account pill still resolves correctly a moment after paint.
export async function GET() {
  const [admin, customer] = await Promise.all([isAdmin(), getCustomer()]);
  return NextResponse.json(
    { isAdmin: admin, customerName: customer?.fullName || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
