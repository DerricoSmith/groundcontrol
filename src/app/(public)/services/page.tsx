import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading, PrimaryLink, HonestyNote, PageHero } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Customer Intelligence Sprint, Managed Customer Intelligence, Customer Success and CX Transformation, Fractional Customer Executive Advisory, and the Ground Control Pilot.",
  alternates: { canonical: "/services" },
};

const SERVICES = [
  {
    key: "sprint",
    name: "Customer Intelligence Sprint",
    summary: "A fixed scope engagement that turns your existing customer data into a working portfolio view.",
    forWho: "A company that suspects it has renewal risk it cannot see, and wants an answer in weeks rather than quarters.",
    includes: [
      "Data audit across CRM, billing, support, and product analytics",
      "Customer account, contact, renewal, usage, support, and interaction import",
      "Health model configured to your segments and weighted to your business",
      "Risk review across the portfolio with evidence for every finding",
      "Executive brief and a prioritized action list with named owners",
    ],
    outcome: "You leave with a scored portfolio, a ranked risk list, and a renewal plan for the accounts that need one.",
  },
  {
    key: "managed",
    name: "Managed Customer Intelligence",
    summary: "Ongoing operation of the customer intelligence function while your team is still small.",
    forWho: "A company that has the sprint output and no operations person to keep it current.",
    includes: [
      "Recurring data refresh and quality management",
      "Risk review cadence with your customer success lead",
      "Renewal preparation tracking against milestones",
      "Executive brief prepared for your leadership meeting",
      "Escalation tracking and follow through",
    ],
    outcome: "The intelligence stays current without you hiring a customer success operations leader first.",
  },
  {
    key: "transformation",
    name: "Customer Success and CX Transformation",
    summary: "Advisory work on the operating model itself: segmentation, coverage, motions, and accountability.",
    forWho: "A company where the customer organization has outgrown how it was set up.",
    includes: [
      "Segmentation and coverage model design",
      "Onboarding, adoption, renewal, and escalation motion design",
      "Health scoring philosophy and what it should drive",
      "Team structure, roles, and accountability",
      "Executive reporting that leadership will actually read",
    ],
    outcome: "A customer operating model your team can run, documented well enough to survive a hiring round.",
  },
  {
    key: "fractional",
    name: "Fractional Customer Executive Advisory",
    summary: "Senior customer leadership on a part time basis.",
    forWho: "A founder led company that needs executive customer judgment before it can justify a full time hire.",
    includes: [
      "Standing time with the founder or leadership team",
      "Customer review and escalation judgment",
      "Renewal and expansion strategy",
      "Coaching for the customer success lead",
      "Board and investor customer narrative",
    ],
    outcome: "Executive customer judgment in the room while you build toward the permanent hire.",
  },
  {
    key: "pilot",
    name: "Ground Control Pilot",
    summary: "A small paid pilot of the software using your own CSV data.",
    forWho: "A team that wants to run the product themselves and prove the value before committing further.",
    includes: [
      "Workspace setup and guided onboarding",
      "CSV import support for your account and renewal data",
      "Health model and risk rule configuration",
      "Team access and role setup",
      "A review session on what the data showed",
    ],
    outcome: "Your real portfolio in the product, scored and explained, with your team using it.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Consulting that produces a working system, not a slide deck."
        description="Signal & State delivers customer intelligence work using Ground Control. The software is what makes the engagement repeatable, and the engagement is what makes the software useful on day one."
      />

      <Section tone="soft">
        <div className="space-y-5">
          {SERVICES.map((service) => (
            <article key={service.key} className="rounded-xl border border-border bg-surface p-6 sm:p-8">
              <h2 className="font-serif text-[21px] font-medium tracking-tight text-text-primary sm:text-[24px]">
                {service.name}
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{service.summary}</p>

              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Who it is for</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{service.forWho}</p>

                  <h3 className="mt-4 text-[12px] font-medium uppercase tracking-wide text-text-muted">Outcome</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{service.outcome}</p>
                </div>

                <div>
                  <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">What it includes</h3>
                  <ul className="mt-1.5 space-y-1.5 text-[13.5px] leading-relaxed text-text-secondary">
                    {service.includes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/contact?reason=${service.key}`}
                  className="text-[14px] font-medium text-brand hover:text-brand-hover"
                >
                  Ask about {service.name}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title="Pricing" description="Engagement pricing is scoped to the size of the customer portfolio and the state of the data." />
        <div className="mt-6 max-w-3xl">
          <HonestyNote>
            Signal &amp; State does not publish fixed prices yet. Every engagement so far has been scoped against a
            specific portfolio, and publishing a number that does not survive contact with a real data audit would be
            worse than saying so. Ask and you will get a scoped figure, not a range.
          </HonestyNote>
        </div>
        <div className="mt-8">
          <PrimaryLink href="/contact?reason=review">Book a Customer Intelligence Review</PrimaryLink>
        </div>
      </Section>
    </>
  );
}
