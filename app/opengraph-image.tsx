import { ImageResponse } from "next/og";
import { OWNER } from "@/lib/content";

export const alt = `${OWNER.name} — ${OWNER.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social preview: a typographic title card in the site's own palette.
export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#f4f1ea", color: "#16140f" }}>
      <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: "#8f3a1d" }}>Filmmaker · Visual creative</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 600, letterSpacing: -4, lineHeight: 1 }}>Long Sengchhun</div>
        <div style={{ display: "flex", fontSize: 30, color: "#5c5850", marginTop: 24 }}>Visual storytelling, from production through post.</div>
        <div style={{ display: "flex", fontSize: 22, color: "#5c5850", marginTop: 12 }}>Phnom Penh, Cambodia</div>
      </div>
    </div>,
    size,
  );
}
