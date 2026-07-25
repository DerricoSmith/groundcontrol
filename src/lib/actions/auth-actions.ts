"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { createOrganizationForNewUser } from "@/lib/services/organization-service";

export interface AuthFormState {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signupAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !organizationName || !email || !password) {
    return { error: "All fields are required." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists — try logging in instead." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await createOrganizationForNewUser({ userId: user.id, organizationName });

  try {
    await signIn("credentials", { email, password, redirectTo: "/mission-control" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed — try logging in." };
    }
    throw error;
  }

  return {};
}

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/mission-control" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Incorrect email or password." };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
