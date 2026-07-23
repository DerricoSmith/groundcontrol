import { ArrowRight, Sparkles, Layers, Users2, Rocket, Plug, ReceiptText } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { LinkButton } from "@/components/dashboard/link-button";
import { LogoMark } from "@/components/brand/logo-mark";
import { ProductTour } from "@/components/case-study/product-tour";
import { navItems } from "@/components/layout/nav-items";

const workflows = navItems.filter((n) => n.href !== "/case-study");

const buildNext = [
  {
    icon: Plug,
    title: "Onboarding in under 3 minutes",
    body: "A guided setup with native Shopify, Notion, Gmail, and Klaviyo connections — plus a public API and a Zapier integration so anything else can plug in without waiting on a native build.",
  },
  {
    icon: ReceiptText,
    title: "Pricing & packaging",
    body: "A tiered plan that scales with how many revenue streams someone runs, not just seats — since a solo operator never adds a second seat.",
    link: { href: "/pricing", label: "View pricing" },
  },
  {
    icon: Rocket,
    title: "Persistent state",
    body: "A real database so Done, Snooze, and notes survive a refresh — and so the brief can learn from what you actually act on.",
  },
  {
    icon: Sparkles,
    title: "A real language model",
    body: "Swap the keyword-matched response engine for an LLM grounded in the same structured data, with the same restraint about not overstepping judgment.",
  },
];

