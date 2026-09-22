import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { WORD_MEANING_DISPLAY_SECONDS } from "../../apps/web/src/games/typing/config";
// Node-only local fixtures; never bundled in the web app.
// @ts-ignore local bootstrap helpers
import { localStatus, apiRequest } from "../../scripts/local-lib.mjs";

let status: ReturnType<typeof localStatus>;
let account: { email: string; password: string };
const testWords = ["apple", "cloud", "don't", "well-known", "operating system"];
test.beforeAll(() => {
  status = localStatus();
});
test.beforeEach(async ({ page }) => {
  account = {
    email: `typing-web-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "Aa1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...account,
      email_confirm: true,
      user_metadata: { full_name: "Typing Web Learner" },
    },
  });
  const login = await fetch(
    status.API_URL + "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      headers: { apikey: status.ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(account),
    },
  );
  const data = await login.json();
  await fetch("http://127.0.0.1:4001/v1/me", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  for (const word of testWords) {
    const res = await fetch("http://127.0.0.1:4003/v1/flashcards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        word,
        meaning: "Từ vựng để kiểm thử",
        example: "",
      }),
    });
    expect(res.status).toBe(201);
  }
  await page.goto("/#/login");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Chào .*cùng học nhé/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Mini game", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bắt đầu chơi", exact: true }),
  ).toBeEnabled();
});
async function start(page: Page) {
  await page.getByRole("button", { name: "Bắt đầu chơi", exact: true }).click();
  await page
    .getByRole("button", { name: "Sẵn sàng, bắt đầu!", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Sẵn sàng, bắt đầu!", exact: true }),
  ).toHaveCount(0);
  const stage = page.getByRole("region", { name: "Sân chơi gõ từ" });
  await expect(page.locator(".typing-overlay")).toHaveCount(0);
  await expect(stage).toBeFocused();
}
async function solve(page: Page) {
  const stage = page.getByRole("region", { name: "Sân chơi gõ từ" });
  for (let n = 0; n < 5; n++) {
    const target = page.getByTestId("falling-word").first();
    await expect(target).toBeVisible();
    const word = await target.getAttribute("data-word");
    await stage.pressSequentially(word!, { delay: 20 });
    await expect(
      page.getByTestId("falling-word").filter({ hasText: word! }),
    ).toHaveCount(0);
    await expect(
      page.getByTestId("completed-word").filter({ hasText: word! }),
    ).toContainText("Từ vựng để kiểm thử");
  }
}
test("play a complete real round, save score, review and reload history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.screenshot({ path: ".local/typing-setup.png", fullPage: true });
  await start(page);
  await page.screenshot({ path: ".local/typing-playing.png", fullPage: true });
  await solve(page);
  const lastMeaning = page.getByTestId("completed-word").last();
  await expect(lastMeaning).toBeVisible();
  await page.screenshot({ path: ".local/typing-meaning.png", fullPage: true });
  await expect(page.getByText("LƯỢT CHƠI ĐÃ LƯU", { exact: true })).toHaveCount(
    0,
  );
  const waitingSince = Date.now();
  await expect(page.getByTestId("completed-word")).toHaveCount(0, {
    timeout: WORD_MEANING_DISPLAY_SECONDS * 1000 + 2000,
  });
  expect(Date.now() - waitingSince).toBeGreaterThan(
    WORD_MEANING_DISPLAY_SECONDS * 1000 - 1000,
  );
  await expect(
    page.getByText("LƯỢT CHƠI ĐÃ LƯU", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.screenshot({ path: ".local/typing-result.png", fullPage: true });
  await page.reload();
  await expect(
    page.getByText("LƯỢT CHƠI ĐÃ LƯU", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Đổi bộ từ", exact: true }).click();
  await page.getByRole("link", { name: "Lịch sử chơi", exact: true }).click();
  await expect(page.locator(".typing-history-row")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("pause, scoped keyboard, navigation guard and token refresh keep the same game", async ({
  page,
}) => {
  await start(page);
  const stage = page.getByRole("region", { name: "Sân chơi gõ từ" });
  const word = await page
    .getByTestId("falling-word")
    .first()
    .getAttribute("data-word");
  await stage.pressSequentially(word![0]);
  await expect(page.getByText("ĐANG GÕ", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("completed-word")).toHaveCount(0);
  await expect(page.locator(".typing-falling.locked mark")).toHaveText(
    word![0],
  );
  await stage.press("Escape");
  await expect(
    page.getByRole("button", { name: "Tiếp tục", exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const modulePath = "/src/api.ts";
    const { auth } = await import(modulePath);
    const { error } = await auth.auth.refreshSession();
    if (error) throw error;
  });
  await expect(page.locator(".typing-falling.locked mark")).toHaveText(
    word![0],
  );
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Thẻ từ vựng", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tiếp tục", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.locator(".typing-overlay")).toHaveCount(0);
  await stage.press("Tab");
  await expect(page.locator(".typing-falling.locked")).toHaveCount(0);
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tiếp tục", exact: true }),
  ).toBeVisible();
});
test("failed finish survives reload, retries the same key, and saves only once", async ({
  page,
}) => {
  let fail = true;
  const keys: string[] = [];
  await page.route("**/v1/typing-sessions/*/finish", async (route) => {
    keys.push(route.request().headers()["idempotency-key"]!);
    if (fail) await route.abort("failed");
    else await route.continue();
  });
  await start(page);
  await solve(page);
  await expect(
    page.getByText("Kết quả chưa được lưu lên máy chủ.", { exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.getByText("KẾT QUẢ TRÊN THIẾT BỊ", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Thử lưu lại", exact: true }),
  ).toBeEnabled();
  fail = false;
  await page.getByRole("button", { name: "Thử lưu lại", exact: true }).click();
  await expect(
    page.getByText("LƯỢT CHƠI ĐÃ LƯU", { exact: true }),
  ).toBeVisible();
  expect(keys.length).toBeGreaterThanOrEqual(3);
  expect(new Set(keys).size).toBe(1);
});
test("reload mid-game is explicit and abandoning permits a fresh round", async ({
  page,
}) => {
  await start(page);
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Lượt trước đã bị gián đoạn",
      exact: true,
    }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Kết thúc lượt cũ", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Bắt đầu chơi", exact: true }),
  ).toBeEnabled();
});
test("small screens preserve setup and history without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByText(/Game dành cho máy tính có bàn phím vật lý/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/typing-mobile-setup.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Lịch sử chơi", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vườn từ đang chờ bạn", exact: true }),
  ).toBeVisible();
});
test("another tab cannot restart the existing game and logout hides private state", async ({
  page,
  context,
}) => {
  await start(page);
  const otherPage = await context.newPage();
  await otherPage.goto(page.url());
  await expect(
    otherPage.getByRole("heading", {
      name: "Lượt trước đã bị gián đoạn",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    otherPage.getByRole("region", { name: "Sân chơi gõ từ" }),
  ).toHaveCount(0);
  await otherPage.close();
  await page.evaluate(async () => {
    const modulePath = "/src/api.ts";
    const { auth } = await import(modulePath);
    await auth.auth.signOut({ scope: "local" });
  });
  await expect(
    page.getByRole("region", { name: "Sân chơi gõ từ" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Tiếp tục hành trình của bạn",
      exact: true,
    }),
  ).toBeVisible();
});
