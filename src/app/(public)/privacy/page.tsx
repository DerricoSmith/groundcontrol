import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading, Prose, HonestyNote, PageHero } from "@/components/public/sections";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Signal & State handles personal data. Draft pending legal review.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="Privacy information" />

      <Section className="!pt-0">
      <div className="max-w-3xl">
        <p className="text-[13px] text-text-muted">Last updated 25 July 2026.</p>

        <div className="mt-6">
          <HonestyNote>
            This is a draft prepared by Signal &amp; State and has not yet been reviewed by an attorney. It describes
            current practice accurately, and it is not a substitute for a reviewed privacy policy. If you need a
            reviewed document for procurement, ask and it will be prioritized.
          </HonestyNote>
        </div>

        <div className="mt-10 space-y-10">
          <section>
            <SectionHeading title="What we collect" />
            <Prose>
              <p>
                <strong className="text-text-primary">From visitors.</strong> If you submit the contact form we store
                the name, email address, company, role, reason for contacting, and any message you write, together with
                the page you submitted from.
              </p>
              <p>
                <strong className="text-text-primary">From account holders.</strong> Your name, email address, and a
                hashed password. Passwords are hashed with bcrypt and are never stored or transmitted in readable form.
              </p>
              <p>
                <strong className="text-text-primary">From customer data you import.</strong> Whatever your CSV files
                contain, which typically includes customer account names, contact names and business email addresses,
                revenue figures, renewal dates, product usage counts, support ticket metadata, and interaction records.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="How we use it" />
            <Prose>
              <p>
                Contact submissions are used to reply to you. They are not added to a marketing list and are not shared
                with anyone.
              </p>
              <p>
                Imported customer data is used only to produce the analysis inside your own organization&apos;s
                workspace. It is not shared between organizations, not aggregated into benchmarks, and not used to build
                features for other customers.
              </p>
              <p>
                No data you provide is used to train any machine learning model, ours or a third party&apos;s.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Who we share it with" />
            <Prose>
              <p>
                Signal &amp; State uses a small number of infrastructure providers to run the service. Hosting and
                application delivery run on Vercel. The database runs on Neon. If a model provider is configured for
                your workspace, the evidence for a specific request is sent to Anthropic to produce narrative text, and
                is not retained for training.
              </p>
              <p>We do not sell personal data and we do not share it with advertisers.</p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="How long we keep it" />
            <Prose>
              <p>
                Organization data is retained for the life of the organization. Deleting an organization cascades
                through every table that holds its data. Removing a user removes their membership and personal
                information while retaining audit references in anonymized form.
              </p>
              <p>Contact submissions are retained until you ask for them to be deleted.</p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Your choices" />
            <Prose>
              <p>
                You can request a copy of your organization&apos;s data, correction of anything inaccurate, or deletion.
                Write to Rico through the <Link href="/contact" className="text-brand hover:text-brand-hover">contact form</Link> and
                the request will be actioned.
              </p>
            </Prose>
          </section>

          <section>
            <SectionHeading title="Cookies" />
            <Prose>
              <p>
                Ground Control sets one cookie, a session cookie used to keep you signed in. It is required for the
                application to function and is not used for advertising or cross-site tracking. There is no third party
                analytics or advertising script on this site.
              </p>
            </Prose>
          </section>
        </div>
      </div>
      </Section>
    </>
  );
}