export default function CaseStudyPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Reveal>
        <div className="mx-auto max-w-3xl">
          <SurfaceCard elevated className="brief-gradient mb-6 p-7 lg:p-10">
            <div className="flex items-center gap-2.5">
              <LogoMark size={30} />
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Case study</p>
            </div>
            <h1 className="mt-5 font-serif text-[30px] font-medium leading-[1.15] tracking-tight text-text-primary sm:text-[40px]">
              Ground Control: a daily operating cockpit for solopreneurs.
            </h1>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-text-secondary">
              Most business software assumes there is a team behind the work. Ground Control is built for the person
              who is the team.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <LinkButton href="/morning-brief" className="bg-brand text-white hover:bg-brand-hover">
                View the live product <ArrowRight className="ml-1 h-4 w-4" />
              </LinkButton>
              <LinkButton href="/pricing" variant="secondary">
                View pricing
              </LinkButton>
            </div>
          </SurfaceCard>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <SurfaceCard className="mb-6 p-5 sm:p-7">
          <div className="mb-1">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">See it in action</h2>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              Mobile is the primary experience — this is the actual product, live, not a screenshot.
            </p>
          </div>
          <div className="mt-4">
            <ProductTour />
          </div>
        </SurfaceCard>
      </Reveal>

      <div className="mx-auto max-w-3xl">
        <Reveal delay={0.08}>
          <SurfaceCard className="mb-6 p-6 lg:p-8">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">Why I built it</h2>
            <p className="mt-2 text-[15.5px] leading-relaxed text-text-secondary">
              I kept noticing the same pattern in every solo business I looked at closely: the owner wasn&apos;t short
              on tools, they were short on a single place that told them what actually mattered that day. Shopify
              tells you about orders. Stripe tells you about payments. Gmail tells you about messages. None of them
              tell you the story that connects them — that the customer with the overdue invoice is also the one who
              just went quiet, or that today&apos;s fastest dollar is sitting in an email you haven&apos;t opened yet.
              I wanted to build the thing that tells that story every morning, automatically.
            </p>
          </SurfaceCard>
        </Reveal>

        <Reveal delay={0.1}>
          <SurfaceCard className="mb-6 p-6 lg:p-8">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">The problem</h2>
            <p className="mt-2 text-[15.5px] leading-relaxed text-text-secondary">
              Solopreneurs do not need another dashboard. They need one morning source of truth. Their business is
              scattered across Gmail, Shopify, Stripe, Notion, a calendar, DMs, invoices, vendor messages, and a
              handful of notes-app reminders that never quite get closed. Every existing tool is built for a team:
              someone to triage the inbox, someone to chase invoices, someone to watch the dashboard. When you&apos;re
              the whole team, that overhead becomes the job itself, and the actual business — the customers, the
              product, the money — gets whatever attention is left over.
            </p>
          </SurfaceCard>
        </Reveal>

        <Reveal delay={0.12}>
          <SurfaceCard className="mb-6 p-6 lg:p-8">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">Who it&apos;s for</h2>
            <p className="mt-2 text-[15.5px] leading-relaxed text-text-secondary">
              Ground Control is built for the operator running an ecommerce shop with a consulting practice on the
              side — or a creator with a paid community, or a freelancer juggling wholesale and digital products.
              Anyone whose business doesn&apos;t fit neatly into one platform&apos;s dashboard, because it was never
              meant to.
            </p>
          </SurfaceCard>
        </Reveal>

        <Reveal delay={0.14}>
          <SurfaceCard className="mb-6 p-6 lg:p-8">
            <h2 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">The product idea</h2>
            <p className="mt-2 text-[15.5px] leading-relaxed text-text-secondary">
              Ground Control turns scattered context into a daily operating brief. Every morning it answers five
              questions: what changed overnight, who needs you, where money is stuck, what&apos;s at risk, and what to
              do first. Everything downstream — Customer Radar, Money Watch, Open Loops — is the same underlying
              data, just viewed from a different angle, so a customer&apos;s overdue invoice shows up consistently
              everywhere it&apos;s relevant instead of living in a silo.
            </p>
          </SurfaceCard>
        </Reveal>
      </div>

      <Reveal delay={0.14}>
        <div className="mb-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">Core workflows</h2>
          <p className="mt-2 text-[15.5px] text-text-secondary">Six modules, one source of truth.</p>
        </div>
      </Reveal>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {workflows.map((m, i) => (
          <Reveal key={m.href} delay={0.04 * i}>
            <SurfaceCard className="h-full p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft">
                  <m.icon className="h-[15px] w-[15px] text-brand" strokeWidth={2} />
                </div>
                <h3 className="text-[14px] font-semibold text-text-primary">{m.label}</h3>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{m.description}</p>
            </SurfaceCard>
          </Reveal>
        ))}
      </div>

      <div className="mx-auto max-w-3xl">
        <Reveal delay={0.1}>
          <SurfaceCard className="mb-6 p-6 lg:p-8">
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">How AI fits</h2>
            <p className="mt-2 text-[15.5px] leading-relaxed text-text-secondary">
              AI should not replace judgment. It should help the owner see what matters faster. Command Center is
              built on that idea — it doesn&apos;t make decisions, it surfaces the specific signal (an overdue
              invoice, a proposal opened twice, a shipment stuck in transit) and a plainly-worded recommendation,
              then gets out of the way. The founder still decides whether to call or email, whether to offer a
              discount or just check in. The AI&apos;s job is noticing faster than a busy person can, not deciding
              for them.
            </p>
          </SurfaceCard>
        </Reveal>

        <Reveal delay={0.12}>
          <SurfaceCard className="mb-6 p-6 lg:p-8">
            <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">
              What this shows about my work
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Users2 className="h-4 w-4 text-brand" />
                <p className="mt-2 text-[13.5px] font-medium text-text-primary">Customer experience</p>
                <p className="mt-1 text-[12.5px] text-text-secondary">
                  Relationship language over CRM jargon — status text a person would actually say out loud.
                </p>
              </div>
              <div>
                <Layers className="h-4 w-4 text-brand" />
                <p className="mt-2 text-[13.5px] font-medium text-text-primary">Systems thinking</p>
                <p className="mt-1 text-[12.5px] text-text-secondary">
                  One data model, six views — the same invoice shows up everywhere it matters, consistently.
                </p>
              </div>
              <div>
                <Sparkles className="h-4 w-4 text-brand" />
                <p className="mt-2 text-[13.5px] font-medium text-text-primary">Product judgment</p>
                <p className="mt-1 text-[12.5px] text-text-secondary">
                  AI as a fast noticer, not a decision-maker — a deliberate, defensible design choice.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </Reveal>
      </div>

      <Reveal delay={0.14}>
        <div className="mb-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand">What I&apos;d build next</h2>
        </div>
      </Reveal>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {buildNext.map((b, i) => (
          <Reveal key={b.title} delay={0.04 * i}>
            <SurfaceCard className="flex h-full flex-col p-5">
              <b.icon className="h-4 w-4 text-brand" />
              <p className="mt-2.5 text-[13.5px] font-semibold text-text-primary">{b.title}</p>
              <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-text-secondary">{b.body}</p>
              {b.link && (
                <LinkButton href={b.link.href} variant="ghost" className="mt-3 h-8 w-fit px-0 text-brand hover:bg-transparent hover:text-brand-hover">
                  {b.link.label} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </LinkButton>
              )}
            </SurfaceCard>
          </Reveal>
        ))}
      </div>

      <div className="mx-auto max-w-3xl">
        <Reveal>
          <SurfaceCard className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center lg:p-8">
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-text-primary">Step back into the cockpit</h2>
              <p className="mt-1 text-[13.5px] text-text-secondary">See the full experience, starting with the Morning Brief.</p>
            </div>
            <LinkButton href="/morning-brief" className="shrink-0 bg-brand text-white hover:bg-brand-hover">
              Open Morning Brief <ArrowRight className="ml-1 h-4 w-4" />
            </LinkButton>
          </SurfaceCard>
        </Reveal>
      </div>
    </div>
  );
}
