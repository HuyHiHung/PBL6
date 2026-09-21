import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import {
  localStatus,
  database,
  apiRequest,
  readLocal,
} from "../scripts/local-lib.mjs";
import { createTypingLesson } from "../scripts/typing-fixture.mjs";
import {
  createGame,
  advanceToTick,
  applyInput,
  getResult,
} from "../dist/packages/typing-core/src/index.js";
const status = localStatus(),
  sql = database(status.DB_URL);
const ports = { identity: 4001, content: 4002, learning: 4003 };
let learner, other, fixture;
async function request(
  service,
  path,
  { user = learner, method = "GET", body, key, expected = 200 } = {},
) {
  const response = await fetch(`http://127.0.0.1:${ports[service]}${path}`, {
    method,
    headers: {
      ...(user ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  return data;
}
async function fresh() {
  const credentials = {
    email: `typing-${randomUUID()}@pbl6.local.test`,
    password: randomUUID() + "Aa1!",
  };
  await apiRequest(status, "/auth/v1/admin/users", {
    method: "POST",
    body: {
      ...credentials,
      email_confirm: true,
      user_metadata: { full_name: "Typing learner" },
    },
  });
  const response = await fetch(
    status.API_URL + "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      headers: { apikey: status.ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    },
  );
  assert.equal(response.status, 200);
  const data = await response.json();
  const user = { id: data.user.id, token: data.access_token };
  await request("identity", "/v1/me", { user });
  return user;
}
const start = (
  source = { kind: "personal_cards" },
  key = randomUUID(),
  extra = {},
) =>
  request("learning", "/v1/typing-sessions", {
    method: "POST",
    key,
    body: { source, difficulty: "hard", limit: 5 },
    expected: 201,
    ...extra,
  });
const abandon = (s) =>
  request("learning", `/v1/typing-sessions/${s.id}/abandon`, {
    method: "POST",
    body: {},
    key: randomUUID(),
  });
function winning(s) {
  const state = createGame(s.items, s.config),
    events = [];
  while (!state.outcome) {
    if (!state.active.length) {
      advanceToTick(state, state.tick + 1);
      continue;
    }
    const word = state.items[state.active[0].index].answer;
    for (const value of word) {
      const event = {
        seq: events.length + 1,
        tick: state.tick,
        type: "char",
        value,
      };
      applyInput(state, event);
      events.push(event);
    }
  }
  return {
    body: { manifest_hash: s.manifest_hash, events, final_tick: state.tick },
    result: getResult(state),
  };
}
async function waitForElapsed(s, tick) {
  const ms = Date.parse(s.created_at) + tick * 20 - Date.now() + 30;
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}
before(async () => {
  learner = await fresh();
  other = await fresh();
  fixture = await createTypingLesson(
    sql,
    readLocal("bootstrap.json").admin.id,
    randomUUID(),
    "Typing API fixture",
  );
  for (const word of [
    "apple",
    "apricot",
    "don't",
    "well-known",
    "operating system",
    "APPLE",
    "c++",
  ])
    await request("learning", "/v1/flashcards", {
      method: "POST",
      key: randomUUID(),
      body: { word, meaning: "Typing fixture", example: "" },
      expected: 201,
    });
});
after(async () => {
  if (fixture)
    await sql`UPDATE content.courses SET status='hidden' WHERE id=${fixture.course}`;
  await sql.end();
});
test("game endpoints require auth, internal token and ownership", async () => {
  await request("content", "/v1/typing-sources", { user: null, expected: 401 });
  await request("learning", "/v1/typing-sessions", {
    user: null,
    expected: 401,
  });
  await request("content", "/internal/typing-snapshot", {
    method: "POST",
    body: { lesson_id: fixture.lesson },
    expected: 403,
  });
  const s = await start();
  await request("learning", `/v1/typing-sessions/${s.id}`, {
    user: other,
    expected: 404,
  });
  await request("learning", `/v1/typing-sessions/${s.id}/abandon`, {
    user: other,
    method: "POST",
    body: {},
    key: randomUUID(),
    expected: 404,
  });
  await abandon(s);
});
test("sources filter duplicates/unsupported input; one active session and idempotent start", async () => {
  const source = await request("learning", "/v1/typing-sources/personal");
  assert.equal(source.count, 5);
  assert.equal(source.invalid, 1);
  assert.equal(source.duplicates, 1);
  const empty = await request("learning", "/v1/typing-sources/personal", {
    user: other,
  });
  assert.equal(empty.count, 0);
  await start(undefined, randomUUID(), { user: other, expected: 409 });
  const key = randomUUID(),
    s = await start(undefined, key);
  assert.deepEqual(await start(undefined, key), s);
  await start(undefined, key, {
    body: { source: { kind: "personal_cards" }, difficulty: "easy", limit: 5 },
    expected: 409,
  });
  await start(undefined, randomUUID(), { expected: 409 });
  assert.equal(s.items.length, 5);
  assert.equal(new Set(s.items.map((i) => i.answer)).size, 5);
  await abandon(s);
});
test("published lesson snapshot stays stable after hiding source, but new starts are blocked", async () => {
  const s = await start({ kind: "lesson", lesson_id: fixture.lesson });
  assert.equal(s.items.length, 5);
  await sql`UPDATE content.courses SET status='hidden' WHERE id=${fixture.course}`;
  try {
    assert.deepEqual(
      (await request("learning", `/v1/typing-sessions/${s.id}`)).items,
      s.items,
    );
    await abandon(s);
    await start({ kind: "lesson", lesson_id: fixture.lesson }, randomUUID(), {
      expected: 409,
    });
  } finally {
    await sql`UPDATE content.courses SET status='published' WHERE id=${fixture.course}`;
  }
});
test("server recomputes score, rejects forged logs, serializes duplicate finish and preserves SRS", async () => {
  const before =
    await sql`SELECT id,stage,due_at,last_reviewed_at FROM learning.flashcards WHERE user_id=${learner.id} ORDER BY id`;
  const s = await start(),
    win = winning(s),
    url = `/v1/typing-sessions/${s.id}/finish`;
  await request("learning", url, {
    method: "POST",
    key: randomUUID(),
    body: { ...win.body, score: 999999 },
    expected: 400,
  });
  await request("learning", url, {
    method: "POST",
    key: randomUUID(),
    body: { ...win.body, manifest_hash: "0".repeat(64) },
    expected: 422,
  });
  await request("learning", url, {
    method: "POST",
    key: randomUUID(),
    body: { manifest_hash: s.manifest_hash, events: [], final_tick: 0 },
    expected: 422,
  });
  await waitForElapsed(s, win.body.final_tick);
  await request("learning", url, {
    method: "POST",
    key: randomUUID(),
    body: {
      ...win.body,
      events: win.body.events.map((e, n) => (n ? e : { ...e, seq: 2 })),
    },
    expected: 422,
  });
  await request("learning", url, {
    method: "POST",
    key: randomUUID(),
    body: {
      ...win.body,
      events: [
        ...win.body.events,
        {
          seq: win.body.events.length + 1,
          tick: win.body.final_tick,
          type: "unlock",
        },
      ],
    },
    expected: 422,
  });
  await request("learning", url, {
    method: "POST",
    key: randomUUID(),
    body: { ...win.body, padding: "x".repeat(513 * 1024) },
    expected: 413,
  });
  await request("learning", url, {
    user: other,
    method: "POST",
    key: randomUUID(),
    body: win.body,
    expected: 404,
  });
  const key = randomUUID();
  const [a, b] = await Promise.all(
    [1, 2].map(() =>
      request("learning", url, { method: "POST", key, body: win.body }),
    ),
  );
  assert.deepEqual(a, b);
  assert.deepEqual(a.result, win.result);
  assert.equal(a.status, "completed");
  assert.deepEqual(
    (
      await request("learning", url, {
        method: "POST",
        key: randomUUID(),
        body: win.body,
      })
    ).result,
    win.result,
  );
  const changed = {
    ...win.body,
    events: [
      { seq: 1, tick: 0, type: "unlock" },
      ...win.body.events.map((e) => ({ ...e, seq: e.seq + 1 })),
    ],
  };
  await request("learning", url, {
    method: "POST",
    key: randomUUID(),
    body: changed,
    expected: 409,
  });
  const [row] =
    await sql`SELECT count(*)::int AS n FROM learning.typing_game_sessions WHERE id=${s.id} AND status='completed'`;
  assert.equal(row.n, 1);
  assert.deepEqual(
    await sql`SELECT id,stage,due_at,last_reviewed_at FROM learning.flashcards WHERE user_id=${learner.id} ORDER BY id`,
    before,
  );
  await assert.rejects(
    sql`UPDATE learning.typing_game_sessions SET result='{}' WHERE id=${s.id}`,
    /immutable_history/,
  );
  await assert.rejects(
    sql`UPDATE learning.typing_game_items SET normalized_answer='changed' WHERE session_id=${s.id}`,
    /immutable_history/,
  );
});
test("loss can be retried as a small owned set; finish cannot overwrite an abandoned session", async () => {
  const s = await start(),
    state = createGame(s.items, s.config);
  advanceToTick(state, 30000);
  await waitForElapsed(s, state.tick);
  const completed = await request(
    "learning",
    `/v1/typing-sessions/${s.id}/finish`,
    {
      method: "POST",
      key: randomUUID(),
      body: {
        manifest_hash: s.manifest_hash,
        events: [],
        final_tick: state.tick,
      },
    },
  );
  assert.equal(completed.result.missed_ids.length, 3);
  await start({ kind: "retry_missed", session_id: s.id }, randomUUID(), {
    user: other,
    expected: 404,
  });
  const retry = await start({ kind: "retry_missed", session_id: s.id });
  assert.equal(retry.items.length, 3);
  const original = new Set(
    s.items
      .filter((i) => completed.result.missed_ids.includes(i.id))
      .map((i) => i.answer),
  );
  assert.ok(retry.items.every((i) => original.has(i.answer)));
  await abandon(retry);
  await request("learning", `/v1/typing-sessions/${retry.id}/finish`, {
    method: "POST",
    key: randomUUID(),
    body: winning(retry).body,
    expected: 409,
  });
});
test("runtime roles cannot cross schema or expose game data to browser SQL roles", async () => {
  const role = readLocal("runtime.json").learning,
    db = database(role.databaseUrl);
  try {
    await db`SELECT count(*) FROM learning.typing_game_sessions`;
    await assert.rejects(db`SELECT count(*) FROM content.vocabulary_entries`);
  } finally {
    await db.end();
  }
  await assert.rejects(
    sql.begin(async (tx) => {
      await tx`SET LOCAL ROLE authenticated`;
      await tx`SELECT * FROM learning.typing_game_sessions`;
    }),
  );
});
test("expired sessions stop blocking new starts, and a finish/abandon race has one terminal outcome", async () => {
  const previous = await start();
  await abandon(previous);
  const sid = randomUUID(),
    items = previous.items.map((i) => ({ ...i, id: randomUUID() }));
  const hash = createHash("sha256")
    .update(JSON.stringify({ config: previous.config, items }))
    .digest("hex");
  await sql.begin(async (tx) => {
    await tx`INSERT INTO learning.typing_game_sessions(id,user_id,source,source_title_snapshot,config_snapshot,manifest_hash,created_at,expires_at) VALUES(${sid},${learner.id},${tx.json({ kind: "personal_cards" })},'Expired typing fixture',${tx.json(previous.config)},${hash},now()-interval '31 minutes',now()-interval '1 minute')`;
    for (const item of items)
      await tx`INSERT INTO learning.typing_game_items(id,user_id,session_id,position,normalized_answer,item_snapshot) VALUES(${item.id},${learner.id},${sid},${item.position},${item.answer},${tx.json(item)})`;
  });
  const expired = await request("learning", `/v1/typing-sessions/${sid}`);
  assert.equal(expired.status, "expired");
  await request("learning", `/v1/typing-sessions/${sid}/finish`, {
    method: "POST",
    key: randomUUID(),
    body: winning({ ...previous, id: sid, manifest_hash: hash, items }).body,
    expected: 409,
  });
  const s = await start(),
    win = winning(s);
  await waitForElapsed(s, win.body.final_tick);
  const responses = await Promise.all(
    ["finish", "abandon"].map((action) =>
      fetch(`http://127.0.0.1:4003/v1/typing-sessions/${s.id}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${learner.token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify(action === "finish" ? win.body : {}),
      }),
    ),
  );
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const final = await request("learning", `/v1/typing-sessions/${s.id}`);
  assert.ok(["completed", "abandoned"].includes(final.status));
  assert.equal(final.result !== null, final.status === "completed");
});
