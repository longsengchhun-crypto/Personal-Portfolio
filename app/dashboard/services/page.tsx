import PageHeader from "@/components/admin/PageHeader";
import RowsEditor, { type Row } from "@/components/admin/RowsEditor";
import { LinkButton } from "@/components/ui/Button";
import { ArrowUpRight } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { getDashboardContent } from "@/lib/data";

export const metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  await requireAdmin("/dashboard/services/");
  const { services } = await getDashboardContent();
  return <>
    <PageHeader title="Services" description="The capabilities listed on the homepage and the Services page. Reorder them, hide one, or add a new one."
      actions={<LinkButton href="/services/" target="_blank" variant="glass"><ArrowUpRight /> View on site</LinkButton>} />
    <RowsEditor endpoint="/api/dashboard/content/services/" noun="service" rows={services as unknown as Row[]}
      fields={[{ key: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Video Editing" }, { key: "is_active", label: "Visibility", type: "switch", text: "Visible on the site" }, { key: "description", label: "Description", type: "textarea", placeholder: "One or two sentences about what this includes." }]}
      blank={{ title: "", description: "", is_active: true }} emptyTitle="No services yet" emptyText="Add your first service below. It will appear on the homepage and the Services page." />
  </>;
}
