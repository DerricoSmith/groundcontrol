import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/** Shared layout primitives for the public site, so spacing stays consistent. */

export function Section({
  children,
  className = "",
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "soft";
}) {
  return (
    <section className={`${tone === "soft" ? "bg-surface-soft" : ""} ${className}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
      )}
      <h2 id={id} className="font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[32px]">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary sm:text-[16px]">{description}</p>
      )}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-text-secondary">{children}</div>;
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {Icon && (
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} />
        </div>
      )}
      <h3 className="text-[15px] font-medium text-text-primary">{title}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-secondary">{children}</p>
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-[14.5px] font-medium text-white transition-colors hover:bg-brand-hover"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-5 py-2.5 text-[14.5px] font-medium text-text-primary transition-colors hover:bg-surface-soft"
    >
      {children}
    </Link>
  );
}

/**
 * Used wherever the site states something it cannot yet prove. Keeping this a
 * component rather than ad hoc prose means the honesty rules stay visible in
 * the codebase instead of depending on whoever writes the next page.
 */
export function HonestyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-surface-soft px-4 py-3 text-[13px] leading-relaxed text-text-secondary">
      {children}
    </p>
  );
}
