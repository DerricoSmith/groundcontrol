import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/site";
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

// Shared with the sitemap and robots so all three agree on the canonical URL.
// See src/lib/site.ts for why it resolves defensively.

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
