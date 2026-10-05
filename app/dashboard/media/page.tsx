import MediaLibrary from "@/components/admin/MediaLibrary";
import PageHeader from "@/components/admin/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { getMediaLibrary } from "@/lib/media";

export const metadata = { title: "Media" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireAdmin("/dashboard/media/");
  const files = await getMediaLibrary();
  return <>
    <PageHeader title="Media" description="Every image and video you've uploaded, and where each one is used." />
    <MediaLibrary files={files} />
  </>;
}
