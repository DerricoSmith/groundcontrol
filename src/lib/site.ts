/**
 * The canonical public URL for this deployment.
 *
 * Resolved defensively and shared by the root layout, the sitemap, and robots
 * so all three agree. A malformed or missing NEXT_PUBLIC_APP_URL degrades to a
 * sensible default rather than failing the build, which is exactly what an
 * unguarded `new URL()` did on the first v1.0.0 production deploy.
 *
 * Vercel supplies VERCEL_PROJECT_PRODUCTION_URL without a scheme.
 */
function resolveSiteUrl(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
    "http://localhost:3000",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return new URL(candidate);
    } catch {
      // Try the next candidate rather than taking the build down.
    }
  }
  return new URL("http://localhost:3000");
}

export const siteUrl = resolveSiteUrl();
