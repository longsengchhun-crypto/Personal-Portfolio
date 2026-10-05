"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const TRACK_URL = "/api/track-visit/";

type NavigatorWithHints = Navigator & {
  userAgentData?: { platform?: string; getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platformVersion?: string; fullVersionList?: { brand: string; version: string }[] }> };
  connection?: { effectiveType?: string; type?: string };
  deviceMemory?: number;
};

// One anonymous page-view per path per browser session. Failures are silent by design.
export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const key = `portfolio-track:${pathname}`;
    try { if (sessionStorage.getItem(key)) return; } catch { /* storage blocked: track anyway */ }
    const nav = navigator as NavigatorWithHints;
    (async () => {
      let hints: Record<string, string> = {};
      try {
        const high = await nav.userAgentData?.getHighEntropyValues?.(["model", "platformVersion", "fullVersionList"]);
        const browser = high?.fullVersionList?.find((item) => !/not.?a.?brand/i.test(item.brand));
        if (high) hints = { deviceModel: high.model || "", osVersion: high.platformVersion || "", browserVersion: browser?.version || "" };
      } catch { /* reduced user-agent data is expected in privacy-focused browsers */ }
      const connection = nav.connection;
      const response = await fetch(TRACK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
        body: JSON.stringify({
          path: pathname, referrer: document.referrer, platform: nav.userAgentData?.platform || nav.platform || "",
          language: nav.language || "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
          screenWidth: window.screen?.width ?? null, screenHeight: window.screen?.height ?? null,
          viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
          connectionType: connection?.effectiveType || connection?.type || "",
          cpuCores: nav.hardwareConcurrency || null, deviceMemory: nav.deviceMemory || null,
          touchSupport: (nav.maxTouchPoints || 0) > 0, ...hints,
        }),
      });
      if (response.ok) { try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ } }
    })().catch(() => {});
  }, [pathname]);
  return null;
}
