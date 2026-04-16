import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Famousli — Create Professional Ads in 30 Seconds with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF6B35 0%, #F39C12 50%, #2EC4B6 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {/* 4-shape geometric logo mark inline */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              width: 68,
              gap: 4,
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FF6B35" }} />
            <div style={{ width: 32, height: 32, borderRadius: "8px 10px 10px 8px", background: "#F39C12" }} />
            <div style={{ width: 32, height: 32, borderRadius: "8px 8px 8px 10px", background: "#A855F7" }} />
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#2EC4B6" }} />
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, color: "white" }}>Famousli</div>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            maxWidth: 950,
          }}
        >
          Professional Ads in 30 Seconds with AI
        </div>
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.9)",
            marginTop: 24,
            maxWidth: 900,
          }}
        >
          Type your business → AI generates copy, images, video, and posts everywhere
        </div>
      </div>
    ),
    { ...size },
  );
}
