import type { MetadataRoute } from "next";
import { OWNER } from "@/lib/content";

// Lets the site be added to a phone's home screen with the right name, colours and icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${OWNER.name} | ${OWNER.title}`,
    short_name: "Sengchhun",
    description: "Portfolio of Long Sengchhun: VFX, videography, photography, motion and 3D.",
    start_url: "/",
    display: "standalone",
    background_color: "#07080a",
    theme_color: "#07080a",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
