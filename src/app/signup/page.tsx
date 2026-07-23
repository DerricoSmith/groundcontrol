"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CircleAlert } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signupAction, type AuthFormState } from "@/lib/actions/auth-actions";

const initialState: AuthFormState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/showcase" className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-[14px] font-semibold text-text-primary">Ground Control</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-md flex-col px-4 pb-24 pt-10 sm:px-6">
        <p className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Create your account</p>
        <h1 className="mt-3 text-center font-serif text-[28px] font-medium tracking-tight text-text-primary">
          Set up your cockpit.
        </h1>
        <p className="mt-2 text-center text-[13.5px] text-text-secondary">
          Your account comes pre-loaded with a realistic sample business so you can see it working immediately.
        </p>

        <SurfaceCard className="mt-7 p-6">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
                Your name
              </label>
              <Input id="name" name="name" placeholder="Jordan Reyes" required className="border-border bg-surface" />
            </div>
            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
                Business name
              </label>
              <Input id="businessName" name="businessName" placeholder="Reyes Studio" required className="border-border bg-surface" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
                Email
              </label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required className="border-border bg-surface" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
                Password
              </label>
              <Input id="password" name="password" type="password" placeholder="At least 8 characters" required minLength={8} className="border-border bg-surface" />
            </div>

            {state.error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                {state.error}
              </div>
            )}

            <Button type="submit" disabled={pending} className="w-full justify-center bg-brand text-white hover:bg-brand-hover">
              {pending ? "Creating your workspace…" : "Create account"} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </SurfaceCard>

        <p className="mt-5 text-center text-[13px] text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-[12px] text-text-muted">
          No credit card, no real integrations connected — this is a portfolio demo with your own private sandbox
          data.
        </p>
      </main>
    </div>
  );
}
