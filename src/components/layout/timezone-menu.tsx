"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TIMEZONES, TZ_COOKIE, resolveTimeZone, timeZoneInfo, type TimeZoneId } from "@/lib/timezone";

/** Settings menu for the time zone. Saves a cookie and refreshes so server-rendered dates update. */
export function TimezoneMenu({
  timeZone,
  trigger,
  side = "top",
}: {
  timeZone: TimeZoneId;
  trigger: (current: { label: string; short: string }) => React.ReactElement;
  side?: "top" | "bottom" | "right";
}) {
  const router = useRouter();
  const [value, setValue] = React.useState<TimeZoneId>(timeZone);

  const choose = (next: string) => {
    const id = resolveTimeZone(next);
    setValue(id);
    document.cookie = `${TZ_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
    toast.success(`Time zone set to ${timeZoneInfo(id).label}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger(timeZoneInfo(value))} />
      <DropdownMenuContent side={side} align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Time zone</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={choose}>
            {TIMEZONES.map((tz) => (
              <DropdownMenuRadioItem key={tz.id} value={tz.id} closeOnClick>
                <span className="flex-1">{tz.label}</span>
                <span className="text-[11.5px] text-text-muted">{tz.short}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
