import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
// Node-only setup; credentials are never bundled in the app.
// @ts-ignore local Node bootstrap helper
import { localStatus, apiRequest } from "../../scripts/local-lib.mjs";

const lesson = "10000000-0000-4000-8000-000000000010";
let account: { email: string; password: string };
let other: typeof account;
test.beforeAll(async () => {
  const status = localStatus();
  for (const name of ["Refresh Learner", "Other Learner"]) {
    const user = {
      email: `session-web-${randomUUID()}@pbl6.local.test`,
      password: randomUUID() + "Aa1!",
    };
    await apiRequest(status, "/auth/v1/admin/users", {
      method: "POST",
      body: {
        ...user,
        email_confirm: true,
        user_metadata: { full_name: name },
      },
    });
    if (name === "Refresh Learner") account = user;
    else other = user;
  }
});
test.beforeEach(async ({ page }) => {
  await page.goto("/#/login");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Chào .*cùng học nhé/ }),
  ).toBeVisible();
});

async function refresh(page: Page) {
  // Auth timestamps have second precision: ensure the refreshed JWT differs.
  await page.route(
    "**/auth/v1/token?grant_type=refresh_token",
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await route.continue();
    },
  );
  await page.evaluate(async () => {
    const modulePath = "/src/api.ts";
    const { auth } = await import(modulePath);
    const { error } = await auth.auth.refreshSession();
    if (error) throw error;
  });
}

for (const screen of ["note", "quiz", "dictation"] as const) {
  test(`token refresh preserves the unsaved ${screen} and updates the profile in the background`, async ({
    page,
  }) => {
    if (screen === "dictation") {
      await page.goto("/#/dictation");
      await page
        .locator(".list-row")
        .filter({ hasText: "Introductions — Nghe và chép lại" })
        .first()
        .getByRole("button", { name: "Luyện nghe" })
        .click();
    } else {
      await page.goto("/#/lesson/" + lesson);
      if (screen === "quiz")
        await page.getByRole("button", { name: /Làm bài luyện tập/ }).click();
    }
    const input =
      screen === "note"
        ? page.getByLabel("Nội dung ghi chú", { exact: true })
        : screen === "dictation"
          ? page.getByLabel("Bản chép của bạn", { exact: true })
          : page.getByPlaceholder("Nhập đáp án của bạn").first();
    await input.fill("Unsaved draft after token refresh");
    const element = await input.elementHandle();
    const originalUrl = page.url();
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested!: () => void;
    const started = new Promise<void>((resolve) => {
      requested = resolve;
    });
    await page.route("**/v1/me", async (route) => {
      const response = await route.fetch();
      const profile = await response.json();
      requested();
      await blocked;
      await route.fulfill({
        response,
        json: { ...profile, display_name: "Refreshed profile" },
      });
    });
    await refresh(page);
    await started;
    try {
      await expect(input).toHaveValue("Unsaved draft after token refresh");
    } finally {
      release();
    }
    await expect(page.locator(".account")).toContainText("Refreshed profile");
    expect(await element!.evaluate((node) => node.isConnected)).toBe(true);
    await expect(input).toHaveValue("Unsaved draft after token refresh");
    expect(page.url()).toBe(originalUrl);
    if (screen === "note") {
      await page
        .getByRole("button", { name: "Lưu ghi chú", exact: true })
        .click();
      await expect(
        page.getByRole("status").filter({ hasText: "Đã lưu ghi chú." }),
      ).toBeVisible();
      await page.reload();
      await expect(input).toHaveValue("Unsaved draft after token refresh");
    }
  });
}

test("a temporary profile refresh failure preserves the draft and allows retry", async ({
  page,
}) => {
  await page.goto("/#/lesson/" + lesson);
  const input = page.getByLabel("Nội dung ghi chú", { exact: true });
  await input.fill("Draft during an outage");
  await page.route("**/v1/me", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { code: "UPSTREAM_UNAVAILABLE" } },
    }),
  );
  await refresh(page);
  await expect(page.getByRole("alert")).toContainText("Dịch vụ đang gián đoạn");
  await expect(input).toHaveValue("Draft during an outage");
  await page.unroute("**/v1/me");
  await page.getByRole("button", { name: "Thử lại hồ sơ" }).click();
  await expect(page.getByRole("button", { name: "Thử lại hồ sơ" })).toHaveCount(
    0,
  );
  await expect(input).toHaveValue("Draft during an outage");
});

test("a rejected session still removes private content after refresh", async ({
  page,
}) => {
  await page.goto("/#/lesson/" + lesson);
  await page
    .getByLabel("Nội dung ghi chú", { exact: true })
    .fill("Private draft");
  await page.route("**/v1/me", (route) =>
    route.fulfill({
      status: 401,
      json: { error: { code: "SESSION_REVOKED" } },
    }),
  );
  await refresh(page);
  await expect(
    page.getByRole("button", { name: "Đăng nhập bằng tài khoản khác" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Nội dung ghi chú", { exact: true }),
  ).toHaveCount(0);
});

test("switching accounts clears the previous account's draft", async ({
  page,
}) => {
  await page.goto("/#/lesson/" + lesson);
  const input = page.getByLabel("Nội dung ghi chú", { exact: true });
  await input.fill("First account private draft");
  await page.evaluate(async (credentials) => {
    const modulePath = "/src/api.ts";
    const { auth } = await import(modulePath);
    const { error } = await auth.auth.signInWithPassword(credentials);
    if (error) throw error;
  }, other);
  await expect(page.locator(".account")).toContainText("Other Learner");
  await expect(input).toHaveValue("");
});
