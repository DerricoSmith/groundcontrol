import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility coverage for every route the release plan requires.
 *
 * Runs axe-core locally in the browser. Nothing is sent to an external
 * accessibility service, so no application content leaves the machine.
 *
 * The release fails on critical and serious violations. Moderate and minor
 * findings are printed and recorded in ACCESSIBILITY_KNOWN_LIMITATIONS.md
 * rather than silently ignored or silently blocking.
 *
 * This is automated coverage, not a WCAG conformance claim. Automated tooling
 * catches roughly a third of real barriers; the manual pass that covers the
 * rest is documented in ACCESSIBILITY_MANUAL_REVIEW.md.
 */

const BLOCKING_IMPACTS = new Set(["critical", "serious"]);

async function auditPage(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // Next.js injects a dev tools launcher that is not part of the product and
    // is absent from a production build.
    .exclude("nextjs-portal")
    .analyze();

  const blocking = results.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact ?? ""));
  const advisory = results.violations.filter((violation) => !BLOCKING_IMPACTS.has(violation.impact ?? ""));

  if (advisory.length > 0) {
    console.log(`\n[${label}] ${advisory.length} moderate or minor finding(s):`);
    for (const violation of advisory) {
      console.log(`  ${violation.impact}: ${violation.id} — ${violation.help} (${violation.nodes.length} node(s))`);
    }
  }

  if (blocking.length > 0) {
    const detail = blocking
      .map((violation) => {
        const nodes = violation.nodes.slice(0, 3).map((node) => `      ${node.target.join(" ")}`).join("\n");
        return `  ${violation.impact}: ${violation.id} — ${violation.help}\n${nodes}`;
      })
      .join("\n");
    throw new Error(`[${label}] ${blocking.length} critical or serious violation(s):\n${detail}`);
  }

  expect(blocking).toHaveLength(0);
}

/** Signs up a fresh account so the authenticated routes can be audited. */
async function signUpFreshAccount(page: Page): Promise<void> {
  const unique = `a11y-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Accessibility Auditor");
  await page.getByLabel("Organization name").fill(`A11y Org ${unique}`);
  await page.getByLabel("Work email").fill(`${unique}@a11y.test`);
  await page.getByLabel("Password").fill("accessibility-password-123");
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
}

test.describe("accessibility: public routes", () => {
  const routes: [string, string][] = [
    ["/", "Home"],
    ["/ground-control", "Ground Control product"],
    ["/showcase", "Showcase"],
    ["/about", "About"],
    ["/services", "Services"],
    ["/trust", "Trust"],
    ["/contact", "Contact"],
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
  ];

  for (const [path, label] of routes) {
    test(`${label} (${path}) has no critical or serious violations`, async ({ page }) => {
      await page.goto(path);
      await auditPage(page, label);
    });
  }
});

test.describe("accessibility: demo routes", () => {
  const routes: [string, string][] = [
    ["/demo", "Demo Mission Control"],
    ["/demo/accounts", "Demo Customer Portfolio"],
    ["/demo/accounts/harborline", "Demo Account Detail"],
    ["/demo/risks", "Demo Risks"],
    ["/demo/renewals", "Demo Renewals"],
    ["/demo/actions", "Demo Actions"],
    ["/demo/brief", "Demo Executive Brief"],
  ];

  for (const [path, label] of routes) {
    test(`${label} (${path}) has no critical or serious violations`, async ({ page }) => {
      await page.goto(path);
      // The demo environment is only seeded in some databases. When it is
      // absent the page renders an honest unavailable state, which is still
      // worth auditing, so no skip is needed.
      await auditPage(page, label);
    });
  }
});

test.describe("accessibility: authentication routes", () => {
  for (const [path, label] of [["/login", "Login"], ["/signup", "Signup"]] as [string, string][]) {
    test(`${label} (${path}) has no critical or serious violations`, async ({ page }) => {
      await page.goto(path);
      await auditPage(page, label);
    });
  }
});

test.describe("accessibility: authenticated routes", () => {
  test("onboarding, mission control, portfolio, account detail, briefs, team, and imports", async ({ page }) => {
    await signUpFreshAccount(page);

    await auditPage(page, "Onboarding");

    for (const [path, label] of [
      ["/mission-control", "Mission Control"],
      ["/customers", "Customer Portfolio"],
      ["/executive-briefs", "Executive Brief"],
      ["/organization/members", "Team management"],
      ["/imports", "Data imports"],
      ["/risks", "Risk Radar"],
      ["/renewals", "Renewal Center"],
      ["/actions", "Actions"],
      ["/data-quality", "Data Quality"],
    ] as [string, string][]) {
      await page.goto(path);
      await auditPage(page, label);
    }
  });
});
