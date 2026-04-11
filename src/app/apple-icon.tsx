import { ImageResponse } from "next/og";

// Apple touch icon for iOS home screen.
// iOS doesn't apply maskable cropping — it just rounds the corners — so
// we can use a slightly larger F here than in the maskable Android icon.
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
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 900,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -3,
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          F
        </span>
      </div>
    ),
    { ...size },
  );
}
