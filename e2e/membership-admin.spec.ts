import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.groundcontrol.local`;
}

async function inviteAndAccept(
  page: import("@playwright/test").Page,
  memberName: string,
  memberOrgName: string,
  memberEmail: string,
  memberPassword: string
): Promise<string> {
  await page.goto("/organization/members");
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByRole("button", { name: "Send invitation" }).click();
  const inviteLink = await page.locator("code").first().innerText();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/signup");
  await page.getByLabel("Your name").fill(memberName);
  await page.getByLabel("Organization name").fill(memberOrgName);
  await page.getByLabel("Work email").fill(memberEmail);
  await page.getByLabel("Password").fill(memberPassword);
  await page.getByRole("button", { name: "Create organization" }).click();
  // A fresh organization's onboarding is never complete — signup lands in onboarding, not Mission Control.
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto(inviteLink);
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page).toHaveURL(/\/onboarding/); // redirected via /mission-control, same reason as above

  return inviteLink;
}

test("an owner can change a member's role", async ({ page }) => {
  const ownerEmail = uniqueEmail("role-owner");
  const memberEmail = uniqueEmail("role-member");

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Role Owner");
  await page.getByLabel("Organization name").fill("Role Change Org");
  await page.getByLabel("Work email").fill(ownerEmail);
  await page.getByLabel("Password").fill("owner-password-123");
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await inviteAndAccept(page, "Role Member", "Role Member's Org", memberEmail, "member-password-123");

  // Back to the owner's session.
  await page.goto("/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password").fill("owner-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.goto("/organization/members");

  const memberRow = page.locator("tr", { hasText: "Role Member" });
  await memberRow.getByRole("combobox").selectOption("ADMINISTRATOR");

  await expect(memberRow.getByRole("combobox")).toHaveValue("ADMINISTRATOR");
});

test("an owner can remove a member, and the removed member immediately loses access to that organization", async ({ page }) => {
  const ownerEmail = uniqueEmail("remove-owner");
  const memberEmail = uniqueEmail("remove-member");

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Remove Owner");
  await page.getByLabel("Organization name").fill("Removal Org");
  await page.getByLabel("Work email").fill(ownerEmail);
  await page.getByLabel("Password").fill("owner-password-123");
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await inviteAndAccept(page, "Remove Member", "Remove Member's Org", memberEmail, "member-password-123");

  await page.goto("/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password").fill("owner-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.goto("/organization/members");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove Remove Member" }).click();
  await expect(page.getByText("Remove Member was removed.")).toBeVisible(); // toast confirms the async removal completed
  await expect(page.getByRole("cell", { name: "Remove Member", exact: true })).not.toBeVisible();

  // The removed member logs back in — Removal Org must no longer be reachable.
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByLabel("Password").fill("member-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  // Their own organization ("Remove Member's Org") is also mid-onboarding,
  // so login lands there too — go to a page that renders the full app
  // shell (org switcher included) regardless of onboarding completion.
  await expect(page).toHaveURL(/\/onboarding/);
  await page.goto("/organization/members");

  // Falls back to their own organization, not the one they were removed from.
  await expect(page.getByRole("main").getByText("Remove Member's Org")).toBeVisible();
  await expect(page.getByText("Removal Org")).toHaveCount(0);

  // The switcher no longer lists the removed-from organization at all.
  await page.getByRole("button", { name: /Remove Member's Org/ }).click();
  await expect(page.getByRole("menuitem", { name: /Removal Org/ })).not.toBeVisible();
});

test("an owner cannot remove the final owner", async ({ page }) => {
  const ownerEmail = uniqueEmail("lastowner");

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Last Owner");
  await page.getByLabel("Organization name").fill("Last Owner Org");
  await page.getByLabel("Work email").fill(ownerEmail);
  await page.getByLabel("Password").fill("owner-password-123");
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/organization/members");
  // The sole owner's own row shows "Owner — protected" with no remove control at all.
  const ownerRow = page.locator("tr", { hasText: "Last Owner" });
  await expect(ownerRow.getByText("Owner — protected")).toBeVisible();
  await expect(ownerRow.getByRole("button")).toHaveCount(0);
});
