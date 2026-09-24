import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localStatus, database, readLocal } from "../scripts/local-lib.mjs";
import { loadTechnicalMaterials } from "../scripts/render-technical-materials.mjs";
import {
  compileImportPlan,
  digest,
} from "../scripts/materials-import-plan.mjs";
import {
  inspectImport,
  insertDrafts,
} from "../scripts/materials-import-db.mjs";
import {
  executePublication,
  publicationPlan,
  inspectPublication,
} from "../scripts/publish-technical-materials.mjs";

function fixture(broken = false) {
  const ids = new Map(),
    suffix = randomUUID();
  const plan = JSON.parse(
    JSON.stringify(compileImportPlan(loadTechnicalMaterials().results)),
    (_key, v) => {
      if (
        typeof v === "string" &&
        /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
          v,
        )
      ) {
        if (!ids.has(v)) ids.set(v, randomUUID());
        return ids.get(v);
      }
      return v;
    },
  );
  if (broken)
    plan.packages.at(-1).rows.question_answer_keys[0].explanation = "";
  for (const p of plan.packages) {
    p.course_key += "-" + suffix;
    p.mapping_sha256 = digest(p.rows);
  }
  return plan;
}
test("publication validates existing drafts, rolls back, rejects drift/new revisions/hidden roots, and is idempotent", async () => {
  const sql = database(localStatus().DB_URL),
    actor = readLocal("bootstrap.json").admin.id;
  const rollback = new Error("ROLLBACK_TEST");
  const plan = fixture(),
    outside = compileImportPlan(loadTechnicalMaterials().results);
  try {
    await assert.rejects(
      sql.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
        await insertDrafts(tx, plan, actor, await inspectImport(tx, plan));
        const db = { begin: (fn) => tx.savepoint(fn) };
        const fingerprint = async (p) =>
          digest((await inspectPublication(tx, p)).map((e) => e.rows));
        const before = await fingerprint(plan),
          other = await fingerprint(outside);
        await executePublication(db, plan, actor, { mode: "verify" });
        assert.equal(
          await fingerprint(plan),
          before,
          "verify must undo timestamps, versions and publication",
        );
        const p = plan.packages[0],
          lesson = p.rows.lessons[0],
          rev = p.rows.lesson_revisions[0];
        await assert.rejects(
          tx.savepoint(async (sp) => {
            await sp`UPDATE content.courses SET status='hidden' WHERE id=${p.course_id}`;
            await executePublication(
              { begin: (fn) => sp.savepoint(fn) },
              plan,
              actor,
            );
          }),
          /UNEXPECTED_STATUS/,
        );
        await assert.rejects(
          tx.savepoint(async (sp) => {
            await sp`UPDATE content.lesson_revisions SET title='Editor change' WHERE id=${rev.id}`;
            await executePublication(
              { begin: (fn) => sp.savepoint(fn) },
              plan,
              actor,
            );
          }),
          /DB_DRIFT/,
        );
        await assert.rejects(
          tx.savepoint(async (sp) => {
            await sp`UPDATE content.lesson_revisions SET published_at=clock_timestamp() WHERE id=${rev.id}`;
            await sp`INSERT INTO content.lesson_revisions(id,lesson_id,revision_no,title,objectives,blocks,created_by) VALUES(${randomUUID()},${lesson.id},2,'New draft','New',${sp.json(rev.blocks)},${actor})`;
            await executePublication(
              { begin: (fn) => sp.savepoint(fn) },
              plan,
              actor,
            );
          }),
          /DB_DRIFT/,
        );
        const opts = {
          mode: "apply",
          expectedHash: publicationPlan(plan).sha256,
        };
        await executePublication(db, plan, actor, opts);
        const published = await fingerprint(plan);
        const count =
          await tx`SELECT count(*)::int AS n FROM content.audit_events`;
        const repeat = await executePublication(db, plan, actor, opts);
        assert(repeat.courses.every((c) => c.action === "already-published"));
        assert.equal(await fingerprint(plan), published);
        assert.deepEqual(
          await tx`SELECT count(*)::int AS n FROM content.audit_events`,
          count,
        );
        assert.equal(
          await fingerprint(outside),
          other,
          "real imported courses must stay unchanged",
        );
        throw rollback;
      }),
      (e) => e === rollback,
    );
    assert.equal(
      (
        await sql`SELECT id FROM content.courses WHERE id=${plan.packages[0].course_id}`
      ).length,
      0,
    );
    const broken = fixture(true);
    await assert.rejects(
      sql.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
        await insertDrafts(tx, broken, actor, await inspectImport(tx, broken));
        await tx`SET CONSTRAINTS ALL DEFERRED`;
        await assert.rejects(
          executePublication(
            { begin: (fn) => tx.savepoint(fn) },
            broken,
            actor,
            { mode: "apply", expectedHash: publicationPlan(broken).sha256 },
          ),
          /question_missing_answer_or_text/,
        );
        assert(
          (await inspectPublication(tx, broken)).every((e) => !e.published),
          "failure in last course must roll back every course",
        );
        throw rollback;
      }),
      (e) => e === rollback,
    );
  } finally {
    await sql.end();
  }
});
