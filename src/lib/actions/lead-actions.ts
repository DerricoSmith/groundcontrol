"use server";

import { submitLead, LeadError } from "@/lib/services/lead-service";

export interface LeadFormState {
  ok?: boolean;
  error?: string;
}

export async function submitLeadAction(
  _previous: LeadFormState | undefined,
  formData: FormData
): Promise<LeadFormState> {
  // A hidden field no human fills in. Bots that fill every input get a success
  // response and no stored record, which is quieter than a visible challenge
  // and costs a real visitor nothing.
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot.trim().length > 0) {
    return { ok: true };
  }

  try {
    await submitLead({
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company") || undefined,
      role: formData.get("role") || undefined,
      requestedService: formData.get("requestedService") || undefined,
      primaryProblem: formData.get("primaryProblem") || undefined,
      notes: formData.get("notes") || undefined,
      sourcePage: formData.get("sourcePage") || undefined,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof LeadError) return { error: error.message };
    // Never leak an internal error to an anonymous visitor.
    console.error("Lead submission failed", error);
    return { error: "Something went wrong saving your message. Please try again." };
  }
}
