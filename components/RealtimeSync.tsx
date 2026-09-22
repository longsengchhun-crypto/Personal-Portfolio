"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

// Site-wide "no refresh needed" sync: silently re-fetches the current page's server data
// whenever the admin adds/edits/removes a category, portfolio project, service, skill,
// software entry, site setting, or social link, so an open tab picks it up on its own.
// Deliberately excludes `products` — the 3D store grid already has its own realtime channel
// (StoreLiveGrid) that updates rows in place instead of a full page refetch, which avoids the
// flicker/scroll-jump a router.refresh() would cause on that specific, high-traffic list.
const WATCHED_TABLES = [
  "product_categories", "categories", "projects", "services",
  "skill_groups", "skills", "software_tools", "site_settings", "social_links",
] as const;

export default function RealtimeSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Debounced, not instant — an admin bulk-editing several rows in a row (e.g. reordering a
    // whole skill group) fires several events within milliseconds; batching them into one
    // refresh avoids a burst of redundant re-renders.
    function scheduleRefresh() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => router.refresh(), 400);
    }

    const channel = supabase.channel("site-content-sync");
    for (const table of WATCHED_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    }
    channel.subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
