import Link from "next/link";
import {
  ArrowRight,
  Sunrise,
  Users2,
  WalletCards,
  Sparkles,
  ShieldCheck,
  Lock,
  Layers,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { LinkButton } from "@/components/dashboard/link-button";
import { ProductTour } from "@/components/case-study/product-tour";
import { Footer } from "@/components/layout/footer";
import { navItems } from "@/components/layout/nav-items";

const workflows = navItems;

const valueProps = [
  { icon: Sunrise, title: "What changed overnight", body: "A daily brief that reads your business back to you before you open a single tab." },
  { icon: Users2, title: "Who needs you", body: "Relationship memory, not a CRM — the people worth a reply before they become a problem." },
  { icon: WalletCards, title: "Where money is stuck", body: "Every overdue invoice and stalled deal, surfaced in one place instead of six." },
  { icon: Sparkles, title: "What to do next", body: "An AI that notices faster than a busy person can, without making the call for them." },
];

const trustNotes = [
  { icon: Lock, label: "No login required" },
  { icon: Layers, label: "Mock data only" },
  { icon: ShieldCheck, label: "No real integrations or payments" },
];

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-[14px] font-semibold text-text-primary">Ground Control</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LinkButton href="/morning-brief" className="bg-brand text-white hover:bg-brand-hover">
            Launch Demo <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </LinkButton>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Portfolio product concept</p>
          <h1 className="mt-4 font-serif text-[34px] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-[46px]">
            Wake up knowing what changed, who needs you, and where the money is stuck.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-text-secondary">
            Most business software assumes there is a team behind the work. Ground Control is a daily operating
            cockpit built for the person who <em className="not-italic font-medium text-text-primary">is</em> the
            team.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <LinkButton href="/morning-brief" className="bg-brand text-white hover:bg-brand-hover">
              Launch Demo <ArrowRight className="ml-1 h-4 w-4" />
            </LinkButton>
            <LinkButton href="/case-study" variant="secondary">
              Read the full case study
            </LinkButton>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {trustNotes.map((t) => (
              <span key={t.label} className="flex items-center gap-1.5 text-[12.5px] text-text-muted">
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Value props */}
        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((v) => (
            <SurfaceCard key={v.title} className="p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft">
                <v.icon className="h-[16px] w-[16px] text-brand" strokeWidth={2} />
              </div>
              <p className="mt-3 text-[13.5px] font-semibold text-text-primary">{v.title}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-secondary">{v.body}</p>
            </SurfaceCard>
          ))}
        </div>

        {/* Live product tour */}
        <SurfaceCard className="mt-14 p-5 sm:p-7">
          <div className="mb-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">See it in action</p>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight text-text-primary">
              Desktop and mobile, live — not screenshots.
            </h2>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              Mobile is the primary experience for a solopreneur checking in between meetings. Toggle below to see
              both.
            </p>
          </div>
          <div className="mt-5">
            <ProductTour />
          </div>
        </SurfaceCard>

        {/* Modules */}
        <div className="mt-14">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Inside the cockpit</p>
          <h2 className="mt-1.5 text-[20px] font-semibold tracking-tight text-text-primary">Six modules, one source of truth.</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((m) => (
            <SurfaceCard key={m.href} className="p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft">
                  <m.icon className="h-[15px] w-[15px] text-brand" strokeWidth={2} />
                </div>
                <h3 className="text-[14px] font-semibold text-text-primary">{m.label}</h3>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{m.description}</p>
            </SurfaceCard>
          ))}
        </div>

        {/* Condensed case study */}
        <SurfaceCard elevated className="brief-gradient mt-14 p-6 sm:p-8">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">The story behind it</p>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">Why I built it</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
                Every solo business I looked at closely was scattered across Shopify, Stripe, Gmail, and a dozen
                notes-app reminders. I wanted one place that told the story connecting them, automatically, every
                morning.
              </p>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">Who it&apos;s for</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
                The operator running ecommerce and consulting side by side, or a creator with a paid community —
                anyone whose business doesn&apos;t fit one platform&apos;s dashboard, because it was never meant to.
              </p>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">How AI fits</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
                AI should not replace judgment — it should help the owner see what matters faster. Command Center
                surfaces the signal and a plainly-worded recommendation, then gets out of the way.
              </p>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-text-primary">What this shows about my work</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">
                Customer experience thinking, systems design across one shared data model, and product judgment
                about where AI should — and shouldn&apos;t — make the call.
              </p>
            </div>
          </div>
          <LinkButton href="/case-study" variant="secondary" className="mt-6">
            Read the full case study <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </LinkButton>
        </SurfaceCard>

        {/* Final CTA */}
        <SurfaceCard className="mt-14 flex flex-col items-center gap-4 p-8 text-center">
          <h2 className="font-serif text-[24px] font-medium tracking-tight text-text-primary">
            Ready to see it run?
          </h2>
          <p className="max-w-md text-[14px] text-text-secondary">
            No sign-up, no setup — jump straight into the Morning Brief with realistic mock data.
          </p>
          <LinkButton href="/morning-brief" className="bg-brand text-white hover:bg-brand-hover">
            Launch Demo <ArrowRight className="ml-1 h-4 w-4" />
          </LinkButton>
          <p className="text-[12.5px] text-text-muted">
            Prefer your own data saved for real?{" "}
            <Link href="/signup" className="font-medium text-brand hover:text-brand-hover">
              Create a free account
            </Link>
          </p>
        </SurfaceCard>

        <div className="mt-4">
          <Footer />
        </div>
      </main>
    </div>
  );
}
