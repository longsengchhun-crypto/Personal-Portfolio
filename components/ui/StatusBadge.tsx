import { INQUIRY_STATUS_LABELS } from "@/lib/content";

const PROJECT_LABELS: Record<string, string> = { published: "Published", draft: "Draft" };

export function StatusBadge({ status, kind = "inquiry" }: { status: string; kind?: "inquiry" | "project" }) {
  const label = kind === "project" ? PROJECT_LABELS[status] || status : INQUIRY_STATUS_LABELS[status] || status;
  const tone = kind === "project" ? (status === "published" ? "live" : "draft") : status;
  return <span className={`badge badge--${tone}`}>{label}</span>;
}
