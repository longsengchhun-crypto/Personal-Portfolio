import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { suggestCategory } from "@/lib/productCategorization";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = process.env.SUPABASE_DASHBOARD_TOKEN;
  const body = await request.json().catch(() => ({}));

  if (body.action === "delete") {
    const supabase = getSupabase();
    const { error } = await supabase.rpc("dashboard_delete_product", { p_token: token, p_id: body.id });
    if (!error) return NextResponse.json({ ok: true });

    // Orders keep a hard reference to the product they bought (foreign key, on delete restrict) so
    // customers' purchase history and downloads never break. Such a product can't be erased — hide
    // it from the store instead (draft), which is what "delete" means to a shop owner here.
    if (error.code === "23503") {
      const { data: product } = await supabase.rpc("dashboard_store_product", { p_token: token, p_id: body.id });
      if (product) {
        const hidden = await POST(new NextRequest(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ ...product, status: "draft" }) }));
        if (hidden.ok) return NextResponse.json({ ok: true, archived: true });
      }
      return NextResponse.json({ error: "This product has customer orders, so it can't be erased. Set it to Draft to hide it from the store." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const supabase = getSupabase();

  // Auto-categorize only on first creation, and only when the admin hasn't picked a category —
  // never overrides a later, deliberate choice (including deliberately clearing it back to
  // "Uncategorized" on an edit, which looks identical to "never set" from here otherwise).
  let categoryId: number | null = body.category_id || null;
  if (!body.id && !categoryId) {
    const { data: existingCategories } = await supabase.from("product_categories").select("id, name, slug").order("order");
    const suggestion = suggestCategory({ title, short_description: body.short_description, tags: body.tags, file_formats: body.file_formats }, existingCategories ?? []);
    if (suggestion && "categoryId" in suggestion) {
      categoryId = suggestion.categoryId;
    } else if (suggestion && "newCategoryName" in suggestion) {
      const { data: newId } = await supabase.rpc("dashboard_upsert_product_category", {
        p_token: token, p_id: null, p_name: suggestion.newCategoryName, p_order: (existingCategories ?? []).length,
      });
      // Never let a category-creation hiccup (e.g. a name collision from a concurrent save)
      // block the actual product save — worst case the product just lands as Uncategorized,
      // same as if auto-categorization had found nothing at all.
      if (typeof newId === "number") categoryId = newId;
    }
  }

  const { data, error } = await supabase.rpc("dashboard_upsert_product", {
    p_token: token,
    p_id: body.id || null,
    p_category_id: categoryId,
    p_title: title,
    p_slug: slug,
    p_short_description: body.short_description || "",
    p_description: body.description || "",
    p_price_usd: Number(body.price_usd) || 0,
    p_price_khr: Number(body.price_khr) || 0,
    p_tags: body.tags || "",
    p_software: body.software || "",
    p_file_formats: body.file_formats || "",
    p_polygon_count: body.polygon_count || "",
    p_texture_info: body.texture_info || "",
    p_dimensions: body.dimensions || "",
    p_file_size: body.file_size || "",
    p_version: body.version || "",
    p_license: body.license || "",
    p_compatibility: body.compatibility || "",
    p_requirements: body.requirements || "",
    p_notes: body.notes || "",
    p_cover_image: body.cover_image || "",
    p_preview_video: body.preview_video || "",
    p_viewer_model: body.viewer_model || "",
    p_is_featured: Boolean(body.is_featured),
    p_status: body.status === "published" ? "published" : "draft",
    p_order: Number(body.order) || 0,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data });
}
