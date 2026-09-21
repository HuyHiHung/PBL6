import { z } from "zod";
import {
  ApiError,
  json,
  page,
  protect,
  uuid,
  type App,
  type Config,
  type DB,
} from "../../../packages/backend/src/http.js";
import {
  selectWords,
  type WordSource,
} from "../../../packages/typing-core/src/index.js";

export function typingRoutes(app: App, cfg: Config, sql: DB) {
  app.get("/v1/typing-sources", protect(cfg), async (c) => {
    const p = page(c);
    const course = c.req.query("course_id")
      ? uuid.parse(c.req.query("course_id"))
      : null;
    const topic = c.req.query("topic_id")
      ? uuid.parse(c.req.query("topic_id"))
      : null;
    const rows =
      await sql`SELECT l.id,r.title,t.title AS topic_title,c.title AS course_title,
      coalesce((SELECT jsonb_agg(v.snapshot ORDER BY v.position,v.vocabulary_id) FROM content.lesson_revision_vocabulary v WHERE v.lesson_revision_id=r.id),'[]') AS words
      FROM content.lessons l JOIN content.topics t ON t.id=l.topic_id JOIN content.courses c ON c.id=t.course_id JOIN content.lesson_revisions r ON r.id=l.published_revision_id
      WHERE l.status='published' AND t.status='published' AND c.status='published'
      AND (${course}::uuid IS NULL OR c.id=${course}) AND (${topic}::uuid IS NULL OR t.id=${topic})
      AND EXISTS(SELECT 1 FROM content.lesson_revision_vocabulary v WHERE v.lesson_revision_id=r.id)
      ORDER BY c.position,t.position,l.position,l.id LIMIT 21 OFFSET ${(p - 1) * 20}`;
    return c.json({
      items: rows.slice(0, 20).map((r) => {
        const { count, invalid, duplicates } = selectWords(
          r.words as { word: string }[],
        );
        return {
          id: r.id,
          title: r.title,
          topic_title: r.topic_title,
          course_title: r.course_title,
          count,
          invalid,
          duplicates,
        };
      }),
      page: p,
      has_more: rows.length > 20,
      enabled: process.env.TYPING_GAME_ENABLED !== "false",
    });
  });
  // Registered after the existing /internal/* service-token middleware.
  app.post("/internal/typing-snapshot", async (c) => {
    const b = await json(c, z.object({ lesson_id: uuid }).strict());
    const rows =
      await sql`SELECT l.id,r.title,r.id AS revision_id,v.vocabulary_id,v.snapshot FROM content.lessons l
      JOIN content.topics t ON t.id=l.topic_id JOIN content.courses c ON c.id=t.course_id
      JOIN content.lesson_revisions r ON r.id=l.published_revision_id
      LEFT JOIN content.lesson_revision_vocabulary v ON v.lesson_revision_id=r.id
      WHERE l.id=${b.lesson_id} AND l.status='published' AND t.status='published' AND c.status='published'
      ORDER BY v.position,v.vocabulary_id`;
    if (!rows.length) throw new ApiError(409, "CONTENT_UNAVAILABLE");
    const words: WordSource[] = rows
      .filter((r) => r.vocabulary_id)
      .map((r) => ({
        source_kind: "lesson",
        source_item_id: r.vocabulary_id,
        source_lesson_id: r.id,
        source_revision_id: r.revision_id,
        word: r.snapshot.word,
        meaning: r.snapshot.meaning,
        example: r.snapshot.example ?? "",
      }));
    return c.json({ title: rows[0]!.title, ...selectWords(words) });
  });
}
