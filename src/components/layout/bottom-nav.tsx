"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { bottomNavItems } from "./nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {bottomNavItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5"
            >
              <span className={cn("flex h-8 w-11 items-center justify-center rounded-full transition-colors", active && "bg-brand-soft")}>
                <Icon className={cn("h-[21px] w-[21px]", active ? "text-brand" : "text-text-muted")} strokeWidth={active ? 2.3 : 2} />
              </span>
              <span className={cn("truncate text-[11px] font-medium", active ? "text-brand" : "text-text-muted")}>{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
