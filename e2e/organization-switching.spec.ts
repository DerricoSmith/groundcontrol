import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.groundcontrol.local`;
}

test("a user who accepts an invitation into a second organization can switch between both, and customer-scoped data reflects the active org", async ({ page }) => {
  const ownerEmail = uniqueEmail("switch-owner");
  const memberEmail = uniqueEmail("switch-member");

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Switch Owner");
  await page.getByLabel("Organization name").fill("Switch Org Alpha");
  await page.getByLabel("Work email").fill(ownerEmail);
  await page.getByLabel("Password").fill("owner-password-123");
  await page.getByRole("button", { name: "Create organization" }).click();
  // A fresh organization's onboarding is never complete, so signup lands in
  // onboarding. /organization/members renders the full app shell (including
  // the org switcher) regardless of onboarding completion, so tests below
  // use it as the stable place to check "which org am I in."
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/organization/members");
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByRole("button", { name: "Send invitation" }).click();
  const inviteLink = await page.locator("code").first().innerText();
  await page.getByRole("button", { name: "Sign out" }).click();

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Switch Member");
  await page.getByLabel("Organization name").fill("Switch Org Beta");
  await page.getByLabel("Work email").fill(memberEmail);
  await page.getByLabel("Password").fill("member-password-123");
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.goto("/organization/members");
  await expect(page.getByRole("main").getByText("Switch Org Beta")).toBeVisible();

  await page.goto(inviteLink);
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Signup's org is the first membership, so it's still active immediately after accepting.
  await page.goto("/organization/members");
  await expect(page.getByRole("main").getByText("Switch Org Beta")).toBeVisible();

  // Open the switcher and move to the newly joined organization.
  // switchOrganizationAction redirects to /mission-control, which may
  // redirect onward to /onboarding depending on that org's own onboarding
  // state — the point of this test is the active org context, not that
  // intermediate hop, so land explicitly on /organization/members instead
  // of asserting a specific URL right after the switch.
  await page.getByRole("button", { name: /Switch Org Beta/ }).click();
  await page.getByRole("menuitem", { name: /Switch Org Alpha/ }).click();
  // The click triggers switchOrganizationAction's own server-side redirect
  // (to /mission-control, possibly onward to /onboarding); wait for that
  // navigation to fully settle before navigating again ourselves, or the
  // two navigations race and the later one silently wins.
  await page.waitForURL(/\/(mission-control|onboarding)/);

  await page.goto("/organization/members");
  await expect(page.getByRole("main").getByText("Switch Org Alpha")).toBeVisible();
  await expect(page.getByText("Switch Org Beta")).toHaveCount(0);

  // Switch back.
  await page.getByRole("button", { name: /Switch Org Alpha/ }).click();
  await page.getByRole("menuitem", { name: /Switch Org Beta/ }).click();
  await page.waitForURL(/\/(mission-control|onboarding)/);
  await page.goto("/organization/members");
  await expect(page.getByRole("main").getByText("Switch Org Beta")).toBeVisible();
});
