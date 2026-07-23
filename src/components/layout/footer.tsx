import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border pt-6 text-center text-[12px] leading-relaxed text-text-muted">
      <p>
        Ground Control — a portfolio product concept by{" "}
        <span className="font-medium text-text-secondary">Derrico Smith</span>.
      </p>
      <p className="mt-1">
        Designed to show AI-assisted customer operations, ecommerce workflows, solopreneur pain, and product
        thinking.
      </p>
      <p className="mt-2">
        <Link href="/showcase" className="text-brand hover:text-brand-hover">
          Portfolio case study
        </Link>
        <span className="mx-2">·</span>
        <Link href="/pricing" className="text-brand hover:text-brand-hover">
          Pricing
        </Link>
      </p>
    </footer>
  );
}
