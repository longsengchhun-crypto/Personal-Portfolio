import { crudHandler, order, text } from "@/lib/adminCrud";

export const POST = crudHandler({
  upsert: "dashboard_upsert_service",
  remove: "dashboard_delete_service",
  build: (body) => {
    const title = text(body.title, 120);
    if (!title) return "Give the service a title.";
    return { p_title: title, p_description: text(body.description, 1000), p_order: order(body.order), p_is_active: body.is_active !== false };
  },
});
