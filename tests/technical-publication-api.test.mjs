import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localStatus, apiRequest, writeLocal } from "../scripts/local-lib.mjs";
import { loadTechnicalMaterials } from "../scripts/render-technical-materials.mjs";
import { compileImportPlan } from "../scripts/materials-import-plan.mjs";

test("all 36 technical lessons and 52 assessments work through learner APIs after publication", async () => {
  const status = localStatus(),
    plan = compileImportPlan(loadTechnicalMaterials().results);
  const account = {
    email: `publication-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "Aa1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...account,
      email_confirm: true,
      user_metadata: { full_name: "Publication verifier" },
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
  const session = await login.json();
  async function request(
    port,
    path,
    { method = "GET", body, guest = false, expected = 200 } = {},
  ) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        ...(!guest ? { Authorization: `Bearer ${session.access_token}` } : {}),
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    assert.equal(
      response.status,
      expected,
      `${method} ${path}: ${data.error?.code ?? ""}`,
    );
    return data;
  }
  const catalog = await request(4002, "/v1/catalog", { guest: true });
  const verified = {
    courses: 0,
    topics: 0,
    lessons: 0,
    quizzes: 0,
    topic_tests: 0,
    questions: 0,
  };
  for (const p of plan.packages) {
    const course = catalog.courses.find((c) => c.id === p.course_id);
    assert(course);
    verified.courses++;
    assert.equal(course.topics.length, p.rows.topics.length);
    verified.topics += course.topics.length;
    assert.deepEqual(
      course.topics.flatMap((t) => t.lessons.map((l) => l.id)).sort(),
      p.rows.lessons.map((l) => l.id).sort(),
    );
    await request(4003, "/v1/enrollment", {
      method: "PUT",
      body: { course_id: p.course_id },
    });
    for (const lesson of p.rows.lessons) {
      await request(4002, `/v1/lessons/${lesson.id}`, {
        guest: true,
        expected: 401,
      });
      const detail = await request(4002, `/v1/lessons/${lesson.id}`);
      assert.equal(detail.id, lesson.id);
      assert(detail.blocks.length > 0);
      assert.equal(detail.is_preview, false);
      assert(!JSON.stringify(detail).includes("correct_option_key"));
      await request(4003, `/v1/lessons/${lesson.id}/open`, { method: "POST" });
      verified.lessons++;
    }
    for (const assessment of p.rows.assessments) {
      const start = await request(4003, "/v1/attempts", {
        method: "POST",
        body: { assessment_id: assessment.id },
        expected: 201,
      });
      const attempt = await request(4003, `/v1/attempts/${start.attempt_id}`);
      const revision = p.rows.assessment_revisions.find(
        (r) => r.assessment_id === assessment.id,
      );
      assert.equal(
        attempt.items.length,
        p.rows.assessment_revision_questions.filter(
          (q) => q.assessment_revision_id === revision.id,
        ).length,
      );
      assert(
        attempt.items.every(
          (i) =>
            !("answer_key" in i) &&
            !("explanation" in i) &&
            !("transcript" in i),
        ),
      );
      verified[assessment.kind === "quiz" ? "quizzes" : "topic_tests"]++;
      verified.questions += attempt.items.length;
      await request(4003, `/v1/attempts/${attempt.id}/cancel`, {
        method: "POST",
        body: { expectedVersion: attempt.row_version },
      });
    }
  }
  assert.deepEqual(verified, {
    courses: 5,
    topics: 16,
    lessons: 36,
    quizzes: 36,
    topic_tests: 16,
    questions: 340,
  });
  writeLocal("technical-publication-api-verification.json", {
    verified_at: new Date().toISOString(),
    verified,
    learner_id: session.user.id,
  });
});
