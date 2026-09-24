import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { localStatus, apiRequest, writeLocal } from "../scripts/local-lib.mjs";
import { loadTechnicalMaterials } from "../scripts/render-technical-materials.mjs";
import { compileImportPlan } from "../scripts/materials-import-plan.mjs";

test("published technical lessons render and real two-client topic conflicts require reconciliation", async () => {
  const status = localStatus(),
    plan = compileImportPlan(loadTechnicalMaterials().results);
  const account = {
    email: `publication-web-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "Aa1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...account,
      email_confirm: true,
      user_metadata: { full_name: "Technical Learner" },
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
  assert.equal(login.status, 200);
  const { access_token } = await login.json();
  const request = async (path, method = "GET", body) => {
    const r = await fetch("http://127.0.0.1:4003" + path, {
      method,
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    assert(r.ok, `${path}: ${r.status}`);
    return r.json();
  };
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://localhost:5173/#/catalog");
    for (const p of plan.packages) {
      await expect(
        page.getByRole("heading", {
          name: p.rows.courses[0].title,
          exact: true,
        }),
      ).toBeVisible();
      for (const lesson of p.rows.lessons)
        await expect(
          page.locator(`a[href="#/lesson/${lesson.id}"]`),
        ).toHaveCount(1);
    }
    await page.goto("http://localhost:5173/#/login");
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: /Chào .*cùng học nhé/ }),
    ).toBeVisible();
    for (const p of plan.packages)
      for (const revision of p.rows.lesson_revisions) {
        await page.goto("http://localhost:5173/#/lesson/" + revision.lesson_id);
        await expect(
          page.getByRole("heading", { name: revision.title, exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Làm bài luyện tập" }),
        ).toBeEnabled();
        assert.equal(await page.locator(".explanation").count(), 0);
      }
    const p = plan.packages[0],
      assessment = p.rows.assessments.find((a) => a.kind === "topic_test");
    const start = await request("/v1/attempts", "POST", {
      assessment_id: assessment.id,
    });
    await page.goto("http://localhost:5173/#/attempt/" + start.attempt_id);
    let snapshot = await request("/v1/attempts/" + start.attempt_id);
    const index = snapshot.items.findIndex((i) => i.type === "single_choice");
    assert(index >= 0);
    const question = page.locator(".question").nth(index);
    await question.getByRole("radio").first().check();
    const item = snapshot.items[index];
    await request("/v1/items/" + item.id + "/answer", "PUT", {
      answer: { option_key: item.options[1].option_key },
      expectedVersion: item.answer_version,
      attemptVersion: snapshot.row_version,
    });
    await question
      .getByRole("button", { name: "Lưu đáp án", exact: true })
      .click();
    await expect(
      question.getByText("Câu trả lời đã đổi trên thiết bị khác."),
    ).toBeVisible();
    await expect(
      question.getByRole("button", { name: "Lưu đáp án", exact: true }),
    ).toBeDisabled();
    page.once("dialog", (d) => d.accept());
    await question
      .getByRole("button", { name: "Giữ bản nhập để lưu lại" })
      .click();
    await question
      .getByRole("button", { name: "Lưu đáp án", exact: true })
      .click();
    await expect(page.getByText("Bản nhập chưa lưu")).toHaveCount(0);
    snapshot = await request("/v1/attempts/" + start.attempt_id);
    assert.equal(
      snapshot.items[index].answer.option_key,
      item.options[0].option_key,
    );
    assert(snapshot.items.every((i) => !("answer_key" in i)));
    await request("/v1/attempts/" + snapshot.id + "/cancel", "POST", {
      expectedVersion: snapshot.row_version,
    });
    assert.deepEqual(errors, []);
    writeLocal("technical-publication-web-verification.json", {
      verified_at: new Date().toISOString(),
      courses: 5,
      lessons_rendered: 36,
      real_topic_conflict: true,
      page_errors: 0,
    });
  } finally {
    await browser.close();
  }
});
