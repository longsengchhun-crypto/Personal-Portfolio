import Inbox from "@/components/admin/Inbox";
import { requireAdmin } from "@/lib/auth";
import { getInquiryList } from "@/lib/data";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

// Master-detail: the list stays put while the open message changes beside it.
export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/dashboard/messages/");
  const rows = await getInquiryList().catch(() => []);
  return <div className="inbox">
    <Inbox rows={rows} />
    <section className="inbox__pane">{children}</section>
  </div>;
}
