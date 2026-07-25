import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Public routes only. Anything behind authentication is deliberately absent,
 * and the demo detail pages are omitted because they are generated from
 * fictional data that can be reseeded; the demo entry points are enough for a
 * crawler to find the demonstration.
 */
const PUBLIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/showcase", priority: 0.9, changeFrequency: "monthly" },
  { path: "/demo", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ground-control", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/trust", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { path: "/demo/accounts", priority: 0.5, changeFrequency: "weekly" },
  { path: "/demo/brief", priority: 0.5, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: new URL(route.path, siteUrl).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
