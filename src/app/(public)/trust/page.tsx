import type { Metadata } from "next";
import { Section, SectionHeading, Prose, HonestyNote, PageHero } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "Trust and security",
  description:
    "How Ground Control separates tenants, handles data, uses AI, and what it does not yet claim.",
  alternates: { canonical: "/trust" },
};

const LIMITATIONS = [
  "Data enters Ground Control by CSV import. There are no native integrations with CRM, support, billing, or product analytics systems yet.",
  "One risk rule, failed or delayed payment, is permanently unavailable in this release because no billing data source exists.",
  "The business outcomes health component is inert. Goal tracking and success plans are not built, so it carries zero confidence and is excluded from every score.",
  "The renewal forecast is a rule-based confidence category. It is not a prediction and no machine learning model backs it.",
  "Ground Control sends no customer communication. Drafting exists; sending does not.",
  "Automated email delivery, Slack delivery, and scheduled report distribution are not built.",
  "The public demonstration environment is read only. It cannot be modified by visitors.",
];

export default function TrustPage() {
  return (
    <>
      <PageHero
        eyebrow="Trust"
        title="What we do with your data, and what we do not claim."
        description="This page is written to be checkable. Where something is not built or not certified, it says so."
      />

      <Section tone="soft">
        <SectionHeading title="Tenant separation" />
        <Prose>
          <p>
            Every table that holds customer data carries a non-nullable organization identifier. Every query that
            touches those tables is scoped to one organization in the service layer, and no page or route builds a query
            directly.
          </p>
          <p>
            That scoping is backed by an automated test suite that attempts cross-organization access on customer
            accounts, renewals, risks, actions, and executive briefs, and asserts that each attempt returns nothing. The
            suite runs against Postgres, the same database engine production uses.
          </p>
          <p>
            The public demonstration organization is a normal organization row flagged as demo data. It is not
            special-cased in application logic, which is what makes its isolation the same isolation every customer gets.
          </p>
        </Prose>
      </Section>

      <Section>
        <SectionHeading title="Data ownership and deletion" />
        <Prose>
          <p>
            Your data is yours. Signal &amp; State does not sell it, does not share it between organizations, and does
            not use it to build features for anyone else.
          </p>
          <p>
            An organization owner can request a full export of their organization&apos;s data. Deleting an organization
            cascades through every tenant-owned table, is itself recorded as an audited event, and cannot be triggered
            by a consultant account.
          </p>
          <p>
            Removing a user removes their membership and personal information while retaining audit references in
            anonymized form, so the audit trail is not destroyed by an offboarding.
          </p>
        </Prose>
      </Section>

      <Section tone="soft">
        <SectionHeading title="How AI is used" />
        <Prose>
          <p>
            Every number Ground Control reports is produced by deterministic code. Health scores, component scores,
            confidence values, risk severities, renewal forecast categories, and revenue figures are reproducible and
            are never generated or adjusted by a model.
          </p>
          <p>
            Where a model is used, it is used for language: making an explanation read better, summarizing an account,
            or drafting an internal message. Each output is validated against a schema before it is stored, recorded
            with its prompt version and the evidence it was grounded in, and labeled in the interface so a reader knows
            what they are looking at.
          </p>
          <p>
            No customer data is used to train any model. Requests to a model provider are made server side with a
            server-held key that never reaches a browser.
          </p>
          <p>
            Nothing generated is sent to one of your customers. Communication drafts are internal and require a person
            to edit and send them.
          </p>
        </Prose>
      </Section>

      <Section>
        <SectionHeading title="Certification status" />
        <div className="max-w-3xl">
          <HonestyNote>
            Ground Control is being designed around modern security and privacy practices. Formal certification work
            will follow as the company grows.
          </HonestyNote>
          <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
            Signal &amp; State does not hold SOC 2, ISO 27001, or HIPAA certification, and does not claim readiness for
            any of them. If a certification matters to your procurement process, say so early and we will tell you
            honestly whether we are a fit yet.
          </p>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading
          title="Known product limitations"
          description="Published deliberately. A trust page that lists only strengths is marketing."
        />
        <ul className="mt-6 max-w-3xl space-y-3">
          {LIMITATIONS.map((limitation) => (
            <li key={limitation} className="flex gap-3 text-[14.5px] leading-relaxed text-text-secondary">
              <span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
