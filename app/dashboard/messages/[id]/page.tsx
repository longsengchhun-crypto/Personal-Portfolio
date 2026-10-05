import { notFound } from "next/navigation";
import MessageThread from "@/components/admin/MessageThread";
import { requireAdmin } from "@/lib/auth";
import { getDashboardInquiry } from "@/lib/data";
import { emailNotificationReadiness } from "@/lib/notifications";
import { mediaUrl } from "@/lib/supabase";

export const metadata = { title: "Message" };
export const dynamic = "force-dynamic";

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  await requireAdmin(`/dashboard/messages/${id}/`);
  const inquiry = Number.isInteger(id) ? await getDashboardInquiry(id) : null;
  if (!inquiry) notFound();
  const readiness = emailNotificationReadiness();
  return <MessageThread key={inquiry.id} inquiry={inquiry} attachmentUrl={inquiry.attachment ? mediaUrl(inquiry.attachment) : ""} emailReady={readiness.configured && readiness.mode === "production"} emailNote={readiness.message} />;
}
