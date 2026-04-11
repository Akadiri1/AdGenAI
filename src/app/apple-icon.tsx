import { ImageResponse } from "next/og";

// Apple touch icon for iOS home screen
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -3,
          borderRadius: 36,
        }}
      >
        F
      </div>
    ),
    { ...size },
  );
}
