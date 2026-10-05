import Skeleton from "@/components/ui/Skeleton";

// Shown while the next page streams in, so navigation never looks frozen.
export default function SiteLoading() {
  // Tall enough to keep the footer below the fold, so swapping in the real page never shifts it into view.
  return <div className="wrap page-head" style={{ minHeight: "100svh" }} aria-busy="true" aria-label="Loading">
    <Skeleton style={{ height: 14, width: 120 }} />
    <Skeleton style={{ height: "clamp(64px, 12vw, 150px)", width: "min(70%, 560px)" }} />
    <Skeleton style={{ height: 22, width: "min(90%, 420px)" }} />
    <Skeleton style={{ height: "clamp(180px, 34vw, 420px)", width: "100%", borderRadius: 24, marginTop: 24 }} />
  </div>;
}
