import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localStatus, apiRequest } from "../scripts/local-lib.mjs";
import {
  createApiClient,
  ApiError,
} from "../dist/packages/api-client/src/index.js";
const status = localStatus();
const bases = {
  identity: "http://127.0.0.1:4001",
  content: "http://127.0.0.1:4002",
  learning: "http://127.0.0.1:4003",
};
const storage = () => {
  const values = new Map();
  return {
    getItem: async (k) => values.get(k) ?? null,
    setItem: async (k, v) => {
      values.set(k, v);
    },
    removeItem: async (k) => {
      values.delete(k);
    },
  };
};
test("mobile public client integrates with Auth, learning, notes, audio and replay on real local APIs", async () => {
  const account = {
    email: `mobile-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "aA1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...account,
      email_confirm: true,
      user_metadata: { full_name: "Mobile integration" },
    },
  });
  const response = await fetch(
    status.API_URL + "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      headers: { apikey: status.ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(account),
    },
  );
  assert.equal(response.status, 200);
  const auth = await response.json();
  const session = async () => ({
    userId: auth.user.id,
    token: auth.access_token,
  });
  const durable = storage();
  const mobile = createApiClient({
    bases,
    storage: durable,
    session,
    uuid: randomUUID,
  });
  const web = createApiClient({
    bases,
    storage: storage(),
    session,
    uuid: randomUUID,
  });
  const profile = await mobile.request("identity", "/v1/me");
  assert.equal(profile.display_name, "Mobile integration");
  const catalog = await mobile.request("content", "/v1/catalog"),
    course = catalog.courses.find((c) =>
      c.topics.some((t) => t.lessons.length),
    );
  assert.ok(course, "Published demo content is required");
  const lessonId = course.topics.flatMap((t) => t.lessons)[0].id;
  await mobile.request("learning", "/v1/enrollment", "PUT", {
    course_id: course.id,
  });
  const lesson = await mobile.request("content", "/v1/lessons/" + lessonId);
  assert.equal(typeof lesson.objectives, "string");
  await mobile.request("learning", `/v1/lessons/${lessonId}/open`, "POST");
  const n = await mobile.request(
    "learning",
    `/v1/lessons/${lessonId}/note`,
    "PUT",
    { content: "Written on mobile", expectedVersion: 0 },
  );
  const remote = await web.request("learning", `/v1/lessons/${lessonId}/note`);
  assert.equal(remote.note.content, "Written on mobile");
  await web.request("learning", `/v1/lessons/${lessonId}/note`, "PUT", {
    content: "Changed on web",
    expectedVersion: Number(n.row_version),
  });
  await assert.rejects(
    mobile.request("learning", `/v1/lessons/${lessonId}/note`, "PUT", {
      content: "Stale mobile",
      expectedVersion: Number(n.row_version),
    }),
    (e) => e instanceof ApiError && e.code === "VERSION_CONFLICT",
  );
  let lost = true;
  const uncertain = createApiClient({
    bases,
    storage: durable,
    session,
    uuid: randomUUID,
    fetch: async (...args) => {
      const result = await fetch(...args);
      if (lost && result.ok) {
        lost = false;
        throw new Error("Lost response after commit");
      }
      return result;
    },
  });
  const cardBody = {
    word: "resilient",
    meaning: "bền bỉ",
    example: "Keep learning.",
  };
  await assert.rejects(
    uncertain.mutate("learning", "/v1/flashcards", cardBody),
  );
  const restarted = createApiClient({
    bases,
    storage: durable,
    session,
    uuid: randomUUID,
  });
  await restarted.mutate("learning", "/v1/flashcards", cardBody);
  const cards = await web.request("learning", "/v1/flashcards");
  assert.equal(cards.items.filter((c) => c.word === cardBody.word).length, 1);
  if (lesson.assessment_id) {
    const result = await mobile.mutate("learning", "/v1/attempts", {
      assessment_id: lesson.assessment_id,
    });
    const attempt = await web.request(
      "learning",
      "/v1/attempts/" + result.attempt_id,
    );
    assert.equal(attempt.status, "in_progress");
    assert.ok(attempt.items.every((i) => !("answer_key" in i)));
    const again = await web.mutate("learning", "/v1/attempts", {
      assessment_id: lesson.assessment_id,
    });
    assert.equal(again.attempt_id, result.attempt_id);
  }
  const dictations = await mobile.request("content", "/v1/dictations");
  assert.ok(dictations.items.length, "Dictation demo required");
  const started = await mobile.mutate("learning", "/v1/dictation-attempts", {
    dictation_id: dictations.items[0].id,
  });
  let dictation = await mobile.request(
    "learning",
    "/v1/dictation-attempts/" + started.attempt_id,
  );
  assert.ok(!("transcript" in dictation));
  assert.ok(dictation.audio_url);
  const audio = await fetch(dictation.audio_url);
  assert.equal(audio.status, 200);
  assert.ok((await audio.arrayBuffer()).byteLength > 1000);
  await mobile.request(
    "learning",
    `/v1/dictation-attempts/${started.attempt_id}/answer`,
    "PUT",
    { answer: "A test transcription", expectedVersion: dictation.row_version },
  );
  dictation = await web.request(
    "learning",
    "/v1/dictation-attempts/" + started.attempt_id,
  );
  assert.equal(dictation.answer, "A test transcription");
  const submitted = await mobile.mutate(
    "learning",
    `/v1/dictation-attempts/${started.attempt_id}/submit`,
    { answer: dictation.answer, expectedVersion: dictation.row_version },
  );
  assert.equal(submitted.status, "submitted");
  assert.equal(typeof submitted.transcript, "string");
  const progress = await mobile.request("learning", "/v1/progress");
  assert.equal(progress.course.id, course.id);
  await mobile.request("identity", "/v1/logout", "POST");
  await assert.rejects(
    mobile.request("learning", "/v1/progress"),
    (e) => e instanceof ApiError && e.status === 401,
  );
});
