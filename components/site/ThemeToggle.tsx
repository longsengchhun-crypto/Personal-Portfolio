"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@/components/ui/Icon";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);
  useEffect(() => { setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"); }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("portfolio-theme", next); } catch { /* private mode: the choice just won't persist */ }
    setTheme(next);
  }

  const light = theme === "light";
  return <button type="button" className={`btn btn--ghost btn--icon btn--sm ${className}`} onClick={toggle} aria-label={light ? "Switch to dark theme" : "Switch to light theme"} aria-pressed={light} title={light ? "Dark theme" : "Light theme"}>
    {light ? <Moon /> : <Sun />}
  </button>;
}
