import { createHash, randomUUID, randomInt } from "node:crypto";
import { z } from "zod";
import { bodyLimit } from "hono/body-limit";
import {
  ApiError,
  contentCall,
  id,
  json,
  jsonValue,
  key,
  page,
  uuid,
  type App,
  type Config,
  type DB,
  type Query,
} from "../../../packages/backend/src/http.js";
import {
  configuration,
  fallTicks,
  normalizeWord,
  replay,
  selectWords,
  MAX_EVENTS,
  MAX_TICKS,
  TICK_MS,
  type GameItem,
  type WordSource,
} from "../../../packages/typing-core/src/index.js";
import type {
  TypingSession,
  TypingSnapshot,
  TypingSource,
} from "../../../packages/api-client/src/typing.js";

const sourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("lesson"), lesson_id: uuid }).strict(),
  z
    .object({ kind: z.literal("personal_cards"), topic_id: uuid.optional() })
    .strict(),
  z.object({ kind: z.literal("retry_missed"), session_id: uuid }).strict(),
]);
const finishSchema = z
  .object({
    manifest_hash: z.string().regex(/^[a-f0-9]{64}$/),
    final_tick: z.number().int().min(0).max(MAX_TICKS),
    events: z
      .array(
        z.discriminatedUnion("type", [
          z
            .object({
              seq: z.number().int().positive(),
              tick: z.number().int().min(0).max(MAX_TICKS),
              type: z.literal("char"),
              value: z.string().regex(/^[a-z '-]$/),
            })
            .strict(),
          z
            .object({
              seq: z.number().int().positive(),
              tick: z.number().int().min(0).max(MAX_TICKS),
              type: z.enum(["backspace", "unlock"]),
            })
            .strict(),
        ]),
      )
      .max(MAX_EVENTS),
  })
  .strict();
const hash = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");

export function typingRoutes(app: App, cfg: Config, sql: DB) {
  const enabled = () => process.env.TYPING_GAME_ENABLED !== "false";
  async function expire(user: string) {
    await sql`UPDATE learning.typing_game_sessions SET status='expired',finished_at=clock_timestamp() WHERE user_id=${user} AND status='in_progress' AND expires_at<=clock_timestamp()`;
  }
  async function owned(
    user: string,
    sid: string,
    db: Query = sql,
    lock = false,
  ) {
    const rows = lock
      ? await db`SELECT * FROM learning.typing_game_sessions WHERE id=${sid} AND user_id=${user} FOR UPDATE`
      : await db`SELECT * FROM learning.typing_game_sessions WHERE id=${sid} AND user_id=${user}`;
    if (!rows[0]) throw new ApiError(404, "SESSION_NOT_FOUND");
    return rows[0];
  }
  async function dto(user: string, sid: string): Promise<TypingSession> {
    const r = await owned(user, sid);
    const items =
      await sql`SELECT item_snapshot FROM learning.typing_game_items WHERE session_id=${sid} AND user_id=${user} ORDER BY position`;
    return {
      id: r.id,
      user_id: r.user_id,
      source: r.source,
      title: r.source_title_snapshot,
      status: r.status,
      created_at: r.created_at.toISOString(),
      expires_at: r.expires_at.toISOString(),
      finished_at: r.finished_at?.toISOString() ?? null,
      config: r.config_snapshot,
      manifest_hash: r.manifest_hash,
      result: r.result,
      items: items.map((i) => i.item_snapshot),
    };
  }
  async function dedup(
    user: string,
    op: string,
    k: string,
    payload: unknown,
    fn: (tx: Query) => Promise<Record<string, unknown>>,
  ) {
    return sql.begin(async (tx) => {
      const [old] =
        await tx`SELECT learning.claim_request(${user},${op},${k},${tx.json(jsonValue(payload))}) AS result`;
      if (old!.result) return old!.result;
      const result = await fn(tx);
      await tx`SELECT learning.finish_request(${user},${op},${k},${tx.json(jsonValue(result))})`;
      return result;
    });
  }
  async function personal(user: string, topic?: string) {
    const rows =
      await sql`SELECT id,word,meaning,example,source_lesson_id FROM learning.flashcards WHERE user_id=${user} AND deleted_at IS NULL AND (${topic ?? null}::uuid IS NULL OR source_topic_id=${topic ?? null}) ORDER BY due_at,id LIMIT 1001`;
    const words: WordSource[] = rows
      .slice(0, 1000)
      .map((r) => ({
        source_kind: "personal_cards",
        source_item_id: r.id,
        source_lesson_id: r.source_lesson_id,
        word: r.word,
        meaning: r.meaning,
        example: r.example,
      }));
    return {
      title: "Thẻ của tôi",
      ...selectWords(words),
      truncated: rows.length > 1000,
    };
  }
  async function snapshot(
    user: string,
    source: TypingSource,
  ): Promise<TypingSnapshot> {
    if (source.kind === "lesson")
      return contentCall<TypingSnapshot>(cfg, "/typing-snapshot", {
        lesson_id: source.lesson_id,
      });
    if (source.kind === "personal_cards")
      return personal(user, source.topic_id);
    const previous = await dto(user, source.session_id);
    if (previous.status !== "completed" || !previous.result)
      throw new ApiError(409, "SESSION_NOT_FINISHED");
    const missed = previous.items.filter((i) =>
      previous.result!.missed_ids.includes(i.id),
    );
    const lessonIds = [
      ...new Set(
        missed
          .filter((i) => i.source_kind === "lesson")
          .map((i) => i.source_lesson_id!),
      ),
    ];
    const currentLessons = new Map<string, WordSource[]>();
    for (const lesson of lessonIds) {
      try {
        currentLessons.set(
          lesson,
          (
            await contentCall<TypingSnapshot>(cfg, "/typing-snapshot", {
              lesson_id: lesson,
            })
          ).items,
        );
      } catch (e) {
        if (!(e instanceof ApiError) || ![404, 409].includes(e.status)) throw e;
      }
    }
    const cardIds = missed
      .filter((i) => i.source_kind === "personal_cards")
      .map((i) => i.source_item_id);
    const cards = cardIds.length
      ? await sql`SELECT id,word,meaning,example,source_lesson_id FROM learning.flashcards WHERE user_id=${user} AND deleted_at IS NULL AND id IN ${sql(cardIds)}`
      : [];
    const words: WordSource[] = [];
    for (const item of missed) {
      if (item.source_kind === "lesson") {
        const word = currentLessons
          .get(item.source_lesson_id!)
          ?.find((i) => i.source_item_id === item.source_item_id);
        if (word) words.push(word);
      } else {
        const card = cards.find((c) => c.id === item.source_item_id);
        if (card)
          words.push({
            source_kind: "personal_cards",
            source_item_id: card.id,
            word: card.word,
            meaning: card.meaning,
            example: card.example,
            source_lesson_id: card.source_lesson_id,
          });
      }
    }
    return { title: "Luyện lại từ bỏ lỡ", ...selectWords(words) };
  }
  app.get("/v1/typing-sources/personal", async (c) => {
    const data = await personal(
      c.get("principal").user_id,
      c.req.query("topic_id") ? uuid.parse(c.req.query("topic_id")) : undefined,
    );
    const { items, ...summary } = data;
    return c.json({ ...summary, enabled: enabled() });
  });
  app.get("/v1/typing-sessions", async (c) => {
    const user = c.get("principal").user_id,
      p = page(c);
    await expire(user);
    const rows =
      await sql`SELECT id,source_title_snapshot AS title,status,created_at,finished_at,config_snapshot->>'difficulty' AS difficulty,result FROM learning.typing_game_sessions WHERE user_id=${user} ORDER BY created_at DESC,id LIMIT 21 OFFSET ${(p - 1) * 20}`;
    const active =
      await sql`SELECT id FROM learning.typing_game_sessions WHERE user_id=${user} AND status='in_progress'`;
    return c.json({
      items: rows.slice(0, 20),
      page: p,
      has_more: rows.length > 20,
      active_id: active[0]?.id ?? null,
      enabled: enabled(),
    });
  });
  app.get("/v1/typing-sessions/:id", async (c) => {
    const user = c.get("principal").user_id;
    await expire(user);
    return c.json(await dto(user, id(c)));
  });
  app.post("/v1/typing-sessions", async (c) => {
    const user = c.get("principal").user_id,
      k = key(c),
      b = await json(
        c,
        z
          .object({
            source: sourceSchema,
            difficulty: z.enum(["easy", "normal", "hard"]),
            limit: z.number().int().min(5).max(30).default(30),
          })
          .strict(),
      );
    // Successful retries must work even when sources have changed or new starts are disabled.
    const [prior] =
      await sql`SELECT result_reference,request_hash FROM learning.request_dedup WHERE user_id=${user} AND operation='typing.start' AND idempotency_key=${k}`;
    if (prior?.result_reference) {
      const saved = await dedup(user, "typing.start", k, b, async () => {
        throw new Error("MISSING_DEDUP");
      });
      return c.json(await dto(user, saved.session_id), 201);
    }
    if (!enabled()) throw new ApiError(409, "GAME_DISABLED");
    await expire(user);
    const source = await snapshot(user, b.source);
    if (source.items.length < (b.source.kind === "retry_missed" ? 1 : 5))
      throw new ApiError(409, "INSUFFICIENT_WORDS");
    const candidates = [...source.items];
    for (let n = candidates.length - 1; n > 0; n--) {
      const j = randomInt(n + 1);
      [candidates[n], candidates[j]] = [candidates[j]!, candidates[n]!];
    }
    const config = configuration(b.difficulty);
    const items: GameItem[] = candidates.slice(0, b.limit).map((word, n) => {
      const answer = normalizeWord(word.word),
        wave = Math.floor(n / 10) + 1;
      return {
        ...word,
        id: randomUUID(),
        position: n + 1,
        wave,
        lane: n % 3,
        answer,
        fall_ticks: fallTicks(b.difficulty, wave, answer.length),
      };
    });
    const manifest = hash({ config, items });
    const result = await dedup(user, "typing.start", k, b, async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${user},27))`;
      await tx`UPDATE learning.typing_game_sessions SET status='expired',finished_at=clock_timestamp() WHERE user_id=${user} AND status='in_progress' AND expires_at<=clock_timestamp()`;
      const [old] =
        await tx`SELECT id FROM learning.typing_game_sessions WHERE user_id=${user} AND status='in_progress'`;
      if (old) throw new ApiError(409, "ACTIVE_GAME_EXISTS");
      const [session] =
        await tx`INSERT INTO learning.typing_game_sessions(user_id,source,source_title_snapshot,config_snapshot,manifest_hash) VALUES(${user},${tx.json(b.source)},${source.title},${tx.json(config)},${manifest}) RETURNING id`;
      for (const item of items)
        await tx`INSERT INTO learning.typing_game_items(id,user_id,session_id,position,normalized_answer,item_snapshot) VALUES(${item.id},${user},${session!.id},${item.position},${item.answer},${tx.json(jsonValue(item))})`;
      return { session_id: session!.id };
    });
    return c.json(await dto(user, result.session_id), 201);
  });
  app.post("/v1/typing-sessions/:id/abandon", async (c) => {
    const user = c.get("principal").user_id,
      sid = id(c),
      b = await json(c, z.object({}).strict());
    const result = await dedup(
      user,
      "typing.abandon:" + sid,
      key(c),
      b,
      async (tx) => {
        const s = await owned(user, sid, tx, true);
        if (s.status === "completed")
          throw new ApiError(409, "SESSION_ALREADY_FINISHED");
        if (s.status === "in_progress")
          await tx`UPDATE learning.typing_game_sessions SET status='abandoned',finished_at=clock_timestamp() WHERE id=${sid} AND user_id=${user}`;
        return { session_id: sid };
      },
    );
    return c.json(result);
  });
  app.post(
    "/v1/typing-sessions/:id/finish",
    bodyLimit({
      maxSize: 512 * 1024,
      onError: (c) => {
        // The unread request body must not leave a reusable HTTP/1 connection.
        c.header("Connection", "close");
        return c.json({ error: { code: "BODY_TOO_LARGE" } }, 413);
      },
    }),
    async (c) => {
      const user = c.get("principal").user_id,
        sid = id(c),
        k = key(c),
        b = await json(c, finishSchema);
      await expire(user);
      const s = await dto(user, sid),
        submission = hash(b);
      if (s.manifest_hash !== b.manifest_hash)
        throw new ApiError(422, "INVALID_GAME_LOG");
      if (s.status === "expired") throw new ApiError(409, "SESSION_EXPIRED");
      if (s.status === "abandoned")
        throw new ApiError(409, "SESSION_ALREADY_FINISHED");
      if (b.final_tick * TICK_MS > Date.now() - Date.parse(s.created_at) + 1000)
        throw new ApiError(422, "INVALID_GAME_LOG");
      let result;
      try {
        result = replay(s.items, s.config, b.events, b.final_tick);
      } catch {
        throw new ApiError(422, "INVALID_GAME_LOG");
      }
      await dedup(user, "typing.finish:" + sid, k, b, async (tx) => {
        const current = await owned(user, sid, tx, true);
        if (current.status === "completed") {
          if (current.submission_hash !== submission)
            throw new ApiError(409, "SESSION_ALREADY_FINISHED");
          return { session_id: sid };
        }
        if (current.status !== "in_progress")
          throw new ApiError(409, "SESSION_ALREADY_FINISHED");
        if (new Date(current.expires_at).getTime() <= Date.now())
          throw new ApiError(409, "SESSION_EXPIRED");
        await tx`UPDATE learning.typing_game_sessions SET status='completed',finished_at=clock_timestamp(),result=${tx.json(result)},submission_hash=${submission},event_log=${tx.json(b.events)},final_tick=${b.final_tick} WHERE id=${sid} AND user_id=${user}`;
        return { session_id: sid };
      });
      return c.json(await dto(user, sid));
    },
  );
}
