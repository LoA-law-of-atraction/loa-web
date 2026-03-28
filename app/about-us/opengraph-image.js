import { ImageResponse } from "next/og";

export const alt = "About LoA — Law of Attraction App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background:
            "linear-gradient(135deg, #3949AB 0%, #6A1B9A 45%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: 64,
        }}
      >
        <div
          style={{
            fontSize: 28,
            opacity: 0.92,
            marginBottom: 20,
            fontWeight: 500,
          }}
        >
          LoA · Law of Attraction
        </div>
        <div style={{ fontSize: 58, fontWeight: 700 }}>About Us</div>
      </div>
    ),
    { ...size }
  );
}
