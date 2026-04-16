import { ImageResponse } from "next/og";

// Next.js auto-generates the icon file from this React component.
// Used as the favicon AND app icon at /icon.
//
// Cluely-style geometric mark: four rounded shapes in a 2×2 grid,
// each in a distinct brand colour, on the dark brand background.
// Maskable-safe: the four shapes sit within the innermost 60% safe zone.
export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  const gap = 16;
  const pad = 100; // padding to keep shapes in maskable safe zone
  const cellW = (512 - pad * 2 - gap) / 2;
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
            width: pad * 2 + gap + cellW * 2 - pad * 2 + pad,
            gap: gap,
          }}
        >
          {/* Top-left — coral */}
          <div style={{ width: cellW, height: cellH, borderRadius: 28, background: "#FF6B35" }} />
          {/* Top-right — gold */}
          <div style={{ width: cellW, height: cellH, borderRadius: "28px 40px 40px 28px", background: "#F39C12" }} />
          {/* Bottom-left — purple */}
          <div style={{ width: cellW, height: cellH, borderRadius: "28px 28px 28px 40px", background: "#A855F7" }} />
          {/* Bottom-right — teal */}
          <div style={{ width: cellW, height: cellH, borderRadius: 40, background: "#2EC4B6" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}

