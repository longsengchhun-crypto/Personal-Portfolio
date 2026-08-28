import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { accessToken?: string; contentType?: string };
  const extension = ALLOWED[body.contentType || ""];
  if (!extension) return NextResponse.json({ error: "Please upload a JPG, PNG, or WebP screenshot." }, { status: 400 });
  if (!body.accessToken) return NextResponse.json({ error: "Missing order reference." }, { status: 400 });

  const { data: order, error: lookupError } = await getSupabase().rpc("get_order_by_token", { p_access_token: body.accessToken });
  if (lookupError || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "pending_payment") return NextResponse.json({ error: "This order is not awaiting payment." }, { status: 400 });

  const path = `payments/${order.id}/${Date.now()}-${randomUUID()}.${extension}`;
  const { data, error } = await getSupabaseAdmin().storage.from("product-downloads").createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path });
}
