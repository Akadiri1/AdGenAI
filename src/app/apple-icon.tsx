import { ImageResponse } from "next/og";

// Apple touch icon for iOS home screen.
// Uses the same Cluely-style 4-shape geometric mark on dark background.
// iOS rounds the corners itself, so we fill the full canvas.
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const gap = 6;
  const pad = 36;
  const cellW = (180 - pad * 2 - gap) / 2;
  const cellH = cellW;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1A2E",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: cellW * 2 + gap,
            gap: gap,
          }}
        >
          <div style={{ width: cellW, height: cellH, borderRadius: 10, background: "#FF6B35" }} />
          <div style={{ width: cellW, height: cellH, borderRadius: "10px 14px 14px 10px", background: "#F39C12" }} />
          <div style={{ width: cellW, height: cellH, borderRadius: "10px 10px 10px 14px", background: "#A855F7" }} />
          <div style={{ width: cellW, height: cellH, borderRadius: 14, background: "#2EC4B6" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}

