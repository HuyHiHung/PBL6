import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createApiClient,
  ApiError,
  type Storage,
  type Session,
} from "../../packages/api-client/src/index.js";
function memory(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
}
const bases = {
  identity: "http://identity",
  content: "http://content",
  learning: "http://learning",
};
const session = async () => ({ userId: "learner", token: "test-token" });
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("an uncertain commit survives client restart and retries with the same idempotency key", async () => {
  const storage = memory(),
    keys: string[] = [];
  let first = true;
  const transport: typeof fetch = async (_, init) => {
    keys.push((init!.headers as Record<string, string>)["Idempotency-Key"]);
    if (first) {
      first = false;
      throw new Error("response lost after commit");
    }
    return json({ attempt_id: "saved" });
  };
  const make = () =>
    createApiClient({
      bases,
      storage,
      session,
      uuid: () => Math.random().toString(),
      fetch: transport,
    });
  const before = make();
  await assert.rejects(
    before.mutate("learning", "/v1/attempts", { assessment_id: "a" }),
  );
  assert.equal((await before.pending()).length, 1);
  const after = make();
  assert.deepEqual(
    await after.mutate("learning", "/v1/attempts", { assessment_id: "a" }),
    { attempt_id: "saved" },
  );
  assert.equal(keys[0], keys[1]);
  assert.equal((await after.pending()).length, 0);
});
test("double taps share one in-flight write; different intents have different keys", async () => {
  let calls = 0,
    id = 0;
  const keys: string[] = [];
  const client = createApiClient({
    bases,
    storage: memory(),
    session,
    uuid: () => String(++id),
    fetch: async (_, init) => {
      calls++;
      keys.push((init!.headers as Record<string, string>)["Idempotency-Key"]);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return json({ ok: true });
    },
  });
  await Promise.all([
    client.mutate("learning", "/v1/flashcards", { word: "one" }),
    client.mutate("learning", "/v1/flashcards", { word: "one" }),
  ]);
  assert.equal(calls, 1);
  await client.mutate("learning", "/v1/flashcards", { word: "two" });
  assert.notEqual(keys[0], keys[1]);
});
test("version conflicts are definitive, preserve the server code and never retry automatically", async () => {
  let calls = 0;
  const client = createApiClient({
    bases,
    storage: memory(),
    session,
    uuid: () => "key",
    fetch: async () => {
      calls++;
      return json({ error: { code: "VERSION_CONFLICT" } }, 409);
    },
  });
  await assert.rejects(
    client.mutate("learning", "/v1/attempts/a/submit", { expectedVersion: 2 }),
    (e: unknown) =>
      e instanceof ApiError &&
      e.status === 409 &&
      e.code === "VERSION_CONFLICT",
  );
  assert.equal(calls, 1);
  assert.equal((await client.pending()).length, 0);
});
test("pending records are isolated by account and late private responses are discarded", async () => {
  let current: Session | null = { userId: "first", token: "one" };
  const storage = memory();
  const client = createApiClient({
    bases,
    storage,
    session: async () => current,
    uuid: () => "key",
    fetch: async () => {
      throw new Error("offline");
    },
  });
  await assert.rejects(
    client.mutate("learning", "/v1/flashcards", { word: "private" }),
  );
  current = { userId: "second", token: "two" };
  assert.equal((await client.pending()).length, 0);
  const late = createApiClient({
    bases,
    storage,
    session: async () => current,
    uuid: () => "key",
    fetch: async () => {
      current = { userId: "third", token: "three" };
      return json({ secret: "other account" });
    },
  });
  await assert.rejects(
    late.request("learning", "/v1/notes"),
    (e: unknown) => e instanceof ApiError && e.code === "SESSION_CHANGED",
  );
});
test("failure to persist intent prevents the network write", async () => {
  let calls = 0;
  const storage = memory();
  storage.setItem = async () => {
    throw new Error("storage unavailable");
  };
  const client = createApiClient({
    bases,
    storage,
    session,
    uuid: () => "key",
    fetch: async () => {
      calls++;
      return json({});
    },
  });
  await assert.rejects(
    client.mutate("learning", "/v1/attempts", {}),
    /storage unavailable/,
  );
  assert.equal(calls, 0);
});
test("unauthenticated writes and internal routes never reach the network", async () => {
  let calls = 0;
  const client = createApiClient({
    bases,
    storage: memory(),
    session: async () => null,
    uuid: () => "key",
    fetch: async () => {
      calls++;
      return json({});
    },
  });
  await assert.rejects(client.mutate("learning", "/v1/attempts", {}));
  await assert.rejects(client.request("content", "/internal/assessment"));
  assert.equal(calls, 0);
});
test("timeout aborts transport and keeps the persisted retry record", async () => {
  const client = createApiClient({
    bases,
    storage: memory(),
    session,
    uuid: () => "key",
    timeoutMs: 5,
    fetch: async (_, init) =>
      new Promise((_, reject) =>
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        ),
      ),
  });
  await assert.rejects(client.mutate("learning", "/v1/attempts", {}));
  assert.equal((await client.pending()).length, 1);
});
test("server auth rejection signals the session gate and retains recoverable intent", async () => {
  let code = "";
  const client = createApiClient({
    bases,
    storage: memory(),
    session,
    uuid: () => "key",
    onAuthError: (e) => {
      code = e.code;
    },
    fetch: async () => json({ error: { code: "SESSION_REVOKED" } }, 401),
  });
  await assert.rejects(client.mutate("learning", "/v1/attempts", {}));
  assert.equal(code, "SESSION_REVOKED");
  assert.equal((await client.pending()).length, 1);
});
