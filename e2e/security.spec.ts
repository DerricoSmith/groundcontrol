import { test, expect } from "@playwright/test";

/**
 * Security properties asserted against real HTTP responses.
 *
 * Every check here exists because the corresponding protection can regress
 * silently: a header dropped from next.config.ts, a route added under an
 * authenticated prefix, or a demo page that starts accepting writes would all
 * pass type checking and unit tests.
 */

test.describe("security headers", () => {
  test("every response carries the baseline security headers", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);

    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");

    const csp = headers["content-security-policy"];
    expect(csp).toBeTruthy();
    // The directives that actually stop an attack, rather than the whole string,
    // so the policy can evolve without the test becoming a copy of it.
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("base-uri 'self'");
  });

  test("authenticated route prefixes are marked noindex", async ({ request }) => {
    // Follows the redirect to /login, but the header is applied by path, so it
    // is present on the response for the protected path itself.
    const response = await request.get("/mission-control", { maxRedirects: 0 });
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("robots.txt disallows the authenticated surface and allows the public site", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body).toContain("Disallow: /mission-control");
    expect(body).toContain("Disallow: /customers");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap:");
  });

  test("the sitemap lists public pages and no authenticated page", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body).toContain("/showcase");
    expect(body).toContain("/demo");
    expect(body).not.toContain("/mission-control");
    expect(body).not.toContain("/organization");
  });
});

test.describe("protected routes", () => {
  const PROTECTED = [
    "/mission-control",
    "/customers",
    "/risks",
    "/renewals",
    "/actions",
    "/escalations",
    "/executive-briefs",
    "/imports",
    "/data-quality",
    "/organization/members",
  ];

  for (const path of PROTECTED) {
    test(`${path} rejects an unauthenticated visitor`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("public demo isolation", () => {
  test("the demo cannot be pointed at another organization by changing the URL", async ({ page }) => {
    // The demo resolves its organization from a constant slug that must also
    // carry the demo flag, so an unknown identifier is a 404 rather than a
    // window into someone else's data.
    const response = await page.goto("/demo/accounts/not-a-real-account");
    expect(response?.status()).toBe(404);
  });

  test("demo pages expose no mutating controls", async ({ page }) => {
    await page.goto("/demo");

    // The demo is server rendered and read only. Any form or submit control
    // would be a write path reachable without authentication.
    await expect(page.locator("main form")).toHaveCount(0);
    await expect(page.locator("main button[type=submit]")).toHaveCount(0);
  });

  test("demo pages disclose that the data is fictional", async ({ page }) => {
    for (const path of ["/demo", "/demo/accounts", "/demo/brief"]) {
      await page.goto(path);
      await expect(page.getByText(/fictional/i).first()).toBeVisible();
    }
  });
});

test.describe("health endpoint", () => {
  test("reports status without describing the system", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBe("ok");

    // An unauthenticated endpoint must not describe the infrastructure.
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("postgres");
    expect(serialized).not.toContain("neon");
    expect(serialized).not.toContain("schema");
    expect(body).not.toHaveProperty("version");
  });
});

test.describe("seed refresh route", () => {
  test("rejects a request without the seed secret", async ({ request }) => {
    const response = await request.post("/api/demo/refresh");
    // 401 when the secret is configured, 404 when the route is disabled.
    // Either is a refusal; what matters is that it never succeeds.
    expect([401, 404]).toContain(response.status());
  });
});
