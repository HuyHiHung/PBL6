import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
// Node-only local fixture helpers.
// @ts-ignore
import { localStatus, apiRequest } from "../../scripts/local-lib.mjs";

async function mockedAttempt(page: Page, kind = "topic_test") {
  const userId = randomUUID();
  const user = {
    id: userId,
    aud: "authenticated",
    role: "authenticated",
    email: "audit@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Draft Learner" },
    created_at: new Date().toISOString(),
  };
  const state: any = {
    id: "draft-attempt",
    title: "Draft test",
    kind,
    status: "in_progress",
    row_version: 1,
    total_count: 2,
    items: [1, 2].map((i) => ({
      id: "item-" + i,
      type: "single_choice",
      prompt: "Question " + i,
      options: [
        { option_key: "A", text: "First" },
        { option_key: "B", text: "Second" },
      ],
      answer: null,
      answer_version: 0,
      checked: false,
    })),
  };
  const writes: any[] = [];
  let failRead = false,
    holdWrite: (() => Promise<void>) | undefined;
  await page.route("http://127.0.0.1:55321/**", (route) =>
    route.fulfill({ json: user }),
  );
  await page.route(/http:\/\/127\.0\.0\.1:400[123]\//, async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    if (path === "/v1/me")
      return route.fulfill({
        json: {
          user_id: userId,
          display_name: "Draft Learner",
          role: "learner",
          permissions: [],
          row_version: 1,
        },
      });
    if (path === "/v1/attempts/draft-attempt" && request.method() === "GET")
      return route.fulfill(
        failRead
          ? { status: 503, json: { error: { code: "UPSTREAM_UNAVAILABLE" } } }
          : { json: state },
      );
    if (path.startsWith("/v1/items/")) {
      const body = request.postDataJSON();
      writes.push(body);
      if (holdWrite) await holdWrite();
      const item = state.items.find((i: any) => path.includes(i.id));
      if (
        state.status !== "in_progress" ||
        item.checked ||
        body.attemptVersion !== state.row_version ||
        body.expectedVersion !== item.answer_version
      )
        return route.fulfill({
          status: 409,
          json: { error: { code: "VERSION_CONFLICT" } },
        });
      item.answer = body.answer;
      item.answer_version++;
      state.row_version++;
      return route.fulfill({
        json: kind === "topic_test" ? { saved: true } : state,
      });
    }
    if (path.endsWith("/submit")) {
      const body = request.postDataJSON();
      if (body.expectedVersion !== state.row_version)
        return route.fulfill({
          status: 409,
          json: { error: { code: "VERSION_CONFLICT" } },
        });
      state.status = "submitted";
      return route.fulfill({ json: state });
    }
    return route.fulfill({ json: { items: [], courses: [] } });
  });
  await page.goto("/#/login");
  const token = [
    Buffer.from('{"alg":"HS256"}').toString("base64url"),
    Buffer.from(
      JSON.stringify({
        sub: userId,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString("base64url"),
    Buffer.from("fake").toString("base64url"),
  ].join(".");
  await page.evaluate(async (token) => {
    const path = "/src/api.ts",
      { auth } = await import(path);
    const { error } = await auth.auth.setSession({
      access_token: token,
      refresh_token: "fake-refresh",
    });
    if (error) throw error;
    location.hash = "/attempt/draft-attempt";
  }, token);
  await expect(page.getByRole("heading", { name: "Draft test" })).toBeVisible();
  return {
    state,
    writes,
    failRead: (value: boolean) => {
      failRead = value;
    },
    hold: (fn?: () => Promise<void>) => {
      holdWrite = fn;
    },
  };
}
const first = (page: Page) => page.locator(".question").first();
const save = (page: Page) =>
  first(page).getByRole("button", { name: "Lưu đáp án", exact: true });

test("different-item conflict refreshes attempt version and keeps the draft for explicit retry", async ({
  page,
}) => {
  const h = await mockedAttempt(page);
  await first(page).getByRole("radio").first().check();
  h.state.row_version++;
  h.state.items[1].answer = { option_key: "B" };
  h.state.items[1].answer_version++;
  await save(page).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Dữ liệu đã thay đổi" }),
  ).toBeVisible();
  await expect(first(page).getByRole("radio").first()).toBeChecked();
  await save(page).click();
  await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
  expect(h.writes.map((w) => w.attemptVersion)).toEqual([1, 2]);
});

test("same-item conflict requires explicit choice before overwriting; unchanged answers are not dirty", async ({
  page,
}) => {
  const h = await mockedAttempt(page);
  await first(page).getByRole("radio").first().check();
  h.state.row_version++;
  h.state.items[0].answer = { option_key: "B" };
  h.state.items[0].answer_version++;
  await save(page).click();
  await expect(first(page).getByText("Bản máy chủ: B")).toBeVisible();
  await expect(save(page)).toBeDisabled();
  page.once("dialog", (d) => d.accept());
  await first(page)
    .getByRole("button", { name: "Giữ bản nhập để lưu lại" })
    .click();
  await save(page).click();
  await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
  expect(h.writes[1].expectedVersion).toBe(1);
  await first(page).getByRole("radio").nth(1).check();
  await first(page).getByRole("radio").first().check();
  await expect(
    page.getByRole("button", { name: "Nộp bài", exact: true }),
  ).toBeEnabled();
});

test("choosing the server answer clears the conflicting draft", async ({
  page,
}) => {
  const h = await mockedAttempt(page);
  await first(page).getByRole("radio").first().check();
  h.state.row_version++;
  h.state.items[0].answer = { option_key: "B" };
  h.state.items[0].answer_version++;
  await save(page).click();
  await first(page).getByRole("button", { name: "Dùng bản máy chủ" }).click();
  await expect(first(page).getByRole("radio").nth(1)).toBeChecked();
  await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
  expect(h.writes).toHaveLength(1);
});

for (const terminal of ["checked", "submitted", "cancelled"])
  test(`a remotely ${terminal} attempt preserves a read-only draft`, async ({
    page,
  }) => {
    const h = await mockedAttempt(
      page,
      terminal === "checked" ? "quiz" : "topic_test",
    );
    await first(page).getByRole("radio").first().check();
    h.state.row_version++;
    h.state.items[0].answer = { option_key: "B" };
    h.state.items[0].answer_version++;
    if (terminal === "checked") h.state.items[0].checked = true;
    else h.state.status = terminal;
    await first(page)
      .getByRole("button", {
        name: terminal === "checked" ? "Kiểm tra câu trả lời" : "Lưu đáp án",
      })
      .click();
    await expect(first(page).getByText("Bản nhập: A")).toBeVisible();
    await expect(first(page).getByRole("radio").first()).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Giữ bản nhập để lưu lại" }),
    ).toHaveCount(0);
    await first(page).getByRole("button", { name: "Dùng bản máy chủ" }).click();
    await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
  });

