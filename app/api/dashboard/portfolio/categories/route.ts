import { crudHandler, order, text } from "@/lib/adminCrud";

export const POST = crudHandler({
  upsert: "dashboard_upsert_category",
  remove: "dashboard_delete_category",
  build: (body) => {
    const name = text(body.name, 120);
    if (!name) return "Give the category a name.";
    return { p_name: name, p_order: order(body.order) };
  },
});
