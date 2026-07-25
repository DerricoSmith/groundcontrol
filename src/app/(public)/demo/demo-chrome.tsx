import Link from "next/link";
import { DEMO_DISCLOSURE } from "@/lib/demo/demo-config";

const DEMO_NAV = [
  { href: "/demo", label: "Mission Control" },
  { href: "/demo/accounts", label: "Portfolio" },
  { href: "/demo/risks", label: "Risks" },
  { href: "/demo/renewals", label: "Renewals" },
  { href: "/demo/actions", label: "Actions" },
  { href: "/demo/brief", label: "Executive brief" },
] as const;

/**
 * Wraps every demo page with its navigation and the fictional-data notice.
 *
 * The notice is not dismissible and appears on every page rather than once on
 * entry. Someone landing on a deep link from a shared URL must see it too.
 */
export function DemoChrome({
  current,
  title,
  description,
  children,
}: {
  current: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
      <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
        <p className="text-[13px] leading-relaxed text-text-primary">
          <span className="font-medium">Demonstration environment.</span> {DEMO_DISCLOSURE} It is read only, so nothing
          here can be changed by visitors.
        </p>
      </div>

      <nav aria-label="Demonstration" className="mt-6 flex flex-wrap gap-2">
        {DEMO_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current === item.href ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              current === item.href
                ? "border-brand bg-brand-soft font-medium text-brand"
                : "border-border text-text-secondary hover:bg-surface-soft"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <header className="mt-7">
        <h1 className="font-serif text-[26px] font-medium tracking-tight text-text-primary sm:text-[32px]">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-text-secondary">{description}</p>}
      </header>

      <div className="mt-7">{children}</div>

      <div className="mt-12 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-serif text-[19px] font-medium text-text-primary">This is a working product, not a mockup.</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
          Every score, risk, and brief section on these pages was produced by the same deterministic services a paying
          customer would run against their own data.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/showcase"
            className="rounded-lg bg-brand px-4 py-2.5 text-[14px] font-medium text-white hover:bg-brand-hover"
          >
            View the build story
          </Link>
          <Link
            href="/contact?reason=pilot"
            className="rounded-lg border border-border px-4 py-2.5 text-[14px] font-medium text-text-primary hover:bg-surface-soft"
          >
            Contact Signal &amp; State
          </Link>
          <Link
            href="/ground-control"
            className="rounded-lg border border-border px-4 py-2.5 text-[14px] font-medium text-text-primary hover:bg-surface-soft"
          >
            Explore Ground Control
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Shown when the demo organization has not been seeded in an environment. */
export function DemoUnavailable({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="font-serif text-[26px] font-medium text-text-primary">The demonstration is not available</h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-text-secondary">{message}</p>
      <Link href="/" className="mt-6 inline-block text-[14px] font-medium text-brand hover:text-brand-hover">
        Back to Signal &amp; State
      </Link>
    </div>
  );
}
