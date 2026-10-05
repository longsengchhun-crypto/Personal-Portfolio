import { ImageResponse } from "next/og";
import { OWNER } from "@/lib/content";

export const alt = `${OWNER.name} — ${OWNER.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social preview: a dark title card in the site's own palette.
export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, background: "linear-gradient(135deg, #0d0f12 0%, #07080a 60%, #1a1409 100%)", color: "#f4f2ee" }}>
      <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#d9a94b" }}>{OWNER.title}</div>
      <div style={{ display: "flex", fontSize: 128, fontWeight: 700, letterSpacing: -5, lineHeight: 0.95, marginTop: 18 }}>Long Sengchhun</div>
      <div style={{ display: "flex", fontSize: 30, color: "#a9a69f", marginTop: 26 }}>VFX · Film · Photography · Motion · 3D</div>
    </div>,
    size,
  );
}
