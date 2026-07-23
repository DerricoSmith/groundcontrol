export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="14.5" stroke="var(--brand)" strokeOpacity="0.22" strokeWidth="1.5" />
      <ellipse
        cx="16"
        cy="16"
        rx="10.5"
        ry="6.5"
        stroke="var(--brand)"
        strokeOpacity="0.4"
        strokeWidth="1.3"
        transform="rotate(-28 16 16)"
      />
      <circle cx="16" cy="16" r="4" fill="var(--brand)" />
      <circle cx="16" cy="16" r="4" fill="var(--brand)" opacity="0.25">
        <animate attributeName="r" values="4;9;4" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0;0.25" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="25.2" cy="10.3" r="2.1" fill="var(--accent-blue)" />
    </svg>
  );
}
