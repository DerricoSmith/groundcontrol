import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(150deg, #14102b 0%, #0b1020 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14.5" stroke="#8b7cff" strokeOpacity="0.4" strokeWidth="1.5" />
            <ellipse cx="16" cy="16" rx="10.5" ry="6.5" stroke="#8b7cff" strokeOpacity="0.6" strokeWidth="1.3" transform="rotate(-28 16 16)" />
            <circle cx="16" cy="16" r="4.5" fill="#8b7cff" />
            <circle cx="25.2" cy="10.3" r="2.3" fill="#38bdf8" />
          </svg>
          <span style={{ fontSize: 30, fontWeight: 600, color: "#f8fafc" }}>Ground Control</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 54,
            fontWeight: 600,
            lineHeight: 1.15,
            color: "#f8fafc",
            maxWidth: 950,
          }}
        >
          Wake up knowing what changed, who needs you, and where the money is stuck.
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 26, color: "#cbd5e1" }}>
          A daily operating cockpit for solopreneurs — portfolio product concept
        </div>
      </div>
    ),
    { ...size }
  );
}
