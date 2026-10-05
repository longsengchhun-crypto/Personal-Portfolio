"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

// Site-wide "no refresh needed" sync: silently re-fetches the current page's server data
// whenever the admin adds/edits/removes a category, portfolio project, service, skill,
// software entry, site setting, or social link, so an open tab picks it up on its own.
const WATCHED_TABLES = [
  "categories", "projects", "services",
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

    let channel: ReturnType<typeof supabase.channel> | null = null;
    function connect() {
      if (channel) return;
      channel = supabase.channel("site-content-sync");
      for (const table of WATCHED_TABLES) {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
      }
      channel.subscribe();
    }
    function disconnect() {
      if (channel) supabase.removeChannel(channel);
      channel = null;
    }
    // An open WebSocket keeps a page out of the browser's back/forward cache, so it is closed when the
    // page is put away and reopened (with a refresh, in case something changed) when it comes back.
    const onPageShow = (event: PageTransitionEvent) => { connect(); if (event.persisted) router.refresh(); };
    connect();
    window.addEventListener("pagehide", disconnect);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("pagehide", disconnect);
      window.removeEventListener("pageshow", onPageShow);
      disconnect();
    };
  }, [router]);

  return null;
}
