"use client";

import { useActionState } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createAdditionalOrganizationAction,
  type CreateOrganizationFormState,
} from "@/lib/actions/organization-actions";

const initialState: CreateOrganizationFormState = {};

export function NewOrganizationForm() {
  const [state, formAction, pending] = useActionState(createAdditionalOrganizationAction, initialState);

  return (
    <SurfaceCard className="max-w-md p-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="organizationName" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
            Organization name
          </label>
          <Input id="organizationName" name="organizationName" placeholder="Acme Software Co." required className="border-border bg-surface" />
        </div>

        {state.error && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            {state.error}
          </div>
        )}

        <Button type="submit" disabled={pending} className="w-full justify-center bg-brand text-white hover:bg-brand-hover">
          {pending ? "Creating…" : "Create organization"} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </form>
    </SurfaceCard>
  );
}
