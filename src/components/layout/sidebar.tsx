"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Settings, LifeBuoy, ChevronsUpDown, ExternalLink } from "lucide-react";
import { navItems } from "./nav-items";
import { LogoMark } from "@/components/brand/logo-mark";
import { founder } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <LogoMark size={30} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[14px] font-semibold tracking-tight text-text-primary">Ground Control</p>
          <p className="truncate text-[12px] text-text-muted">{founder.business}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-text-secondary hover:bg-black/[0.03] hover:text-text-primary dark:hover:bg-white/[0.04]"
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-text-muted group-hover:text-text-secondary")}
                strokeWidth={2}
              />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    active ? "bg-brand/15 text-brand" : "bg-black/[0.05] text-text-muted dark:bg-white/[0.06]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 px-3 pb-2 pt-3">
        <Link
          href="/showcase"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-text-secondary transition-colors hover:bg-black/[0.03] hover:text-text-primary dark:hover:bg-white/[0.04]"
        >
          <ExternalLink className="h-[17px] w-[17px] text-text-muted" strokeWidth={2} />
          Portfolio case study
        </Link>
        <button
          onClick={() => toast("Help & support isn't wired up in this portfolio demo.")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-text-secondary transition-colors hover:bg-black/[0.03] hover:text-text-primary dark:hover:bg-white/[0.04]"
        >
          <LifeBuoy className="h-[17px] w-[17px] text-text-muted" strokeWidth={2} />
          Help &amp; support
        </button>
        <button
          onClick={() => toast("Settings are disabled in this public demo.")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-text-secondary transition-colors hover:bg-black/[0.03] hover:text-text-primary dark:hover:bg-white/[0.04]"
        >
          <Settings className="h-[17px] w-[17px] text-text-muted" strokeWidth={2} />
          Settings
        </button>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => toast("This is a demo profile — there's no real account behind it.")}
          className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
            {founder.avatarInitials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium text-text-primary">{founder.name}</p>
            <p className="truncate text-[12px] text-text-muted">
              {founder.role}, {founder.business}
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        </button>
      </div>
    </aside>
  );
}
