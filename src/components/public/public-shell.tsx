import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicMobileNav } from "@/components/public/public-mobile-nav";

export const PUBLIC_NAV = [
  { href: "/ground-control", label: "Product" },
  { href: "/showcase", label: "Build story" },
  { href: "/services", label: "Services" },
  { href: "/trust", label: "Trust" },
  { href: "/about", label: "About" },
] as const;

/**
 * Chrome for every public page. Deliberately separate from the authenticated
 * app shell: a visitor should never see product navigation for a workspace
 * they do not have, and the app shell should never render for a logged-out
 * marketing page.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Signal and State home">
            <LogoMark className="h-7 w-7" />
            <span className="font-serif text-[17px] font-medium tracking-tight text-text-primary">Signal &amp; State</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13.5px] text-text-secondary transition-colors hover:text-text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/demo"
              className="hidden rounded-lg bg-brand px-3.5 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-brand-hover sm:inline-flex"
            >
              Launch live demo
            </Link>
            <PublicMobileNav />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-surface-soft">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-6 w-6" />
                <span className="font-serif text-[15px] font-medium text-text-primary">Signal &amp; State</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                Turn customer signals into action.
              </p>
            </div>

            <div>
              <h2 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Product</h2>
              <ul className="mt-3 space-y-2 text-[13px]">
                <li><Link href="/ground-control" className="text-text-secondary hover:text-text-primary">Ground Control</Link></li>
                <li><Link href="/demo" className="text-text-secondary hover:text-text-primary">Live demo</Link></li>
                <li><Link href="/showcase" className="text-text-secondary hover:text-text-primary">Build story</Link></li>
                <li><Link href="/login" className="text-text-secondary hover:text-text-primary">Sign in</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Company</h2>
              <ul className="mt-3 space-y-2 text-[13px]">
                <li><Link href="/about" className="text-text-secondary hover:text-text-primary">About</Link></li>
                <li><Link href="/services" className="text-text-secondary hover:text-text-primary">Services</Link></li>
                <li><Link href="/contact" className="text-text-secondary hover:text-text-primary">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="text-[12px] font-medium uppercase tracking-wide text-text-muted">Legal</h2>
              <ul className="mt-3 space-y-2 text-[13px]">
                <li><Link href="/trust" className="text-text-secondary hover:text-text-primary">Trust and security</Link></li>
                <li><Link href="/privacy" className="text-text-secondary hover:text-text-primary">Privacy</Link></li>
                <li><Link href="/terms" className="text-text-secondary hover:text-text-primary">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-[12.5px] leading-relaxed text-text-muted">
              Ground Control is being designed around modern security and privacy practices. Formal certification work
              will follow as the company grows.
            </p>
            <p className="mt-2 text-[12.5px] text-text-muted">
              Signal &amp; State. Built by Rico Smith.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
