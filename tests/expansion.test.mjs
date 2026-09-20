import { test, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  localStatus,
  readLocal,
  apiRequest,
  database,
} from "../scripts/local-lib.mjs";
import {
  gradeDictation,
  tokens,
} from "../dist/packages/backend/src/dictation.js";
const status = localStatus(),
  fixtures = readLocal("bootstrap.json"),
  uid = (n) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  did = "20000000-0000-4000-8000-000000000002";
const bases = { identity: 4001, content: 4002, learning: 4003 };
let admin, editor, learner, other, exercise;
async function login(account) {
  const r = await fetch(status.API_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: status.ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  assert.equal(r.status, 200);
  return (await r.json()).access_token;
}
async function request(
  service,
  path,
  { token, method = "GET", body, key, expected = 200 } = {},
) {
  const r = await fetch(`http://127.0.0.1:${bases[service]}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  assert.equal(
    r.status,
    expected,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  return data;
}
async function fresh() {
  const u = {
    email: `expansion-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "aA1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...u,
      email_confirm: true,
      user_metadata: { full_name: "Expansion learner" },
    },
  });
  const token = await login(u);
  await request("identity", "/v1/me", { token });
  return token;
}
before(async () => {
  admin = await login(fixtures.admin);
  editor = await login(fixtures.editor);
  learner = await fresh();
  other = await fresh();
  const rows = await request(
    "content",
    `/v1/admin/dictations?lesson_id=${uid(10)}`,
    { token: admin },
  );
  const source = rows.items.find((r) => r.id === did);
  exercise = await request("content", "/v1/admin/dictations", {
    token: admin,
    method: "POST",
    expected: 201,
    body: {
      lesson_id: uid(10),
      title: "Expansion Dictation " + randomUUID().slice(0, 6),
      instructions: "Listen and write.",
      audio_asset_id: source.audio_asset_id,
      transcript: "Hello, I study English every day.",
    },
  });
  await request("content", `/v1/admin/dictations/${exercise.id}/publish`, {
    token: admin,
    method: "POST",
    body: { revisionId: exercise.revision_id, expectedVersion: 1 },
  });
});
test("dictation tokenization and deterministic word alignment cover punctuation and errors", () => {
  assert.deepEqual(tokens(" DON’T, ‘stop’.  Hello! "), [
    "don't",
    "stop",
    "hello",
  ]);
  assert.equal(gradeDictation("Hello world.", " HELLO, world! ").score, 100);
  assert.equal(gradeDictation("one two three", "one three").missing, 1);
  assert.equal(gradeDictation("one two", "one two three").extra, 1);
  assert.equal(gradeDictation("one two", "one four").substitutions, 1);
  assert.equal(gradeDictation("a", "b c d").score, 0);
  assert.equal(gradeDictation("don't", "do not").score, 0);
  assert.equal(gradeDictation("two", "2").score, 0);
  assert.deepEqual(
    gradeDictation("a a", "a").alignment.map((x) => x.type),
    ["missing", "correct"],
  );
  assert.equal(gradeDictation("a b c", "a b").score, 66.7);
});
test("search normalizes accents, escapes wildcards, filters and never includes keys", async () => {
  const title = "Đường tới tiếng Anh " + randomUUID().slice(0, 6),
    sql = database(status.DB_URL);
  const [course] =
    await sql`SELECT id,title,status FROM content.courses WHERE id=${uid(1)}`;
  try {
    await sql`UPDATE content.courses SET title=${title} WHERE id=${course.id}`;
    const r = await request(
      "content",
      "/v1/search?q=" +
        encodeURIComponent(
          title.replace("Đường tới tiếng Anh", "DUONG TOI TIENG ANH"),
        ),
    );
    assert.equal(r.items[0].id, course.id);
    assert.equal(r.total, 1);
    const invalid = await request("content", "/v1/search?q=%25%25");
    assert.equal(invalid.total, 0);
    const lesson = await request("content", "/v1/search?q=Hello&type=lesson");
    assert.ok(lesson.items.some((i) => i.lesson_id === uid(10)));
    assert.ok(
      lesson.items.every((i) => !("transcript" in i) && !("answer_key" in i)),
    );
    await sql`UPDATE content.courses SET status='hidden' WHERE id=${course.id}`;
    assert.equal(
      (await request("content", "/v1/search?q=" + encodeURIComponent(title)))
        .total,
      0,
    );
    await request("content", "/v1/search?q=x", { expected: 400 });
  } finally {
    await sql`UPDATE content.courses SET title=${course.title},status=${course.status} WHERE id=${course.id}`;
    await sql.end();
  }
});
test("guest vocabulary search respects preview and current published snapshot", async () => {
  const sql = database(status.DB_URL);
  const [before] =
    await sql`SELECT is_preview FROM content.lessons WHERE id=${uid(10)}`;
  try {
    await sql`UPDATE content.lessons SET is_preview=false WHERE id=${uid(10)}`;
    const anon = await request("content", "/v1/search?q=hello&type=vocabulary");
    assert.ok(anon.items.every((i) => i.lesson_id !== uid(10)));
    const signed = await request(
      "content",
      "/v1/search?q=hello&type=vocabulary",
      { token: learner },
    );
    assert.ok(signed.items.some((i) => i.lesson_id === uid(10)));
  } finally {
    await sql`UPDATE content.lessons SET is_preview=${before.is_preview} WHERE id=${uid(10)}`;
    await sql.end();
  }
});
test("notes isolate owners, detect stale versions and survive a hidden lesson", async () => {
  const path = `/v1/lessons/${uid(10)}/note`;
  assert.equal(
    (await request("learning", path, { token: learner })).note,
    null,
  );
  let note = await request("learning", path, {
    token: learner,
    method: "PUT",
    body: { content: "<script>personal note</script>", expectedVersion: 0 },
  });
  assert.equal((await request("learning", path, { token: other })).note, null);
  await request("learning", path, {
    token: learner,
    method: "PUT",
    body: { content: "stale", expectedVersion: 0 },
    expected: 409,
  });
  const sql = database(status.DB_URL);
  try {
    await sql`UPDATE content.lessons SET status='hidden' WHERE id=${uid(10)}`;
    assert.equal(
      (await request("learning", path, { token: learner })).available,
      false,
    );
    note = await request("learning", path, {
      token: learner,
      method: "PUT",
      body: {
        content: "preserved while hidden",
        expectedVersion: Number(note.row_version),
      },
    });
    await request("learning", path, {
      token: other,
      method: "PUT",
      body: { content: "new hidden note", expectedVersion: 0 },
      expected: 404,
    });
  } finally {
    await sql`UPDATE content.lessons SET status='published' WHERE id=${uid(10)}`;
    await sql.end();
  }
  const oldVersion = Number(note.row_version);
  await request("learning", path, {
    token: learner,
    method: "DELETE",
    body: { expectedVersion: oldVersion },
  });
  note = await request("learning", path, {
    token: learner,
    method: "PUT",
    body: { content: "recreated", expectedVersion: 0 },
  });
  assert.notEqual(Number(note.row_version), oldVersion);
  await request("learning", path, {
    token: learner,
    method: "PUT",
    body: { content: "old tab", expectedVersion: oldVersion },
    expected: 409,
  });
});
test("dictation DTO remains private, concurrent starts reuse one attempt, save/submit replay is atomic", async () => {
  await request("content", "/v1/dictations", { expected: 401 });
  const publicDetail = await request(
    "content",
    "/v1/dictations/" + exercise.id,
    { token: learner },
  );
  assert.ok(!("transcript" in publicDetail));
  const starts = await Promise.all(
    [1, 2].map(() =>
      request("learning", "/v1/dictation-attempts", {
        token: learner,
        method: "POST",
        key: randomUUID(),
        expected: 201,
        body: { dictation_id: exercise.id },
      }),
    ),
  );
  assert.equal(starts[0].attempt_id, starts[1].attempt_id);
  const path = "/v1/dictation-attempts/" + starts[0].attempt_id;
  let attempt = await request("learning", path, { token: learner });
  assert.ok(!("transcript" in attempt) && !("result" in attempt));
  await request("learning", path, { token: other, expected: 404 });
  const saved = await request("learning", path + "/answer", {
    token: learner,
    method: "PUT",
    body: { answer: "Hello I study", expectedVersion: attempt.row_version },
  });
  assert.ok(!("transcript" in saved));
  await request("learning", path + "/answer", {
    token: learner,
    method: "PUT",
    body: { answer: "old", expectedVersion: attempt.row_version },
    expected: 409,
  });
  await request("learning", path + "/submit", {
    token: learner,
    method: "POST",
    key: randomUUID(),
    body: { answer: " ", expectedVersion: saved.row_version },
    expected: 400,
  });
  const payload = {
      answer: "hello I study English every day",
      expectedVersion: saved.row_version,
    },
    key = randomUUID();
  const results = await Promise.all(
    [1, 2].map(() =>
      request("learning", path + "/submit", {
        token: learner,
        method: "POST",
        body: payload,
        key,
      }),
    ),
  );
  assert.equal(results[0].result.score, 100);
  assert.deepEqual(results[0], results[1]);
  await request("learning", path + "/submit", {
    token: learner,
    method: "POST",
    body: { ...payload, answer: "different" },
    key,
    expected: 409,
  });
  const revisions = await request(
      "content",
      `/v1/admin/dictations?lesson_id=${uid(10)}`,
      { token: admin },
    ),
    r = revisions.items.find((r) => r.id === exercise.id);
  await request("content", `/v1/admin/dictation-revisions/${r.revision_id}`, {
    token: admin,
    method: "PATCH",
    body: {
      title: r.title,
      instructions: r.instructions,
      audio_asset_id: r.audio_asset_id,
      transcript: "changed",
      expectedVersion: Number(r.revision_version),
    },
    expected: 409,
  });
  const rev = await request(
    "content",
    `/v1/admin/dictations/${exercise.id}/revisions`,
    {
      token: admin,
      method: "POST",
      expected: 201,
      body: {
        title: r.title,
        instructions: r.instructions,
        audio_asset_id: r.audio_asset_id,
        transcript: "A new transcript for the next version.",
      },
    },
  );
  await request("content", `/v1/admin/dictations/${exercise.id}/publish`, {
    token: admin,
    method: "POST",
    body: { revisionId: rev.id, expectedVersion: Number(r.row_version) },
  });
  assert.equal(
    (await request("learning", path, { token: learner })).transcript,
    "Hello, I study English every day.",
  );
});
test("hidden dictation cancels in-progress work but retains submitted results; Editor cannot publish", async () => {
  const r = (
    await request("content", `/v1/admin/dictations?lesson_id=${uid(10)}`, {
      token: admin,
    })
  ).items.find((r) => r.id === exercise.id);
  await request("content", `/v1/admin/dictations/${exercise.id}/status`, {
    token: editor,
    method: "PATCH",
    body: { status: "hidden", expectedVersion: Number(r.row_version) },
    expected: 403,
  });
  const started = await request("learning", "/v1/dictation-attempts", {
    token: learner,
    method: "POST",
    key: randomUUID(),
    body: { dictation_id: exercise.id },
    expected: 201,
  });
  await request("content", `/v1/admin/dictations/${exercise.id}/status`, {
    token: admin,
    method: "PATCH",
    body: { status: "hidden", expectedVersion: Number(r.row_version) },
  });
  await request("learning", "/v1/dictation-attempts/" + started.attempt_id, {
    token: learner,
    expected: 409,
  });
  const cancelled = await request(
    "learning",
    "/v1/dictation-attempts/" + started.attempt_id,
    { token: learner },
  );
  assert.equal(cancelled.status, "cancelled");
  assert.ok(!("transcript" in cancelled));
});
test("new tables have RLS, cross-service denial, immutable snapshot/results and wrong-parent rejection", async () => {
  const adminDb = database(status.DB_URL),
    runtime = readLocal("runtime.json"),
    contentDb = database(runtime.content.databaseUrl),
    learningDb = database(runtime.learning.databaseUrl);
  try {
    const tables =
      await adminDb`SELECT count(*)::int AS n FROM pg_tables WHERE schemaname IN ('content','learning') AND tablename IN ('dictations','dictation_revisions','lesson_notes','dictation_attempts','dictation_attempt_keys') AND rowsecurity`;
    assert.equal(tables[0].n, 5);
    await assert.rejects(
      contentDb`SELECT * FROM learning.lesson_notes`,
      (e) => e.code === "42501",
    );
    await assert.rejects(
      learningDb`SELECT * FROM content.dictation_revisions`,
      (e) => e.code === "42501",
    );
    await assert.rejects(
      learningDb`UPDATE learning.dictation_attempt_keys SET transcript_snapshot='bad'`,
      (e) => e.code === "42501",
    );
    const [a] =
      await adminDb`SELECT id FROM learning.dictation_attempts WHERE status='submitted' AND dictation_id=${exercise.id} LIMIT 1`;
    await assert.rejects(
      learningDb`UPDATE learning.dictation_attempts SET answer='changed' WHERE id=${a.id}`,
      (e) => e.code === "23514",
    );
    await assert.rejects(
      contentDb`UPDATE content.dictations SET published_revision_id='20000000-0000-4000-8000-000000000003' WHERE id=${exercise.id}`,
      (e) => e.code === "23514",
    );
  } finally {
    await Promise.all([adminDb.end(), contentDb.end(), learningDb.end()]);
  }
});

