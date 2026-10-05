import Skeleton from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return <div aria-busy="true" aria-label="Loading">
    <Skeleton style={{ height: 40, width: 260, marginBottom: 12 }} />
    <Skeleton style={{ height: 18, width: 420, maxWidth: "100%", marginBottom: 32 }} />
    <div className="adm-kpis">{[0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 96, borderRadius: 16 }} />)}</div>
    <Skeleton style={{ height: 320, borderRadius: 16, marginTop: 16 }} />
  </div>;
}
