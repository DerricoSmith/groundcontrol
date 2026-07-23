"use client";

import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Bell, CloudCheck } from "lucide-react";
import { MobileMenu } from "./mobile-menu";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItems } from "./nav-items";
import { founder } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <MobileMenu />

      <div className="hidden min-w-0 flex-col leading-tight lg:flex">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-text-primary">{current?.label ?? "Ground Control"}</h1>
        <p className="truncate text-[12px] text-text-muted">{current?.description ?? "Your daily operating cockpit"}</p>
      </div>

      <div className="flex min-w-0 flex-1 justify-center lg:justify-end">
        <CommandPalette />
      </div>

      <div className="flex items-center gap-1">
        <div className="mr-1 hidden items-center gap-1.5 rounded-full border border-positive/25 bg-positive-soft px-2.5 py-1 text-[11.5px] font-medium text-positive md:flex">
          <CloudCheck className="h-3.5 w-3.5" strokeWidth={2} />
          Synced
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex-col items-start gap-0.5 py-2">
                <span className="text-[13px] font-medium">Carvalho invoice is 12 days overdue</span>
                <span className="text-[12px] text-text-muted">$4,200 — worth a call today</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start gap-0.5 py-2">
                <span className="text-[13px] font-medium">Mira Studio opened your proposal twice</span>
                <span className="text-[12px] text-text-muted">Warmest lead on your board</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start gap-0.5 py-2">
                <span className="text-[13px] font-medium">Northline Goods production is delayed</span>
                <span className="text-[12px] text-text-muted">Risking their launch-day deadline</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11.5px] font-semibold text-brand transition-transform hover:scale-105" />
            }
          >
            {founder.avatarInitials}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <p className="text-[13px] font-medium text-text-primary">{founder.name}</p>
                <p className="text-[12px] text-text-muted">
                  {founder.role}, {founder.business}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast("Account settings are disabled in this public demo.")}>
                Account settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Integrations aren't connected in this portfolio build — everything here runs on mock data.")}>
                Integrations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("There's no real account to sign out of — this is a public demo.")}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
