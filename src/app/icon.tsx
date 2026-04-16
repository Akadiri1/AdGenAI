import { ImageResponse } from "next/og";

// Next.js auto-generates the icon file from this React component.
// Used as the favicon AND app icon at /icon.
//
// Maskable-safe design: the inner 60% (307×307 of 512×512) is the
// "safe zone" — content here is guaranteed visible regardless of how
// the OS crops the icon (circle, squircle, rounded square, etc.).
// Background fills the full 512×512 so there's no transparent gap.
export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF6B35 0%, #F39C12 50%, #2EC4B6 100%)",
        }}
      >
        {/* Letter sized to fit the 60% safe zone (≈307px), with proper visual centering */}
        <span
          style={{
            fontSize: 280,
            fontWeight: 900,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            fontStyle: "italic",
            letterSpacing: -6,
            lineHeight: 1,
            // Slight optical adjustment so the F looks centered (descender-less letters appear high)
            marginTop: -8,
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size },
  );
}
