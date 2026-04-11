import { ImageResponse } from "next/og";

// Next.js auto-generates the icon file from this React component.
// Used as the favicon and app icon at /icon.
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
          color: "white",
          fontSize: 340,
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -8,
          borderRadius: 96,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
