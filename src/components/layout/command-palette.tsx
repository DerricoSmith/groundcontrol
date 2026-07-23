"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { navItems } from "./nav-items";
import { customers } from "@/lib/data";
import { channelLabel } from "@/lib/icon-map";
import { Users, Send, TriangleAlert, Sparkles, Search } from "lucide-react";

export function CommandPalette({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "group flex w-full max-w-md items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-left text-[13.5px] text-text-muted transition-colors hover:border-border-strong hover:bg-surface-soft"
        }
      >
        <Search className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
        <span className="flex-1 truncate">Search customers, invoices, actions…</span>
        <kbd className="hidden shrink-0 rounded-md border border-border bg-surface-soft px-1.5 py-0.5 text-[10.5px] font-medium text-text-muted sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Command Palette" description="Jump anywhere in Ground Control">
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Go to">
              {navItems.map((item) => (
                <CommandItem key={item.href} onSelect={() => go(item.href)}>
                  <item.icon />
                  <span>{item.label}</span>
                  <CommandShortcut>{item.description}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick actions">
              <CommandItem onSelect={() => go("/money-watch")}>
                <Send />
                <span>Chase overdue invoices</span>
              </CommandItem>
              <CommandItem onSelect={() => go("/customer-radar")}>
                <TriangleAlert />
                <span>Review at-risk customers</span>
              </CommandItem>
              <CommandItem onSelect={() => go("/command-center")}>
                <Sparkles />
                <span>Ask Ground Control</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Customers">
              {customers.slice(0, 6).map((c) => (
                <CommandItem key={c.id} onSelect={() => go("/customer-radar")}>
                  <Users />
                  <span>{c.name}</span>
                  <CommandShortcut>{c.company ?? channelLabel[c.channel]}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
