"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 10_000;

export default function DashboardLiveRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
      setLastUpdated(new Date());
    });
  }, [router]);

  useEffect(() => {
    setLastUpdated(new Date());
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  return <div className="live-refresh" role="status" aria-live="polite">
    <span className="live-refresh-state"><span className={`status-dot${isPending ? " is-refreshing" : ""}`} />{isPending ? "Updating" : "Live"}</span>
    <small>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Connecting"} · every 10s</small>
    <button className="btn btn-outline-light live-refresh-button" type="button" onClick={refresh} disabled={isPending}><i className="bi bi-arrow-clockwise" />Refresh now</button>
  </div>;
}
