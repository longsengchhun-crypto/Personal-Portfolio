import { crudHandler, order, text } from "@/lib/adminCrud";

export const POST = crudHandler({
  upsert: "dashboard_upsert_skill_group",
  remove: "dashboard_delete_skill_group",
  build: (body) => {
    const name = text(body.name, 120);
    if (!name) return "Give the group a name.";
    return { p_name: name, p_order: order(body.order) };
  },
});
