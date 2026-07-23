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
import { loginAction, type AuthFormState } from "@/lib/actions/auth-actions";

const initialState: AuthFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

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
        <p className="text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-brand">Welcome back</p>
        <h1 className="mt-3 text-center font-serif text-[28px] font-medium tracking-tight text-text-primary">
          Log in to your cockpit.
        </h1>

        <SurfaceCard className="mt-7 p-6">
          <form action={formAction} className="space-y-4">
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
              <Input id="password" name="password" type="password" placeholder="Your password" required className="border-border bg-surface" />
            </div>

            {state.error && (
              <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft p-3 text-[13px] text-text-primary">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                {state.error}
              </div>
            )}

            <Button type="submit" disabled={pending} className="w-full justify-center bg-brand text-white hover:bg-brand-hover">
              {pending ? "Logging in…" : "Log in"} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>
        </SurfaceCard>

        <p className="mt-5 text-center text-[13px] text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-brand hover:text-brand-hover">
            Create one free
          </Link>
        </p>
        <p className="mt-2 text-center text-[13px] text-text-secondary">
          Just browsing?{" "}
          <Link href="/morning-brief" className="font-medium text-brand hover:text-brand-hover">
            View the demo
          </Link>{" "}
          — no account needed.
        </p>
      </main>
    </div>
  );
}
