import { z } from "zod";
import {
  ApiError,
  id,
  json,
  uuid,
  version,
  page,
  principal,
  protect,
  text,
  type App,
  type DB,
  type Config,
  type Query,
} from "../../../packages/backend/src/http.js";
import { tokens } from "../../../packages/backend/src/dictation.js";
export function expansionRoutes(
  app: App,
  cfg: Config,
  sql: DB,
  signed: (id: string) => Promise<string | null>,
) {
  const transaction = <T>(fn: (tx: Query) => Promise<T>) =>
    sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
      return fn(tx);
    }) as Promise<T>;
  app.get("/v1/search", async (c) => {
    const q = z.string().trim().min(2).max(100).parse(c.req.query("q")),
      type = z
        .enum(["all", "course", "topic", "lesson", "vocabulary"])
        .parse(c.req.query("type") ?? "all"),
      course = c.req.query("course_id")
        ? uuid.parse(c.req.query("course_id"))
        : null,
      p = page(c);
    const authenticated = c.req.header("Authorization")
      ? !!(await principal(cfg, c))
      : false;
    const escaped = q.replace(/[\\%_]/g, "\\$&");
    const [r] = await sql`WITH lessons AS (
   SELECT l.id,l.is_preview,t.id AS topic_id,c.id AS course_id,r.title,r.id AS revision_id FROM content.lessons l JOIN content.topics t ON t.id=l.topic_id JOIN content.courses c ON c.id=t.course_id JOIN content.lesson_revisions r ON r.id=l.published_revision_id WHERE l.status='published' AND t.status='published' AND c.status='published'
  ), documents AS (
   SELECT 'course' AS type,c.id::text AS id,c.title,NULL::text AS meaning,c.id AS course_id,NULL::uuid AS topic_id,NULL::uuid AS lesson_id,NULL::boolean AS is_preview FROM content.courses c WHERE c.status='published'
   UNION ALL SELECT 'topic',t.id::text,t.title,NULL,t.course_id,t.id,NULL,NULL FROM content.topics t JOIN content.courses c ON c.id=t.course_id WHERE t.status='published' AND c.status='published'
   UNION ALL SELECT 'lesson',id::text,title,NULL,course_id,topic_id,id,is_preview FROM lessons
   UNION ALL SELECT 'vocabulary',l.id::text||':'||v.vocabulary_id::text,v.snapshot->>'word',v.snapshot->>'meaning',l.course_id,l.topic_id,l.id,l.is_preview FROM lessons l JOIN content.lesson_revision_vocabulary v ON v.lesson_revision_id=l.revision_id WHERE ${authenticated} OR l.is_preview
  ), normalized AS (SELECT *,content.search_normalize(title) AS name,content.search_normalize(coalesce(meaning,'')) AS definition FROM documents WHERE (${type}='all' OR type=${type}) AND (${course}::uuid IS NULL OR course_id=${course})),
  matched AS (SELECT *,CASE WHEN name=content.search_normalize(${q}) OR definition=content.search_normalize(${q}) THEN 0 WHEN name LIKE content.search_normalize(${escaped + "%"}) OR definition LIKE content.search_normalize(${escaped + "%"}) THEN 1 ELSE 2 END AS rank FROM normalized WHERE name LIKE content.search_normalize(${"%" + escaped + "%"}) OR definition LIKE content.search_normalize(${"%" + escaped + "%"})),
  paginated AS (SELECT type,id,title,meaning,course_id,topic_id,lesson_id,is_preview FROM matched ORDER BY rank,name,id,type LIMIT 20 OFFSET ${(p - 1) * 20})
  SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(paginated) FROM paginated),'[]'::jsonb),'total',(SELECT count(*) FROM matched),'page',${p}::int) AS result`;
    return c.json(r!.result);
  });
  async function snapshot(dictation: string) {
    const [r] =
      await sql`SELECT d.id,d.lesson_id,d.published_revision_id AS revision_id,r.title,r.instructions,r.audio_asset_id,r.transcript,t.id AS topic_id,t.course_id FROM content.dictations d JOIN content.dictation_revisions r ON r.id=d.published_revision_id JOIN content.lessons l ON l.id=d.lesson_id JOIN content.topics t ON t.id=l.topic_id JOIN content.courses c ON c.id=t.course_id WHERE d.id=${dictation} AND d.status='published' AND l.status='published' AND t.status='published' AND c.status='published'`;
    if (!r) throw new ApiError(404, "CONTENT_UNAVAILABLE");
    return r;
  }
  app.get("/internal/dictations/:id", async (c) =>
    c.json(await snapshot(id(c))),
  );
  app.use("/v1/dictations*", protect(cfg));
  app.get("/v1/dictations", async (c) => {
    const course = c.req.query("course_id")
        ? uuid.parse(c.req.query("course_id"))
        : null,
      topic = c.req.query("topic_id")
        ? uuid.parse(c.req.query("topic_id"))
        : null,
      lesson = c.req.query("lesson_id")
        ? uuid.parse(c.req.query("lesson_id"))
        : null;
    const rows =
      await sql`SELECT d.id,d.lesson_id,r.title,r.instructions,t.id AS topic_id,t.course_id,lr.title AS lesson_title FROM content.dictations d JOIN content.dictation_revisions r ON r.id=d.published_revision_id JOIN content.lessons l ON l.id=d.lesson_id JOIN content.lesson_revisions lr ON lr.id=l.published_revision_id JOIN content.topics t ON t.id=l.topic_id JOIN content.courses c ON c.id=t.course_id WHERE d.status='published' AND l.status='published' AND t.status='published' AND c.status='published' AND (${course}::uuid IS NULL OR t.course_id=${course}) AND (${topic}::uuid IS NULL OR t.id=${topic}) AND (${lesson}::uuid IS NULL OR l.id=${lesson}) ORDER BY c.position,t.position,l.position,d.position,d.id LIMIT 20 OFFSET ${(page(c) - 1) * 20}`;
    return c.json({ items: rows, page: page(c) });
  });
  app.get("/v1/dictations/:id", async (c) => {
    const { transcript, ...r } = await snapshot(id(c));
    return c.json({ ...r, audio_url: await signed(r.audio_asset_id) });
  });
  const body = z
    .object({
      title: z.string().trim().min(1).max(300),
      instructions: z.string().max(5000).default(""),
      audio_asset_id: uuid,
      transcript: z.string().trim().min(1).max(10000),
    })
    .strict();
  function validate(value: z.infer<typeof body>) {
    if (
      tokens(value.transcript).length < 1 ||
      tokens(value.transcript).length > 200
    )
      throw new ApiError(400, "INVALID_TRANSCRIPT_LENGTH");
  }
  async function audit(
    tx: Query,
    user: string,
    action: string,
    target: string,
  ) {
    await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${user},${action},'dictation',${target},'{}')`;
  }
  app.get("/v1/admin/dictations", async (c) => {
    const lesson = uuid.parse(c.req.query("lesson_id"));
    return c.json({
      items:
        await sql`SELECT d.*,r.id AS revision_id,r.revision_no,r.title,r.instructions,r.audio_asset_id,r.transcript,r.published_at,r.row_version AS revision_version FROM content.dictations d JOIN content.dictation_revisions r ON r.dictation_id=d.id WHERE d.lesson_id=${lesson} ORDER BY d.position,d.id,r.revision_no DESC`,
    });
  });
  app.post("/v1/admin/dictations", async (c) => {
    const b = await json(
      c,
      body.extend({
        lesson_id: uuid,
        position: z.number().int().positive().default(1),
      }),
    );
    validate(b);
    const result = await transaction(async (tx) => {
      const [d] =
        await tx`INSERT INTO content.dictations(lesson_id,position) VALUES(${b.lesson_id},${b.position}) RETURNING *`;
      const [r] =
        await tx`INSERT INTO content.dictation_revisions(dictation_id,revision_no,title,instructions,audio_asset_id,transcript,created_by) VALUES(${d!.id},1,${b.title},${b.instructions},${b.audio_asset_id},${b.transcript},${c.get("principal").user_id}) RETURNING id`;
      await audit(tx, c.get("principal").user_id, "dictation.create", d!.id);
      return { ...d, revision_id: r!.id };
    });
    return c.json(result, 201);
  });
  app.post("/v1/admin/dictations/:id/revisions", async (c) => {
    const b = await json(c, body);
    validate(b);
    const d = id(c);
    const result = await transaction(async (tx) => {
      const [r] =
        await tx`INSERT INTO content.dictation_revisions(dictation_id,revision_no,title,instructions,audio_asset_id,transcript,created_by) SELECT ${d},coalesce(max(revision_no),0)+1,${b.title},${b.instructions},${b.audio_asset_id},${b.transcript},${c.get("principal").user_id} FROM content.dictation_revisions WHERE dictation_id=${d} RETURNING id,row_version`;
      await audit(tx, c.get("principal").user_id, "dictation.revision", d);
      return r;
    });
    return c.json(result!, 201);
  });
  app.patch("/v1/admin/dictation-revisions/:id", async (c) => {
    const b = await json(c, body.extend({ expectedVersion: version }));
    validate(b);
    const result = await transaction(async (tx) => {
      const [r] =
        await tx`UPDATE content.dictation_revisions SET title=${b.title},instructions=${b.instructions},audio_asset_id=${b.audio_asset_id},transcript=${b.transcript} WHERE id=${id(c)} AND published_at IS NULL AND row_version=${b.expectedVersion} RETURNING id,row_version,dictation_id`;
      if (!r) throw new ApiError(409, "VERSION_CONFLICT");
      await audit(
        tx,
        c.get("principal").user_id,
        "dictation.update",
        r.dictation_id,
      );
      return r;
    });
    return c.json(result);
  });
  app.post("/v1/admin/dictations/:id/publish", async (c) => {
    const b = await json(
        c,
        z.object({ revisionId: uuid, expectedVersion: version }).strict(),
      ),
      d = id(c);
    await transaction(async (tx) => {
      const [parent] =
        await tx`SELECT id FROM content.dictations WHERE id=${d} AND row_version=${b.expectedVersion} FOR UPDATE`;
      if (!parent) throw new ApiError(409, "VERSION_CONFLICT");
      const [r] =
        await tx`UPDATE content.dictation_revisions SET published_at=clock_timestamp() WHERE id=${b.revisionId} AND dictation_id=${d} AND published_at IS NULL RETURNING id`;
      if (!r) throw new ApiError(409, "DRAFT_REQUIRED");
      await tx`UPDATE content.dictations SET status='published',published_revision_id=${r.id} WHERE id=${d}`;
      await audit(tx, c.get("principal").user_id, "dictation.publish", d);
    });
    return c.json({ published: true });
  });
  app.patch("/v1/admin/dictations/:id/status", async (c) => {
    const b = await json(
        c,
        z
          .object({
            status: z.enum(["published", "hidden"]),
            expectedVersion: version,
          })
          .strict(),
      ),
      d = id(c);
    await transaction(async (tx) => {
      const [r] =
        await tx`UPDATE content.dictations SET status=${b.status} WHERE id=${d} AND row_version=${b.expectedVersion} RETURNING id`;
      if (!r) throw new ApiError(409, "VERSION_CONFLICT");
      await audit(tx, c.get("principal").user_id, "dictation.status", d);
    });
    return c.json({ updated: true });
  });
}
