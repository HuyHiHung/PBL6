import { z } from "zod";
import {
  ApiError,
  id,
  json,
  uuid,
  version,
  page,
  key,
  contentCall,
  jsonValue,
  type App,
  type DB,
  type Config,
  type Query,
} from "../../../packages/backend/src/http.js";
import {
  gradeDictation,
  tokens,
} from "../../../packages/backend/src/dictation.js";
type Lesson = { id: string; title: string; revision_id: string };
type Snapshot = {
  id: string;
  revision_id: string;
  lesson_id: string;
  topic_id: string;
  course_id: string;
  title: string;
  instructions: string;
  audio_asset_id: string;
  transcript: string;
};
export function expansionRoutes(app: App, cfg: Config, sql: DB) {
  async function lessonInfo(lesson: string) {
    try {
      return await contentCall<Lesson>(cfg, "/lessons/" + lesson);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }
  const user = (c: Parameters<typeof id>[0]) => c.get("principal").user_id;
  app.get("/v1/notes", async (c) => {
    const rows =
      await sql`SELECT * FROM learning.lesson_notes WHERE user_id=${user(c)} ORDER BY updated_at DESC,id LIMIT 20 OFFSET ${(page(c) - 1) * 20}`;
    return c.json({
      items: await Promise.all(
        rows.map(async (r) => {
          const current = await lessonInfo(r.lesson_id);
          return {
            ...r,
            available: !!current,
            current_title: current?.title ?? null,
            revision_changed:
              !!current && current.revision_id !== r.lesson_revision_id,
          };
        }),
      ),
      page: page(c),
    });
  });
  app.get("/v1/lessons/:id/note", async (c) => {
    const [note] =
        await sql`SELECT * FROM learning.lesson_notes WHERE user_id=${user(c)} AND lesson_id=${id(c)}`,
      current = await lessonInfo(id(c));
    return c.json({
      note: note ?? null,
      available: !!current,
      current_title: current?.title ?? null,
      revision_changed:
        !!note && !!current && current.revision_id !== note.lesson_revision_id,
    });
  });
  app.put("/v1/lessons/:id/note", async (c) => {
    const b = await json(
        c,
        z
          .object({
            content: z.string().trim().min(1).max(5000),
            expectedVersion: z.number().int().nonnegative(),
          })
          .strict(),
      ),
      lesson = id(c),
      current = await lessonInfo(lesson);
    const result = await sql.begin(async (tx) => {
      if (b.expectedVersion === 0) {
        if (!current) throw new ApiError(404, "CONTENT_UNAVAILABLE");
        const [r] =
          await tx`INSERT INTO learning.lesson_notes(user_id,lesson_id,content,title_snapshot,lesson_revision_id) VALUES(${user(c)},${lesson},${b.content},${current.title},${current.revision_id}) ON CONFLICT(user_id,lesson_id) DO NOTHING RETURNING *`;
        if (!r) throw new ApiError(409, "VERSION_CONFLICT");
        return r;
      }
      const [r] =
        await tx`UPDATE learning.lesson_notes SET content=${b.content},title_snapshot=coalesce(${current?.title ?? null},title_snapshot),lesson_revision_id=coalesce(${current?.revision_id ?? null}::uuid,lesson_revision_id) WHERE user_id=${user(c)} AND lesson_id=${lesson} AND row_version=${b.expectedVersion} RETURNING *`;
      if (!r) throw new ApiError(409, "VERSION_CONFLICT");
      return r;
    });
    return c.json(result);
  });
  app.delete("/v1/lessons/:id/note", async (c) => {
    const b = await json(c, z.object({ expectedVersion: version }).strict());
    const rows =
      await sql`DELETE FROM learning.lesson_notes WHERE user_id=${user(c)} AND lesson_id=${id(c)} AND row_version=${b.expectedVersion} RETURNING id`;
    if (!rows[0]) throw new ApiError(409, "VERSION_CONFLICT");
    return c.json({ deleted: true });
  });
  async function dedup(
    u: string,
    op: string,
    k: string,
    payload: unknown,
    fn: (tx: Query) => Promise<Record<string, unknown>>,
  ) {
    return sql.begin(async (tx) => {
      const [saved] =
        await tx`SELECT learning.claim_request(${u},${op},${k},${tx.json(jsonValue(payload))}) AS result`;
      if (saved!.result) return saved!.result;
      const result = await fn(tx);
      await tx`SELECT learning.finish_request(${u},${op},${k},${tx.json(jsonValue(result))})`;
      return result;
    });
  }
  async function owned(u: string, attempt: string, check = true) {
    const [r] =
      await sql`SELECT * FROM learning.dictation_attempts WHERE id=${attempt} AND user_id=${u}`;
    if (!r) throw new ApiError(404, "ATTEMPT_NOT_FOUND");
    if (check && r.status === "in_progress") {
      try {
        await contentCall<Snapshot>(cfg, "/dictations/" + r.dictation_id);
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          await sql`UPDATE learning.dictation_attempts SET status='cancelled',cancelled_at=clock_timestamp(),cancel_reason='content_unavailable' WHERE id=${r.id} AND user_id=${u} AND status='in_progress'`;
          throw new ApiError(409, "CONTENT_UNAVAILABLE");
        }
        throw e;
      }
    }
    return r;
  }
  async function dto(u: string, attempt: string, check = true) {
    const r = await owned(u, attempt, check),
      audio = await contentCall<{ url: string | null }>(
        cfg,
        "/media/" + r.audio_asset_id,
      );
    let revealed = {};
    if (r.status === "submitted") {
      const [k] =
        await sql`SELECT transcript_snapshot FROM learning.dictation_attempt_keys WHERE attempt_id=${r.id}`;
      revealed = { transcript: k!.transcript_snapshot, result: r.result };
    }
    return {
      id: r.id,
      dictation_id: r.dictation_id,
      lesson_id: r.lesson_id,
      title: r.title_snapshot,
      instructions: r.instructions_snapshot,
      audio_url: audio.url,
      answer: r.answer,
      status: r.status,
      row_version: Number(r.row_version),
      created_at: r.created_at,
      submitted_at: r.submitted_at,
      cancel_reason: r.cancel_reason,
      ...revealed,
    };
  }
  app.post("/v1/dictation-attempts", async (c) => {
    const b = await json(c, z.object({ dictation_id: uuid }).strict()),
      u = user(c),
      snapshot = await contentCall<Snapshot>(
        cfg,
        "/dictations/" + b.dictation_id,
      );
    const result = await dedup(u, "dictation.start", key(c), b, async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${u},31))`;
      const [old] =
        await tx`SELECT id FROM learning.dictation_attempts WHERE user_id=${u} AND dictation_id=${b.dictation_id} AND status='in_progress'`;
      if (old) return { attempt_id: old.id };
      const [r] =
        await tx`INSERT INTO learning.dictation_attempts(user_id,dictation_id,dictation_revision_id,lesson_id,topic_id,course_id,title_snapshot,instructions_snapshot,audio_asset_id) VALUES(${u},${snapshot.id},${snapshot.revision_id},${snapshot.lesson_id},${snapshot.topic_id},${snapshot.course_id},${snapshot.title},${snapshot.instructions},${snapshot.audio_asset_id}) RETURNING id`;
      await tx`INSERT INTO learning.dictation_attempt_keys(attempt_id,transcript_snapshot) VALUES(${r!.id},${snapshot.transcript})`;
      return { attempt_id: r!.id };
    });
    return c.json(result, 201);
  });
  app.get("/v1/dictation-attempts", async (c) =>
    c.json({
      items:
        await sql`SELECT id,dictation_id,title_snapshot,status,created_at,submitted_at,result->'score' AS score FROM learning.dictation_attempts WHERE user_id=${user(c)} ORDER BY created_at DESC,id LIMIT 20 OFFSET ${(page(c) - 1) * 20}`,
      page: page(c),
    }),
  );
  app.get("/v1/dictation-attempts/:id", async (c) =>
    c.json(await dto(user(c), id(c))),
  );
  const answerBody = z
    .object({ answer: z.string().max(10000), expectedVersion: version })
    .strict();
  app.put("/v1/dictation-attempts/:id/answer", async (c) => {
    const b = await json(c, answerBody),
      u = user(c),
      attempt = id(c);
    await owned(u, attempt);
    const [r] =
      await sql`UPDATE learning.dictation_attempts SET answer=${b.answer} WHERE id=${attempt} AND user_id=${u} AND status='in_progress' AND row_version=${b.expectedVersion} RETURNING row_version`;
    if (!r) throw new ApiError(409, "VERSION_CONFLICT");
    return c.json({ row_version: Number(r.row_version), answer: b.answer });
  });
  app.post("/v1/dictation-attempts/:id/submit", async (c) => {
    const b = await json(c, answerBody),
      u = user(c),
      attempt = id(c);
    const count = tokens(b.answer).length;
    if (count < 1 || count > 1000)
      throw new ApiError(400, "INVALID_ANSWER_LENGTH");
    await owned(u, attempt);
    await dedup(
      u,
      "dictation.submit",
      key(c),
      { attempt_id: attempt, ...b },
      async (tx) => {
        const [r] =
          await tx`SELECT row_version,status FROM learning.dictation_attempts WHERE id=${attempt} AND user_id=${u} FOR UPDATE`;
        if (
          !r ||
          r.status !== "in_progress" ||
          Number(r.row_version) !== b.expectedVersion
        )
          throw new ApiError(409, "VERSION_CONFLICT");
        const [k] =
          await tx`SELECT transcript_snapshot FROM learning.dictation_attempt_keys WHERE attempt_id=${attempt}`;
        const result = gradeDictation(k!.transcript_snapshot, b.answer);
        await tx`UPDATE learning.dictation_attempts SET answer=${b.answer},status='submitted',result=${tx.json(jsonValue(result))},submitted_at=clock_timestamp() WHERE id=${attempt}`;
        return { attempt_id: attempt };
      },
    );
    return c.json(await dto(u, attempt, false));
  });
  app.post("/v1/dictation-attempts/:id/cancel", async (c) => {
    const b = await json(c, z.object({ expectedVersion: version }).strict()),
      u = user(c),
      attempt = id(c);
    await owned(u, attempt, false);
    const rows =
      await sql`UPDATE learning.dictation_attempts SET status='cancelled',cancelled_at=clock_timestamp(),cancel_reason='user_cancelled' WHERE id=${attempt} AND user_id=${u} AND row_version=${b.expectedVersion} AND status='in_progress' RETURNING id`;
    if (!rows[0]) throw new ApiError(409, "VERSION_CONFLICT");
    return c.json({ cancelled: true });
  });
}
