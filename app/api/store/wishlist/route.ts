import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/lib/customerAuth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const productId = Number(body?.product_id);
  if (!Number.isInteger(productId)) return NextResponse.json({ error: "invalid_product" }, { status: 400 });

  const { data, error } = await getSupabase().rpc("toggle_wishlist_item", { p_customer_id: customer.id, p_product_id: productId });
  if (error) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ wishlisted: Boolean(data) });
}
