"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { PUBLIC_NAV } from "@/components/public/public-shell";

/**
 * Mobile navigation for the public site. A disclosure button plus a panel
 * rather than a full dialog: it keeps focus order natural and needs no focus
 * trap, which is one less thing to get wrong for keyboard and screen reader
 * users.
 */
export function PublicMobileNav() {
  const [open, setOpen] = React.useState(false);

  // Escape closes, matching what a keyboard user expects from any overlay.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="public-mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-surface-soft"
      >
        {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
      </button>

      {open && (
        <div
          id="public-mobile-nav"
          className="absolute inset-x-0 top-16 z-40 border-b border-border bg-surface px-5 py-4 shadow-lg"
        >
          <nav aria-label="Primary mobile">
            <ul className="space-y-1">
              {PUBLIC_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-[15px] text-text-primary hover:bg-surface-soft"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[15px] text-text-primary hover:bg-surface-soft"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <div className="mt-3 grid gap-2 border-t border-border pt-3">
            <Link
              href="/demo"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-brand px-4 py-2.5 text-center text-[14px] font-medium text-white"
            >
              Launch live demo
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-center text-[14px] text-text-primary"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
