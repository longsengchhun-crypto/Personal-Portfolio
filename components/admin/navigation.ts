import { FolderKanban, Images, Inbox, LayoutDashboard, Layers, Settings } from "@/components/ui/Icon";

export const ADMIN_NAV = [
  { label: "Overview", href: "/dashboard/", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects/", icon: FolderKanban },
  { label: "Media", href: "/dashboard/media/", icon: Images },
  { label: "Services", href: "/dashboard/services/", icon: Layers },
  { label: "Messages", href: "/dashboard/messages/", icon: Inbox },
  { label: "Settings", href: "/dashboard/settings/", icon: Settings },
] as const;

export const isNavActive = (href: string, path: string) => {
  if (href === "/dashboard/") return path === "/dashboard/";
  if (href === "/dashboard/messages/") return path.startsWith("/dashboard/messages/") || path.startsWith("/dashboard/clients/");
  return path.startsWith(href);
};
