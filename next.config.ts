import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * The content security policy is strict about where content may come from and
 * permissive about inline styles, which Tailwind and the theme script both
 * require. script-src allows 'unsafe-inline' because Next.js bootstraps with
 * inline scripts and the theme provider sets the colour scheme before paint to
 * avoid a flash. Removing that needs a nonce threaded through the App Router,
 * which is recorded as a follow-up in CONTENT_SECURITY_POLICY.md rather than
 * half-done here.
 *
 * connect-src stays same-origin because the browser makes no third party
 * requests. The AI provider is called server side only, so a key can never be
 * exposed through a request the browser makes.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  // frame-ancestors covers modern browsers; this covers the rest.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The product needs none of these capabilities, so none are granted.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Authenticated surfaces must never be indexed. A header is more
        // reliable than per-page metadata because it cannot be forgotten when
        // a new route is added under one of these prefixes.
        source:
          "/:path(mission-control|customers|risks|renewals|actions|escalations|executive-briefs|imports|data-quality|organization|onboarding)/:rest*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
