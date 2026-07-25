import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600"],
});

/**
 * Resolved defensively. A malformed or missing NEXT_PUBLIC_APP_URL should
 * degrade to a sensible default, never fail the production build, which is
 * exactly what an unguarded `new URL()` here did on the first deploy.
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

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Signal & State. Turn customer signals into action",
    template: "%s | Signal & State",
  },
  description: "Customer intelligence for growing B2B software companies, by Signal & State.",
  applicationName: "Ground Control",
  authors: [{ name: "Signal & State" }],
  creator: "Signal & State",
  keywords: ["customer success", "customer intelligence", "churn risk", "renewals", "B2B SaaS"],
  openGraph: {
    title: "Ground Control by Signal & State",
    description: "Customer intelligence for growing B2B software companies, by Signal & State.",
    url: siteUrl.toString(),
    siteName: "Ground Control",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ground Control by Signal & State",
    description: "Customer intelligence for growing B2B software companies, by Signal & State.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <TooltipProvider delay={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
