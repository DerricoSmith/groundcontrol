import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Generates the product screenshots used on the public showcase.
 *
 *   npx playwright test e2e/screenshots.spec.ts --project=chromium
 *
 * Every image comes from the fictional demonstration environment, so no real
 * customer data can appear. This is a generator rather than a test: it asserts
 * only that each page rendered its real content before capturing, which is
 * what stops a loading state or an error page being shipped as a screenshot.
 */

const OUTPUT_DIR = resolve(process.cwd(), "public", "screenshots");

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

test.beforeAll(() => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
});

/**
 * Hides the Next.js dev tools launcher and disables animation before a
 * capture, so images are stable and contain nothing that is absent from a
 * production build.
 */
async function prepare(page: Page) {
  await page.addStyleTag({
    content: `
      nextjs-portal { display: none !important; }
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
  // Fonts settle after load; capturing before they do produces a visible
  // reflow between images.
  await page.evaluate(() => document.fonts.ready);
}

async function capture(page: Page, path: string, name: string, waitFor: RegExp, fullPage = true) {
  await page.goto(path);
  // Assert the page actually rendered its content, not a loading or error
  // state, before anything is written to disk.
  await expect(page.getByText(waitFor).first()).toBeVisible({ timeout: 30_000 });
  await prepare(page);
  await page.screenshot({ path: resolve(OUTPUT_DIR, name), fullPage, animations: "disabled" });
}

test.describe("demo screenshots", () => {
  test("desktop captures", async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    await capture(page, "/demo", "demo-mission-control.png", /What needs attention/i);
    await capture(page, "/demo/accounts", "demo-customer-portfolio.png", /Customer portfolio/i);
    await capture(page, "/demo/accounts/harborline", "demo-account-detail.png", /How this score was produced/i);
    await capture(page, "/demo/risks", "demo-risk-evidence.png", /Risk radar/i);
    await capture(page, "/demo/actions", "demo-recommended-actions.png", /Actions/i);
    await capture(page, "/demo/renewals", "demo-renewals.png", /Renewal center/i);
    await capture(page, "/demo/brief", "demo-executive-brief.png", /Executive brief/i);
  });

  test("mobile captures", async ({ page }) => {
    await page.setViewportSize(MOBILE);

    await capture(page, "/demo", "demo-mission-control-mobile.png", /What needs attention/i);
    await capture(page, "/demo/accounts/harborline", "demo-account-detail-mobile.png", /How this score was produced/i);
  });
});
