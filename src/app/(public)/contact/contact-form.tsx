"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { submitLeadAction, type LeadFormState } from "@/lib/actions/lead-actions";
import { REASONS } from "@/lib/services/lead-constants";

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[14.5px] text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
const label = "mb-1.5 block text-[13px] font-medium text-text-primary";

export function ContactForm({ defaultReason, sourcePage }: { defaultReason?: string; sourcePage: string }) {
  const [state, formAction, pending] = React.useActionState<LeadFormState | undefined, FormData>(
    submitLeadAction,
    undefined
  );

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-positive/30 bg-positive-soft p-6" role="status">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-positive" aria-hidden="true" />
          <div>
            <h2 className="text-[16px] font-medium text-text-primary">Message received.</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">
              It is stored and Rico will read it. You will get a reply at the address you gave, usually within two
              business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="sourcePage" value={sourcePage} />

      {/* Honeypot. Hidden from people, offered to bots. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">Name</label>
          <input id="name" name="name" required maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="company">Company</label>
          <input id="company" name="company" maxLength={160} autoComplete="organization" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="role">Role</label>
          <input id="role" name="role" maxLength={160} autoComplete="organization-title" className={field} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="requestedService">Reason for contacting</label>
        <select id="requestedService" name="requestedService" defaultValue={defaultReason ?? ""} className={field}>
          <option value="">Select one</option>
          {REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>{reason.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label} htmlFor="primaryProblem">
          What is your primary customer challenge right now?
        </label>
        <textarea
          id="primaryProblem"
          name="primaryProblem"
          rows={3}
          maxLength={2000}
          className={field}
          placeholder="For example: we cannot forecast renewals, or health scores nobody trusts."
        />
      </div>

      <div>
        <label className={label} htmlFor="notes">Anything else (optional)</label>
        <textarea id="notes" name="notes" rows={3} maxLength={4000} className={field} />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-[13.5px] text-text-primary">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-5 py-3 text-[15px] font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Sending..." : "Send message"}
      </button>

      <p className="text-[12.5px] leading-relaxed text-text-muted">
        Your message is stored in Signal &amp; State&apos;s own database and is not shared with anyone. It is not added
        to a marketing list.
      </p>
    </form>
  );
}
