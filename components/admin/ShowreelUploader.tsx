"use client";

import { useRouter } from "next/navigation";
import { adminJson } from "@/lib/adminApi";
import { useToast } from "@/components/ui/Toast";
import MediaUploader, { type UploadResult } from "./MediaUploader";

export default function ShowreelUploader() {
  const router = useRouter();
  const toast = useToast();

  async function finalize(result: UploadResult) {
    const saved = await adminJson("/api/dashboard/content/showreel-video/", { publicUrl: result.publicUrl });
    if (!saved.ok) { toast({ tone: "error", title: "The video uploaded but could not be set as the showreel", message: saved.error }); return; }
    toast({ title: "Showreel updated", message: "It's live on the Showreel page." });
    router.refresh();
  }

  return <MediaUploader kind="video" accept="video/mp4,video/webm,video/quicktime" label="Drop a showreel video" uploadUrl="/api/dashboard/content/showreel-upload-url/" cacheControl="31536000" onUploaded={finalize} />;
}
