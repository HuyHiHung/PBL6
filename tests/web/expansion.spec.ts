import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
// @ts-ignore Node-only setup; never part of the browser bundle.
import {
  localStatus,
  apiRequest,
  readLocal,
} from "../../scripts/local-lib.mjs";
let user: { email: string; password: string };
let admin: { email: string; password: string };
const lesson = "10000000-0000-4000-8000-000000000010";
test.beforeAll(async () => {
  const status = localStatus();
  admin = readLocal("bootstrap.json").admin;
  user = {
    email: `expansion-web-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "Aa1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...user,
      email_confirm: true,
      user_metadata: { full_name: "Expansion Web Learner" },
    },
  });
});
async function login(page: Page, account = user) {
  await page.goto("/#/login");
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Chào .*cùng học nhé/ }),
  ).toBeVisible();
}
test("search works for guests, deep links to lessons and remains usable on mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("Tìm kiếm học liệu", { exact: true }).fill("Hello");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await page.getByRole("button", { name: "Bài học", exact: true }).click();
  const match = page
    .locator("a.card")
    .filter({ hasText: "Hello and introductions" })
    .first();
  await expect(match).toBeVisible();
  await page.reload();
  await expect(match).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".local/expansion-search-mobile.png",
    fullPage: true,
  });
  await match.click();
  await expect(
    page.getByRole("heading", { name: "Hello and introductions", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("notes save plain text, warn before navigation and persist in the personal list", async ({
  page,
}) => {
  await login(page);
  await page.goto("/#/lesson/" + lesson);
  await page
    .getByLabel("Nội dung ghi chú", { exact: true })
    .fill("<script>My private reminder</script>");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("link", { name: "Thẻ từ vựng", exact: true }).click();
  await expect(
    page.getByLabel("Nội dung ghi chú", { exact: true }),
  ).toHaveValue("<script>My private reminder</script>");
  await page.getByRole("button", { name: "Lưu ghi chú", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã lưu ghi chú." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ghi chú", exact: true }).click();
  await expect(
    page.getByText("<script>My private reminder</script>", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xem / sửa ghi chú", exact: true })
    .click();
  await page
    .getByLabel("Nội dung ghi chú", { exact: true })
    .fill("Updated reminder");
  await page.getByRole("button", { name: "Lưu ghi chú", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("Updated reminder", { exact: true }),
  ).toBeVisible();
});
test("Dictation saves a draft, resumes, conceals transcript and shows a stable word diff after submission", async ({
  page,
}) => {
  await login(page);
  await page.goto("/#/dictation");
  const row = page
    .locator(".list-row")
    .filter({ hasText: "Introductions — Nghe và chép lại" })
    .first();
  await row.getByRole("button", { name: "Luyện nghe" }).click();
  await expect(
    page.getByLabel("Bản chép của bạn", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Transcript chuẩn" }),
  ).toHaveCount(0);
  await page.getByLabel("Tốc độ nghe", { exact: true }).selectOption("0.75");
  expect(
    await page
      .locator("audio")
      .evaluate((a: HTMLAudioElement) => a.playbackRate),
  ).toBe(0.75);
  await page
    .getByLabel("Bản chép của bạn", { exact: true })
    .fill("Good morning. My name is Anna.");
  await page.getByRole("button", { name: "Lưu bản chép", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu bản chép.");
  await page.reload();
  await expect(
    page.getByLabel("Bản chép của bạn", { exact: true }),
  ).toHaveValue("Good morning. My name is Anna.");
  await page
    .getByLabel("Bản chép của bạn", { exact: true })
    .fill(
      "Good morning. My name is Anna. I am a student. I study English every day. My classroom is next to the library.",
    );
  await page
    .getByRole("button", { name: "Nộp bài Dictation", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /100\.0%/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Transcript chuẩn", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".diff-correct")).toHaveCount(22);
  await page.screenshot({
    path: ".local/expansion-dictation.png",
    fullPage: true,
  });
});
test("Dictation preserves input on network failure and reports unavailable audio", async ({
  page,
}) => {
  await login(page);
  await page.route("**/storage/v1/object/**", (route) => route.abort());
  await page.goto("/#/dictation");
  await page
    .locator(".list-row")
    .filter({ hasText: "Introductions — Nghe và chép lại" })
    .first()
    .getByRole("button", { name: "Luyện nghe" })
    .click();
  await expect(page.getByText(/Không tải được audio/)).toBeVisible();
  const input = page.getByLabel("Bản chép của bạn", { exact: true });
  await input.fill("Keep my draft when the network fails.");
  await page.route("**/v1/dictation-attempts/*/answer", (route) =>
    route.abort(),
  );
  const save = page.getByRole("button", { name: "Lưu bản chép", exact: true });
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Không kết nối được máy chủ/)).toBeVisible();
  await expect(input).toHaveValue("Keep my draft when the network fails.");
  await page.unroute("**/v1/dictation-attempts/*/answer");
  await save.click();
  await expect(page.getByRole("status")).toContainText("Đã lưu bản chép.");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});

test("admin authors and publishes Dictation through form controls", async ({
  page,
}) => {
  await login(page, admin);
  await page.goto("/#/admin");
  await page
    .getByRole("button", { name: "Soạn bài & đề", exact: true })
    .click();
  await page.getByLabel("Chọn bài học để biên soạn").selectOption(lesson);
  await page
    .getByRole("button", { name: "+ Bài Dictation", exact: true })
    .click();
  const title = "Browser Dictation " + randomUUID().slice(0, 6);
  await page.getByLabel("Tên bài Dictation", { exact: true }).fill(title);
  await page
    .getByLabel("Audio Dictation", { exact: true })
    .selectOption("20000000-0000-4000-8000-000000000001");
  await page
    .getByLabel("Transcript chuẩn", { exact: true })
    .fill("Good morning.");
  await page
    .getByRole("button", { name: "Lưu Dictation", exact: true })
    .click();
  const row = page.locator(".list-row").filter({ hasText: title });
  await expect(row).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await row
    .getByRole("button", { name: "Xuất bản Dictation", exact: true })
    .click();
  await expect(
    row.getByRole("button", { name: "Ẩn Dictation", exact: true }),
  ).toBeVisible();
  await row.getByRole("button", { name: "Ẩn Dictation", exact: true }).click();
  await expect(
    row.getByRole("button", { name: "Hiện Dictation", exact: true }),
  ).toBeVisible();
});
