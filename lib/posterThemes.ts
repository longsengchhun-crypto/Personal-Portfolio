import type { Project } from "@/lib/types";

// Posters are one category; inside it they are grouped by theme, stored in each project's "type".
export const POSTER_THEMES = ["Food & Beverage", "Beauty & Wellness", "Technology & Gaming", "Culture & Festivals", "National & Civic Days", "Travel & Campaigns"] as const;

const rank = (theme: string) => {
  const index = (POSTER_THEMES as readonly string[]).indexOf(theme);
  return index === -1 ? POSTER_THEMES.length : index;
};

/** Known themes first (in their set order), then any custom ones alphabetically. */
export const sortThemes = (themes: string[]) => [...new Set(themes)].filter(Boolean).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

export function groupByTheme(projects: Project[]) {
  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const theme = project.project_type?.trim() || "Other";
    groups.set(theme, [...(groups.get(theme) ?? []), project]);
  }
  const ordered = sortThemes([...groups.keys()].filter((theme) => theme !== "Other"));
  if (groups.has("Other")) ordered.push("Other");
  return ordered.map((theme) => ({ theme, projects: groups.get(theme)! }));
}
