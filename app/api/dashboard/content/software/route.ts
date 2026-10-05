import { crudHandler, order, text } from "@/lib/adminCrud";

export const POST = crudHandler({
  upsert: "dashboard_upsert_software",
  remove: "dashboard_delete_software",
  build: (body) => {
    const name = text(body.name, 120);
    if (!name) return "Give the tool a name.";
    return { p_name: name, p_order: order(body.order) };
  },
});
