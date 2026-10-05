import { getHeroSlides } from "@/lib/heroSlides";
import { getSupabaseAdmin } from "@/lib/supabase";

export const MEDIA_FOLDERS = ["projects/media", "projects/covers", "projects/gallery"] as const;
export const isManagedMediaPath = (path: string) => !path.includes("..") && MEDIA_FOLDERS.some((folder) => path.startsWith(`${folder}/`));

export type MediaUser = { label: string; href: string };
export type MediaFile = { path: string; name: string; size: number; mimeType: string; kind: "image" | "video"; createdAt: string; uses: MediaUser[] };

/** Where each uploaded file is referenced on the site: path → the projects / slides using it. */
export async function getMediaUsage() {
  const admin = getSupabaseAdmin();
  const [{ data: projects }, { data: gallery }, hero] = await Promise.all([
    admin.from("projects").select("id, title, cover_image, video_file, before_image, after_image"),
    admin.from("project_gallery_items").select("project_id, image, video_file"),
    getHeroSlides(),
  ]);
  const usage = new Map<string, MediaUser[]>();
  const add = (path: string | null | undefined, user: MediaUser) => {
    if (!path) return;
    const list = usage.get(path) ?? [];
    if (!list.some((existing) => existing.label === user.label)) list.push(user);
    usage.set(path, list);
  };
  const titles = new Map((projects ?? []).map((project) => [project.id, project.title as string]));
  for (const project of projects ?? []) {
    const user = { label: project.title as string, href: `/dashboard/projects/${project.id}/` };
    [project.cover_image, project.video_file, project.before_image, project.after_image].forEach((path) => add(path, user));
  }
  for (const item of gallery ?? []) {
    const title = titles.get(item.project_id);
    if (title) { const user = { label: title, href: `/dashboard/projects/${item.project_id}/` }; add(item.image, user); add(item.video_file, user); }
  }
  if (!hero.isDefault) for (const slide of hero.slides) add(slide.image, { label: "Homepage hero", href: "/dashboard/settings/?tab=homepage" });
  return usage;
}

export async function getMediaLibrary(): Promise<MediaFile[]> {
  const bucket = getSupabaseAdmin().storage.from("portfolio-media");
  const [usage, ...folders] = await Promise.all([
    getMediaUsage(),
    ...MEDIA_FOLDERS.map((folder) => bucket.list(folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } })),
  ]);
  const files: MediaFile[] = [];
  folders.forEach(({ data }, index) => {
    for (const entry of data ?? []) {
      if (!entry.id) continue; // sub-folder placeholder
      const mimeType = String((entry.metadata as { mimetype?: string } | null)?.mimetype || "");
      const path = `${MEDIA_FOLDERS[index]}/${entry.name}`;
      const kind = mimeType.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(entry.name) ? "video" : "image";
      files.push({ path, name: entry.name, size: Number((entry.metadata as { size?: number } | null)?.size || 0), mimeType, kind, createdAt: entry.created_at || "", uses: usage.get(path) ?? [] });
    }
  });
  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
