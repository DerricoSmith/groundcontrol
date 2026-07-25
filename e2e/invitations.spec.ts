import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.groundcontrol.local`;
}

async function signUp(page: import("@playwright/test").Page, name: string, orgName: string, email: string, password: string) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Organization name").fill(orgName);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create organization" }).click();
  // A fresh organization's onboarding is never complete, so signup lands in
  // onboarding, not Mission Control — see mission-control/page.tsx's guard.
  await expect(page).toHaveURL(/\/onboarding/);
}

test.describe("invitation flow", () => {
  test("an owner can create an invitation, and it can be accepted by the invited email", async ({ page }) => {
    const ownerEmail = uniqueEmail("inv-owner");
    const inviteeEmail = uniqueEmail("inv-invitee");

    await signUp(page, "Inviting Owner", "Inviting Org", ownerEmail, "owner-password-123");

    await page.goto("/organization/members");
    await page.getByLabel("Email").fill(inviteeEmail);
    await page.getByLabel("Role").selectOption("CS_MANAGER");
    await page.getByRole("button", { name: "Send invitation" }).click();

    await expect(page.getByText("Development mode")).toBeVisible();
    const inviteLink = await page.locator("code").first().innerText();
    expect(inviteLink).toContain("/invite/accept?token=");
    await expect(page.getByText(inviteeEmail)).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Visiting the link while logged out shows a preview and asks to log in/sign up.
    await page.goto(inviteLink);
    await expect(page.getByRole("heading", { name: "Join Inviting Org" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();

    await signUp(page, "Invited Person", "Invited Person's Own Org", inviteeEmail, "invitee-password-123");

    await page.goto(inviteLink);
    await expect(page.getByRole("button", { name: "Accept invitation" })).toBeVisible();
    await page.getByRole("button", { name: "Accept invitation" }).click();

    // acceptInvitationAction's client form redirects to /mission-control on
    // success, which then redirects onward to /onboarding for this user's
    // own (also-incomplete) organization — see mission-control's guard.
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("an invitation cannot be accepted by a different email address", async ({ page }) => {
    const ownerEmail = uniqueEmail("inv-owner2");
    const inviteeEmail = uniqueEmail("inv-invitee2");
    const wrongEmail = uniqueEmail("inv-wrong");

    await signUp(page, "Owner Two", "Org Two", ownerEmail, "owner-password-123");

    await page.goto("/organization/members");
    await page.getByLabel("Email").fill(inviteeEmail);
    await page.getByRole("button", { name: "Send invitation" }).click();
    const inviteLink = await page.locator("code").first().innerText();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await signUp(page, "Wrong Person", "Wrong Person's Org", wrongEmail, "wrong-password-123");

    await page.goto(inviteLink);
    await expect(page.getByText(/log out and sign in with the invited address/i)).toBeVisible();
  });

  test("a revoked invitation cannot be accepted", async ({ page }) => {
    const ownerEmail = uniqueEmail("inv-owner3");
    const inviteeEmail = uniqueEmail("inv-invitee3");

    await signUp(page, "Owner Three", "Org Three", ownerEmail, "owner-password-123");

    await page.goto("/organization/members");
    await page.getByLabel("Email").fill(inviteeEmail);
    await page.getByRole("button", { name: "Send invitation" }).click();
    const inviteLink = await page.locator("code").first().innerText();

    await page.getByRole("button", { name: `Revoke invitation to ${inviteeEmail}` }).click();
    await expect(page.getByText(inviteeEmail)).not.toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    await signUp(page, "Revoked Invitee", "Revoked Invitee Org", inviteeEmail, "invitee-password-123");

    await page.goto(inviteLink);
    await expect(page.getByRole("heading", { name: "Invitation revoked" })).toBeVisible();
  });
});
