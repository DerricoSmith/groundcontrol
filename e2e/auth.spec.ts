import { test, expect } from "@playwright/test";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.groundcontrol.local`;
}

test.describe("signup, login, logout", () => {
  test("a new owner can sign up, the organization is created, and they are routed into onboarding (not an empty Mission Control)", async ({ page }) => {
    const email = uniqueEmail("owner");

    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Riley Owner");
    await page.getByLabel("Organization name").fill("Riley's Company");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill("owner-password-123");
    await page.getByRole("button", { name: "Create organization" }).click();

    // A brand-new organization's onboarding is never complete, so the owner
    // lands in onboarding, not directly on Mission Control — see
    // src/app/(app)/mission-control/page.tsx's redirect guard.
    await expect(page).toHaveURL(/\/onboarding\/welcome/);
    await expect(page.getByText("Riley's Company")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Let's set up the customer information your team needs." })).toBeVisible();

    // Mission Control itself still exists and still redirects back to onboarding for this owner.
    await page.goto("/mission-control");
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("signing up with an email that already has an account is rejected", async ({ page }) => {
    const email = uniqueEmail("dupe");

    await page.goto("/signup");
    await page.getByLabel("Your name").fill("First Person");
    await page.getByLabel("Organization name").fill("First Org");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill("first-password-123");
    await page.getByRole("button", { name: "Create organization" }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Second Person");
    await page.getByLabel("Organization name").fill("Second Org");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill("second-password-123");
    await page.getByRole("button", { name: "Create organization" }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("logout returns to login, and the same account can log back in (returning login), resuming onboarding where it left off", async ({ page }) => {
    const email = uniqueEmail("returning");

    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Returning User");
    await page.getByLabel("Organization name").fill("Returning Org");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill("returning-password-123");
    await page.getByRole("button", { name: "Create organization" }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Root path with no session redirects to login, not a stale mission-control page.
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("returning-password-123");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByText("Returning Org")).toBeVisible();
  });

  test("an incorrect password is rejected with a clear error, not a silent failure", async ({ page }) => {
    const email = uniqueEmail("wrongpass");

    await page.goto("/signup");
    await page.getByLabel("Your name").fill("Wrong Pass");
    await page.getByLabel("Organization name").fill("Wrong Pass Org");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Password").fill("correct-password-123");
    await page.getByRole("button", { name: "Create organization" }).click();
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByRole("button", { name: "Sign out" }).click();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("totally-wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