test("published vocabulary pagination is stable and note revision changes are detected", async () => {
  const sql = database(status.DB_URL),
    marker = "pagination" + randomUUID().replaceAll("-", "");
  const [old] =
    await sql`SELECT published_revision_id FROM content.lessons WHERE id=${uid(10)}`;
  const path = `/v1/lessons/${uid(10)}/note`;
  await request("learning", path, {
    token: other,
    method: "PUT",
    body: { content: "Keep across revisions", expectedVersion: 0 },
  });
  try {
    await sql.begin(async (tx) => {
      const [revision] =
        await tx`INSERT INTO content.lesson_revisions(lesson_id,revision_no,title,objectives,blocks,created_by) SELECT lesson_id,(SELECT max(revision_no)+1 FROM content.lesson_revisions WHERE lesson_id=${uid(10)}),title,objectives,'[{"id":"test","type":"text","body":"Pagination fixture"}]'::jsonb,created_by FROM content.lesson_revisions WHERE id=${old.published_revision_id} RETURNING id`;
      for (let n = 0; n < 25; n++) {
        const word =
          n === 0
            ? marker
            : n === 1
              ? marker + " start"
              : "contains " + marker + " " + String(n).padStart(2, "0");
        const [v] =
          await tx`INSERT INTO content.vocabulary_entries(word,meaning) VALUES(${word},'Nghĩa thử nghiệm') RETURNING id`;
        await tx`INSERT INTO content.lesson_revision_vocabulary(lesson_revision_id,vocabulary_id,position,snapshot) VALUES(${revision.id},${v.id},${n + 1},${tx.json({ word, meaning: "Nghĩa thử nghiệm" })})`;
      }
      await tx`UPDATE content.lesson_revisions SET published_at=clock_timestamp() WHERE id=${revision.id}`;
      await tx`UPDATE content.lessons SET published_revision_id=${revision.id} WHERE id=${uid(10)}`;
    });
    const query =
      "/v1/search?type=vocabulary&course_id=" + uid(1) + "&q=" + marker;
    const first = await request("content", query, { token: learner }),
      second = await request("content", query + "&page=2", { token: learner });
    assert.equal(first.total, 25);
    assert.equal(first.items.length, 20);
    assert.equal(second.items.length, 5);
    assert.equal(first.items[0].title, marker);
    assert.equal(first.items[1].title, marker + " start");
    assert.equal(
      new Set([...first.items, ...second.items].map((x) => x.id)).size,
      25,
    );
    assert.deepEqual(
      (await request("content", query, { token: learner })).items,
      first.items,
    );
    assert.equal(
      (await request("learning", path, { token: other })).revision_changed,
      true,
    );
  } finally {
    await sql`UPDATE content.lessons SET published_revision_id=${old.published_revision_id} WHERE id=${uid(10)}`;
    await sql.end();
  }
  assert.equal(
    (await request("content", "/v1/search?q=" + marker, { token: learner }))
      .total,
    0,
  );
});

test("transcript bounds match publication validation for both curly apostrophes", async () => {
  const body = {
    lesson_id: uid(10),
    title: "Transcript boundary",
    instructions: "",
    audio_asset_id: "20000000-0000-4000-8000-000000000001",
  };
  for (const transcript of ["!!!", Array(201).fill("word").join(" ")])
    await request("content", "/v1/admin/dictations", {
      token: admin,
      method: "POST",
      body: { ...body, transcript },
      expected: 400,
    });
  const d = await request("content", "/v1/admin/dictations", {
    token: admin,
    method: "POST",
    body: { ...body, transcript: Array(200).fill("don‘t").join(" ") },
    expected: 201,
  });
  await request("content", `/v1/admin/dictations/${d.id}/publish`, {
    token: admin,
    method: "POST",
    body: { revisionId: d.revision_id, expectedVersion: 1 },
  });
  const row = (
    await request("content", `/v1/admin/dictations?lesson_id=${uid(10)}`, {
      token: admin,
    })
  ).items.find((x) => x.id === d.id);
  await request("content", `/v1/admin/dictations/${d.id}/status`, {
    token: admin,
    method: "PATCH",
    body: { status: "hidden", expectedVersion: Number(row.row_version) },
  });
});
