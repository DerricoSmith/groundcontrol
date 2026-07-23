"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { LinkButton } from "@/components/dashboard/link-button";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Solo",
    tagline: "For getting your first morning brief running.",
    monthly: 0,
    annual: 0,
    priceSuffix: "forever",
    cta: "Start free",
    features: [
      "1 connected channel (Shopify or Gmail)",
      "Daily Morning Brief",
      "Up to 10 tracked relationships",
      "5 questions a day in Command Center",
      "Community support",
    ],
  },
  {
    name: "Operator",
    tagline: "For a solo business ready to run every morning from one place.",
    monthly: 29,
    annual: 23,
    priceSuffix: "per month",
    cta: "Start free trial",
    highlight: true,
    features: [
      "Everything in Solo",
      "Unlimited connected channels",
      "Full Money Watch + Open Loops",
      "Unlimited Customer Radar relationships",
      "Unlimited Command Center questions",
      "Email support, under 24h response",
    ],
  },
  {
    name: "Studio",
    tagline: "For solopreneurs running ecommerce, consulting, and more at once.",
    monthly: 79,
    annual: 63,
    priceSuffix: "per month",
    cta: "Talk to us",
    features: [
      "Everything in Operator",
      "Multi-stream revenue tracking",
      "Public API + Zapier integration",
      "Priority support + 1:1 onboarding call",
      "Early access to new modules",
    ],
  },
];

const faqs = [
  {
    q: "How long does setup actually take?",
    a: "Most people connect Shopify or Gmail and see their first Morning Brief in under 3 minutes. Notion and Klaviyo take about the same.",
  },
  {
    q: "What if I use a tool that's not listed?",
    a: "Studio includes API and Zapier access, so you can pipe in almost any tool that has a webhook or a Zap.",
  },
  {
    q: "Do I need to be technical to set this up?",
    a: "No. Every native integration uses a one-click OAuth connect button — the same flow you'd use to log into an app with Google.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, anytime. Upgrades apply instantly, and downgrades take effect at the next billing cycle.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = React.useState(true);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/case-study" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-[14px] font-semibold text-text-primary">Ground Control</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/case-study"
            className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to case study
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Pricing</p>
          <h1 className="mt-3 font-serif text-[32px] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-[42px]">
            Priced for the person who is the team.
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-text-secondary">
            No per-seat pricing — a solo operator never adds a second seat. Plans scale with how many revenue
            streams you&apos;re running, not how many people are on your team.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-soft p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                !annual ? "bg-brand text-white" : "text-text-secondary"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                annual ? "bg-brand text-white" : "text-text-secondary"
              )}
            >
              Annual
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold",
                  annual ? "bg-white/20 text-white" : "bg-positive-soft text-positive"
                )}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {tiers.map((tier) => {
            const price = annual ? tier.annual : tier.monthly;
            return (
              <SurfaceCard
                key={tier.name}
                elevated={tier.highlight}
                className={cn("flex h-full flex-col p-6", tier.highlight && "border-2 border-brand")}
              >
                {tier.highlight && (
                  <span className="mb-3 w-fit rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
                    Most popular
                  </span>
                )}
                <h3 className="text-[17px] font-semibold text-text-primary">{tier.name}</h3>
                <p className="mt-1.5 min-h-[40px] text-[13px] leading-relaxed text-text-secondary">{tier.tagline}</p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-[36px] font-semibold tracking-tight text-text-primary tabular-nums">
                    ${price}
                  </span>
                  <span className="text-[13px] text-text-muted">/{tier.priceSuffix === "forever" ? "forever" : "mo"}</span>
                </div>
                {tier.priceSuffix !== "forever" && (
                  <p className="mt-1 text-[12px] text-text-muted">
                    {annual ? `Billed annually ($${price * 12}/yr)` : "Billed monthly"}
                  </p>
                )}

                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-text-secondary">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
                      {f}
                    </li>
                  ))}
                </ul>

                <LinkButton
                  href="/morning-brief"
                  className={cn(
                    "mt-6 justify-center",
                    tier.highlight ? "bg-brand text-white hover:bg-brand-hover" : ""
                  )}
                  variant={tier.highlight ? undefined : "secondary"}
                >
                  {tier.cta} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </LinkButton>
              </SurfaceCard>
            );
          })}
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <h2 className="text-center font-serif text-[22px] font-medium text-text-primary">Questions, answered</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((f) => (
              <SurfaceCard key={f.q} className="p-5">
                <p className="text-[14px] font-semibold text-text-primary">{f.q}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{f.a}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
