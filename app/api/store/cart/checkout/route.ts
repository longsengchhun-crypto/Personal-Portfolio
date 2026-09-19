import { NextRequest, NextResponse } from "next/server";
import { getCustomer } from "@/lib/customerAuth";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const productIds = Array.isArray(body?.product_ids) ? body.product_ids.map(Number).filter((id: number) => Number.isInteger(id)) : [];
  const name = String(body?.customer_name || "").trim();
  const email = String(body?.customer_email || "").trim();
  const phone = String(body?.customer_phone || "").trim();

  if (productIds.length === 0 || !name || !email) return NextResponse.json({ error: "form" }, { status: 400 });

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  const customer = await getCustomer();

  const { data, error } = await getSupabase().rpc("submit_order_batch", {
    p_product_ids: productIds, p_customer_name: name, p_customer_email: email, p_customer_phone: phone,
    p_ip_address: ip, p_customer_id: customer?.id ?? null,
  });

  if (error) {
    const reason = error.message.includes("rate_limited") ? "rate_limited" : "form";
    return NextResponse.json({ error: reason }, { status: 400 });
  }

  return NextResponse.json({ token: data.primary_token, batchId: data.batch_id, itemCount: data.item_count });
}
