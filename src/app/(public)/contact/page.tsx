import type { Metadata } from "next";
import { Section } from "@/components/public/sections";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation about customer intelligence, a pilot, advisory work, or hiring.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <Section className="pt-14">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.14em] text-brand">Contact</p>
          <h1 className="font-serif text-[30px] font-medium leading-[1.14] tracking-tight text-text-primary sm:text-[40px]">
            Start a conversation.
          </h1>
          <p className="mt-5 text-[15.5px] leading-relaxed text-text-secondary">
            Whether you want a pilot, advisory work, or a straight answer about whether Ground Control fits your
            situation, this reaches Rico directly.
          </p>

          <dl className="mt-8 space-y-5 text-[14px]">
            <div>
              <dt className="font-medium text-text-primary">If you are a customer success or founder</dt>
              <dd className="mt-1 leading-relaxed text-text-secondary">
                Tell me what you cannot currently see about your customers. That is usually enough to know whether a
                sprint or a pilot is the right starting point.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">If you are recruiting</dt>
              <dd className="mt-1 leading-relaxed text-text-secondary">
                The build story explains what I designed and built, and the demo is live. Happy to walk through either.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-text-primary">If you are an investor or potential partner</dt>
              <dd className="mt-1 leading-relaxed text-text-secondary">
                The commercial thesis is on the build story page. I am glad to talk about where the service enabled
                model goes next.
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <ContactForm defaultReason={reason} sourcePage="/contact" />
        </div>
      </div>
    </Section>
  );
}
