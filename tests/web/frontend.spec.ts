import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
// Node-only setup. No admin secret or fixture password is imported by browser code.
// @ts-ignore local Node bootstrap helper
import {
  localStatus,
  apiRequest,
  readLocal,
} from "../../scripts/local-lib.mjs";
const uid = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let learner: { email: string; password: string };
let admin: { email: string; password: string };
test.beforeAll(async () => {
  const status = localStatus();
  admin = readLocal("bootstrap.json").admin;
  learner = {
    email: `web-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "aA1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...learner,
      email_confirm: true,
      user_metadata: { full_name: "Web Learner" },
    },
  });
});
async function login(page: Page, user = learner) {
  await page.goto("/#/login");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Chào .*cùng học nhé/ }),
  ).toBeVisible();
}
test("guest discovers a preview, audio and responsive navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Một khởi đầu nhỏ. Một thế giới mới." }),
  ).toBeVisible();
  await page.screenshot({ path: ".local/web-desktop.png", fullPage: true });
  await page.goto("/#/lesson/" + uid(10));
  await expect(
    page.getByRole("button", { name: "Làm bài luyện tập" }),
  ).toBeVisible();
  await expect(page.locator("audio").first()).toBeVisible();
  await page.getByRole("button", { name: "Làm bài luyện tập" }).click();
  await expect(
    page.getByRole("heading", { name: "Chào mừng trở lại" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByRole("link", { name: "Lộ trình học", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Một lộ trình, nhiều khám phá." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".local/web-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("learner logs in, completes quiz and sees persisted history", async ({
  page,
}) => {
  await login(page);
  await page.goto("/#/lesson/" + uid(10));
  await page.getByRole("button", { name: "Lưu bài", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Đã lưu vào bài yêu thích." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Làm bài luyện tập" }).click();
  await expect(page.locator(".question")).toHaveCount(5);
  const questions = page.locator(".question");
  for (let i = 0; i < 5; i++) {
    const q = questions.nth(i);
    if (i < 3) await q.getByRole("radio").first().check();
    else
      await q
        .getByLabel("Câu trả lời", { exact: true })
        .fill(i === 3 ? "good morning" : "hello");
    await q.getByRole("button", { name: "Kiểm tra câu trả lời" }).click();
    await expect(q.locator(".explanation")).toBeVisible();
  }
  await page.getByRole("button", { name: "Nộp bài", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bạn đã vượt qua bài làm!" }),
  ).toBeVisible();
  await expect(page.locator(".result strong")).toHaveText("100%");
  await page.reload();
  await expect(page.locator(".result strong")).toHaveText("100%");
  await page.goto("/#/history");
  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible();
  await page.goto("/#/favorites");
  await expect(page.getByRole("link", { name: "Mở bài" })).toBeVisible();
});
test("personal card can be created, flipped and rated once", async ({
  page,
}) => {
  await login(page);
  await page.goto("/#/cards");
  await page.getByRole("button", { name: "+ Tạo thẻ" }).click();
  await page.getByLabel("Từ / cụm từ", { exact: true }).fill("thoughtful");
  await page.getByLabel("Nghĩa", { exact: true }).fill("chu đáo");
  await page
    .getByLabel("Ví dụ", { exact: true })
    .fill("That was thoughtful of you.");
  await page.getByRole("button", { name: "Lưu thẻ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "thoughtful", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Bắt đầu ôn" }).click();
  await page.getByRole("button", { name: "Lật thẻ", exact: true }).click();
  await expect(page.locator(".review-card")).toContainText("chu đáo");
  await page.getByRole("button", { name: "Đã nhớ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Đã xong lượt ôn này!" }),
  ).toBeVisible();
  await page.goto("/#/cards");
  await expect(page.getByText("BẬC 1", { exact: true })).toBeVisible();
});
test("learner cannot open administration and logout ends the session", async ({
  page,
}) => {
  await login(page);
  await page.goto("/#/admin");
  await expect(page.getByRole("alert")).toContainText("không có quyền");
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Chào mừng trở lại" }),
  ).toBeVisible();
  await page.goto("/#/history");
  await expect(
    page.getByRole("heading", { name: "Tiếp tục hành trình của bạn" }),
  ).toBeVisible();
});
test("admin creates course via form and can open lesson editor, media and reports", async ({
  page,
}) => {
  await login(page, admin);
  await page.goto("/#/admin");
  await page.getByRole("button", { name: "+ Lộ trình", exact: true }).click();
  const title = "Web Course " + randomUUID().slice(0, 6);
  await page.getByLabel("Tên", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Soạn bài & đề", exact: true })
    .click();
  await page.getByLabel("Chọn bài học để biên soạn").selectOption(uid(10));
  await expect(
    page.getByRole("heading", { name: "Câu hỏi trong bài" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Từ vựng & audio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thư viện audio" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Báo cáo", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Hoạt động theo ngày" }),
  ).toBeVisible();
  await page.screenshot({ path: ".local/web-admin.png", fullPage: true });
});
test("invalid credentials and offline backend show recoverable errors", async ({
  page,
}) => {
  await page.goto("/#/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill("does-not-exist@pbl6.local.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("WrongPassword123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Email hoặc mật khẩu không hợp lệ",
  );
  await page.route("http://127.0.0.1:4002/**", (r) => r.abort());
  await page.goto("/#/catalog");
  await expect(page.getByRole("alert")).toContainText(
    "Không kết nối được máy chủ",
  );
  await page.unroute("http://127.0.0.1:4002/**");
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Chọn lộ trình" }).first(),
  ).toBeVisible();
});
test("email signup, verification callback and password recovery work in the browser", async ({
  page,
  request,
}) => {
  const email = `signup-${randomUUID()}@pbl6.local.test`;
  async function emailLink(subject: string) {
    let id = "";
    await expect
      .poll(async () => {
        const r = await request.get("http://127.0.0.1:55324/api/v1/messages");
        const data = await r.json();
        const mail = data.messages.find(
          (m: any) =>
            m.To.some((t: any) => t.Address === email) &&
            m.Subject.toLowerCase().includes(subject),
        );
        id = mail?.ID ?? "";
        return !!id;
      })
      .toBe(true);
    const r = await request.get("http://127.0.0.1:55324/api/v1/message/" + id);
    const mail = await r.json();
    const link = mail.HTML.match(
      /href="([^"]*\/auth\/v1\/verify[^\"]*)"/i,
    )?.[1];
    expect(link).toBeTruthy();
    return link.replaceAll("&amp;", "&");
  }
  await page.goto("/#/signup");
  await page.getByLabel("Tên hiển thị").fill("New Sprout Learner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Plant123");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kiểm tra hộp thư");
  await page.goto(await emailLink("confirm"));
  await expect(
    page.getByRole("heading", { name: /Chào .*cùng học nhé/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.goto("/#/forgot");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Gửi hướng dẫn", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Nếu địa chỉ đủ điều kiện",
  );
  await page.goto(await emailLink("reset"));
  await expect(
    page.getByRole("heading", { name: "Đặt mật khẩu mới" }),
  ).toBeVisible();
  await page.getByLabel("Mật khẩu", { exact: true }).fill("NewPlant123");
  await page.getByRole("button", { name: "Lưu mật khẩu", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Chào mừng trở lại" }),
  ).toBeVisible();
  await login(page, { email, password: "NewPlant123" });
});
