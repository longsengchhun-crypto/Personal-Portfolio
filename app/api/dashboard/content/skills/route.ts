import { crudHandler, order, text } from "@/lib/adminCrud";

export const POST = crudHandler({
  upsert: "dashboard_upsert_skill",
  remove: "dashboard_delete_skill",
  build: (body) => {
    const name = text(body.name, 120);
    const groupId = Number(body.group_id) || 0;
    if (!name) return "Give the skill a name.";
    if (!groupId) return "Choose a group for this skill.";
    return { p_group_id: groupId, p_name: name, p_order: order(body.order) };
  },
});
