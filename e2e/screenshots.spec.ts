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

test.beforeAll(async ({ request }) => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // The seed writes raw records; health scores, risks, actions, and the brief
  // are derived by services. Without this the risk and brief pages render
  // empty and the generator would capture blank regions.
  const response = await request.post("/api/demo/refresh", {
    headers: { "x-seed-secret": "e2e-only-seed-secret" },
    timeout: 180_000,
  });
  if (!response.ok()) {
    throw new Error(`Could not populate demo intelligence: ${response.status()} ${await response.text()}`);
  }
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
      /*
        Playwright captures an element's box as it appears in the viewport, so
        anything painted over that box lands in the image. The site header is
        sticky and the mobile bar is fixed, which is why the marketing shots
        were showing the site's own navigation, clipped, inside a browser frame.
      */
      [data-site-header], nav.fixed { display: none !important; }
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

/**
 * Captures a single element rather than the page.
 *
 * A full-page shot of a demo route includes the public site header and the
 * fictional-data notice, so the marketing page ends up showing its own
 * navigation inside a browser frame, which reads as a mistake. Framing the
 * product region instead produces an image that looks like the application.
 */
async function captureRegion(
  page: Page,
  path: string,
  name: string,
  selector: string,
  maxItems?: number
) {
  await page.goto(path);
  const region = page.locator(selector).first();
  await expect(region).toBeVisible({ timeout: 30_000 });
  await prepare(page);

  // A list of 32 risks produces a very tall, very heavy image that reads as a
  // strip rather than as a screen. Dropping whole cards rather than clipping at
  // a pixel height means the bottom edge falls between two cards instead of
  // through the middle of a sentence, which is what made these look accidental.
  if (maxItems) {
    await region.evaluate((element, count) => {
      Array.from(element.children)
        .slice(count)
        .forEach((child) => child.remove());
    }, maxItems);
  }

  // The sticky header is hidden, but the region can still be scrolled under
  // where it was. Bring the top of the region to the top of the viewport so the
  // capture starts on the region's own first pixel.
  await region.evaluate((element) => {
    element.scrollIntoView({ block: "start", behavior: "instant" });
  });

  await region.screenshot({ path: resolve(OUTPUT_DIR, name), animations: "disabled" });
}

test.describe("demo screenshots", () => {
  test("desktop captures", async ({ page }) => {
    await page.setViewportSize(DESKTOP);

    // Region captures for the shots the marketing pages frame. A full-page
    // capture of a demo route includes the public site header, so the image
    // ends up showing the site's own navigation inside a browser frame.
    await captureRegion(page, "/demo", "demo-mission-control.png", '[data-shot="mission-control"]');
    await captureRegion(page, "/demo/accounts", "demo-customer-portfolio.png", '[data-shot="portfolio"]');
    await captureRegion(page, "/demo/accounts/harborline", "demo-account-detail.png", '[data-shot="account-detail"]');
    await captureRegion(page, "/demo/risks", "demo-risk-evidence.png", '[data-shot="risks"]', 3);

    // The executive brief exists only after the intelligence pipeline has run,
    // which the end-to-end seed does not do. Skip rather than overwrite a good
    // image with the empty state; see DEMO_RECOVERY.md for generating one.
    await page.goto("/demo/brief");
    const brief = page.locator('[data-shot="brief"]');
    if ((await brief.count()) > 0) {
      await captureRegion(page, "/demo/brief", "demo-executive-brief.png", '[data-shot="brief"]', 6);
    } else {
      console.log("Skipping the executive brief capture: no brief in this database.");
    }

    await captureRegion(page, "/demo/actions", "demo-recommended-actions.png", "main > div > div:last-child", 4);
    await capture(page, "/demo/renewals", "demo-renewals.png", /Renewal center/i);
  });

  test("mobile captures", async ({ page }) => {
    await page.setViewportSize(MOBILE);

    await captureRegion(page, "/demo", "demo-mission-control-mobile.png", '[data-shot="mission-control"]');
    await captureRegion(
      page,
      "/demo/accounts/harborline",
      "demo-account-detail-mobile.png",
      '[data-shot="account-detail"]'
    );
  });
});