test("failed conflict refresh keeps the draft and disables writes until retry succeeds", async ({
  page,
}) => {
  const h = await mockedAttempt(page);
  await first(page).getByRole("radio").first().check();
  h.state.row_version++;
  h.failRead(true);
  await save(page).click();
  const retry = page.getByRole("button", {
    name: "Tải lại dữ liệu, giữ bản nhập",
  });
  await expect(retry).toBeEnabled();
  await expect(save(page)).toBeDisabled();
  await expect(first(page).getByRole("radio").first()).toBeChecked();
  h.failRead(false);
  await retry.click();
  await save(page).click();
  await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
});

test("submit conflicts refresh the snapshot without submitting a second time", async ({
  page,
}) => {
  const h = await mockedAttempt(page);
  h.state.row_version++;
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Dữ liệu đã thay đổi" }),
  ).toBeVisible();
  expect(h.state.status).toBe("in_progress");
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(page.locator(".result")).toBeVisible();
});

test("sidebar, Back and reload guard unsaved work; successful save stops prompting", async ({
  page,
}) => {
  await mockedAttempt(page);
  await first(page).getByRole("radio").first().check();
  let dialogs = 0;
  const dismiss = async (d: any) => {
    dialogs++;
    await d.dismiss();
  };
  page.on("dialog", dismiss);
  await page.getByRole("link", { name: "Lịch sử học", exact: true }).click();
  await expect(page).toHaveURL(/attempt\/draft-attempt/);
  await page.goBack({ timeout: 3000 }).catch(() => {});
  await expect(first(page).getByRole("radio").first()).toBeChecked();
  await page.reload({ timeout: 3000 }).catch(() => {});
  await expect(first(page).getByRole("radio").first()).toBeChecked();
  expect(dialogs).toBe(3);
  await save(page).click();
  await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
  await page.getByRole("link", { name: "Lịch sử học", exact: true }).click();
  await expect(page).toHaveURL(/#\/history/);
  expect(dialogs).toBe(3);
  page.off("dialog", dismiss);
});

test("the navigation guard remains active during a pending save and can explicitly discard", async ({
  page,
}) => {
  const h = await mockedAttempt(page);
  await first(page).getByRole("radio").first().check();
  let release!: () => void;
  h.hold(
    () =>
      new Promise((r) => {
        release = r;
      }),
  );
  await save(page).click();
  await expect(save(page)).toBeDisabled();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("link", { name: "Lịch sử học", exact: true }).click();
  await expect(first(page).getByRole("radio").first()).toBeChecked();
  release();
  await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
  await first(page).getByRole("radio").nth(1).check();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("link", { name: "Lịch sử học", exact: true }).click();
  await expect(page).toHaveURL(/#\/history/);
});

test("real API: two clients checking different quiz items recover without losing the browser draft", async ({
  page,
}) => {
  const status = localStatus(),
    account = {
      email: `draft-${randomUUID()}@pbl6.local.test`,
      password: randomUUID() + "Aa1!",
    };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...account,
      email_confirm: true,
      user_metadata: { full_name: "Draft Learner" },
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
  const session = await login.json();
  expect(login.status).toBe(200);
  const request = async (path: string, method = "GET", body?: unknown) => {
    const r = await fetch("http://127.0.0.1:4003" + path, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    expect(r.ok).toBeTruthy();
    return r.json();
  };
  const start = await request("/v1/attempts", "POST", {
    assessment_id: "10000000-0000-4000-8000-000000000012",
  });
  await page.goto("/#/login");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Chào .*cùng học nhé/ }),
  ).toBeVisible();
  await page.goto("/#/attempt/" + start.attempt_id);
  await first(page).getByRole("radio").first().check();
  const old = await request("/v1/attempts/" + start.attempt_id),
    second = old.items[1];
  await request("/v1/items/" + second.id + "/check", "POST", {
    answer: { option_key: "A" },
    expectedVersion: second.answer_version,
    attemptVersion: old.row_version,
  });
  const check = first(page).getByRole("button", {
    name: "Kiểm tra câu trả lời",
  });
  await check.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Dữ liệu đã thay đổi" }),
  ).toBeVisible();
  await expect(first(page).getByRole("radio").first()).toBeChecked();
  await check.click();
  await expect(first(page).locator(".explanation")).toBeVisible();
  const saved = await request("/v1/attempts/" + start.attempt_id);
  expect(saved.items[0].checked).toBe(true);
  expect(saved.items[1].checked).toBe(true);
});
