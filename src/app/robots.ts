import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * The public site and the demonstration are indexable. Everything behind
 * authentication is not, and neither is the seed refresh route.
 *
 * This is belt and braces with the X-Robots-Tag header in next.config.ts: a
 * crawler that ignores one should still honour the other.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/mission-control",
        "/customers",
        "/risks",
        "/renewals",
        "/actions",
        "/escalations",
        "/executive-briefs",
        "/imports",
        "/data-quality",
        "/organization",
        "/onboarding",
        "/invite",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
