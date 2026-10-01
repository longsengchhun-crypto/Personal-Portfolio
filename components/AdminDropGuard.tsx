"use client";

import { useEffect } from "react";

// A file dropped anywhere outside an upload zone would make the browser open it and leave the
// admin page, losing unsaved work. Swallow those stray drops; real drop zones still work.
export default function AdminDropGuard() {
  useEffect(() => {
    const inZone = (event: DragEvent) => (event.target as Element | null)?.closest?.(".showreel-dropzone");
    const guard = (event: DragEvent) => { if (!inZone(event)) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = "none"; } };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => { window.removeEventListener("dragover", guard); window.removeEventListener("drop", guard); };
  }, []);
  return null;
}
