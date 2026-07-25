"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction, type AcceptInviteFormState } from "@/lib/actions/invitation-actions";

const initialState: AcceptInviteFormState = {};

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(acceptInvitationAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.push("/mission-control");
  }, [state.success, router]);

  return (
    <form action={formAction} className="mt-5">
      <input type="hidden" name="token" value={token} />
      {state.error && <p className="mb-3 text-[13px] text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full justify-center bg-brand text-white hover:bg-brand-hover">
        {pending ? "Joining…" : "Accept invitation"}
      </Button>
    </form>
  );
}
