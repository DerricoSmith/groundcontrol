"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Menu, Settings, LifeBuoy, ExternalLink, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";
import { navItems } from "./nav-items";
import { logoutAction } from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";

interface FounderInfo {
  name: string;
  firstName: string;
  business: string;
  role: string;
  avatarInitials: string;
}

export function MobileMenu({ founder, isLive }: { founder: FounderInfo; isLive: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] gap-0 border-border bg-surface p-0">
        <SheetHeader className="px-5 pb-2 pt-6">
          <SheetTitle className="flex items-center gap-2.5 text-left">
            <LogoMark size={26} />
            <span className="text-[14.5px] font-semibold text-text-primary">Ground Control</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-0.5 px-3 pt-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-text-secondary hover:bg-surface-soft hover:text-text-primary"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-brand" : "text-text-muted")} strokeWidth={2} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <div className="my-2 border-t border-border" />
          <Link
            href="/showcase"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-text-secondary hover:bg-surface-soft hover:text-text-primary"
          >
            <ExternalLink className="h-5 w-5 text-text-muted" strokeWidth={2} /> Portfolio case study
          </Link>
          <button
            onClick={() => toast("Settings are disabled in this public demo.")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-text-secondary"
          >
            <Settings className="h-5 w-5 text-text-muted" strokeWidth={2} /> Settings
          </button>
          <button
            onClick={() => toast("Help & support isn't wired up in this portfolio demo.")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-text-secondary"
          >
            <LifeBuoy className="h-5 w-5 text-text-muted" strokeWidth={2} /> Help &amp; support
          </button>
        </nav>

        {!isLive && (
          <div className="px-3 pb-1">
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-brand px-3 py-3 text-[14.5px] font-medium text-white hover:bg-brand-hover"
            >
              Sign up free
            </Link>
          </div>
        )}

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
              {founder.avatarInitials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium text-text-primary">{founder.name}</p>
              <p className="truncate text-[12px] text-text-muted">
                {isLive ? founder.business : `${founder.role}, ${founder.business} (demo)`}
              </p>
            </div>
            {isLive && (
              <button
                onClick={() => logoutAction()}
                aria-label="Sign out"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-soft"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
