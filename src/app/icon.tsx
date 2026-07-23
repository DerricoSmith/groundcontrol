import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
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
          background: "#0b1020",
          borderRadius: "8px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14.5" stroke="#8b7cff" strokeOpacity="0.35" strokeWidth="1.5" />
          <ellipse cx="16" cy="16" rx="10.5" ry="6.5" stroke="#8b7cff" strokeOpacity="0.55" strokeWidth="1.3" transform="rotate(-28 16 16)" />
          <circle cx="16" cy="16" r="4.5" fill="#8b7cff" />
          <circle cx="25.2" cy="10.3" r="2.3" fill="#38bdf8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
