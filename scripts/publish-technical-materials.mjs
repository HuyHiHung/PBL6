import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  loadTechnicalMaterials,
  demoDirectory,
} from "./render-technical-materials.mjs";
import {
  compileImportPlan,
  digest,
  stableId,
} from "./materials-import-plan.mjs";
import { assertImportActor, inspectImport } from "./materials-import-db.mjs";
import { verifyAudit } from "./import-technical-materials.mjs";

const action = "materials.publish.technical.v1";
const revisionLinks = [
  ["question_revisions", "questions", "question_id"],
  ["lesson_revisions", "lessons", "lesson_id"],
  ["assessment_revisions", "assessments", "assessment_id"],
];
export function publicationPlan(plan) {
  const body = {
    version: 1,
    target: "pbl6-local",
    import_sha256: plan.plan_sha256,
    courses: plan.packages.map((p) => ({
      id: p.course_id,
      source_sha256: p.source_sha256,
      mapping_sha256: p.mapping_sha256,
    })),
    counts: plan.counts,
  };
  return { ...body, sha256: digest(body) };
}
// Select by ownership as well as IDs: a newer CMS revision/child must never be silently ignored.
async function scoped(tx, table, column, ids) {
  return tx.unsafe(
    `SELECT * FROM content.${table} WHERE ${column} IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid) ORDER BY id FOR UPDATE`,
    [tx.json(ids)],
  );
}
function exact(rows, wanted, label) {
  assert.deepEqual(
    rows.map((r) => r.id).sort(),
    wanted.map((r) => r.id).sort(),
    `DB_DRIFT: ${label}`,
  );
}
export async function inspectPublication(tx, plan) {
  const imported = await inspectImport(tx, plan);
  assert(
    imported.every((s) => s.action === "skip-identical"),
    "IMPORT_REQUIRED",
  );
  const inventory = [];
  for (const p of plan.packages) {
    const r = p.rows,
      rows = {};
    rows.courses = await scoped(tx, "courses", "id", [p.course_id]);
    rows.topics = await scoped(tx, "topics", "course_id", [p.course_id]);
    rows.lessons = await scoped(
      tx,
      "lessons",
      "topic_id",
      r.topics.map((t) => t.id),
    );
    rows.questions = await scoped(
      tx,
      "questions",
      "lesson_id",
      r.lessons.map((l) => l.id),
    );
    rows.assessments = [
      ...(await scoped(
        tx,
        "assessments",
        "lesson_id",
        r.lessons.map((l) => l.id),
      )),
      ...(await scoped(
        tx,
        "assessments",
        "topic_id",
        r.topics.map((t) => t.id),
      )),
    ];
    rows.vocabulary_entries = await scoped(
      tx,
      "vocabulary_entries",
      "id",
      r.vocabulary_entries.map((v) => v.id),
    );
    for (const [table, parent, column] of revisionLinks)
      rows[table] = await scoped(
        tx,
        table,
        column,
        r[parent].map((v) => v.id),
      );
    for (const [table, found] of Object.entries(rows))
      exact(found, r[table], `${p.slug}/${table}`);
    for (const table of ["questions", "vocabulary_entries"])
      assert(
        rows[table].every((v) => v.status === "active"),
        `UNEXPECTED_STATUS: ${p.slug}/${table}`,
      );
    for (const table of ["courses", "topics", "lessons", "assessments"]) {
      for (const root of rows[table]) {
        assert(
          ["draft", "published"].includes(root.status),
          `UNEXPECTED_STATUS: ${p.slug}/${table}`,
        );
        if (table === "lessons" || table === "assessments") {
          const revisions =
            rows[
              table === "lessons" ? "lesson_revisions" : "assessment_revisions"
            ];
          const rev = revisions.find(
            (v) =>
              v[table === "lessons" ? "lesson_id" : "assessment_id"] ===
              root.id,
          );
          assert(
            root.status === "draft"
              ? !root.published_revision_id && !rev.published_at
              : root.published_revision_id === rev.id && !!rev.published_at,
            `REVISION_CONFLICT: ${root.id}`,
          );
        }
      }
    }
    const published =
      ["courses", "topics", "lessons", "assessments"].every((t) =>
        rows[t].every((v) => v.status === "published"),
      ) && revisionLinks.every(([t]) => rows[t].every((v) => v.published_at));
    const receiptId = stableId("publication_receipt", p.course_key);
    const [receipt] =
      await tx`SELECT action,entity_id,changes FROM content.audit_events WHERE id=${receiptId}`;
    if (receipt)
      assert(
        receipt.action === action &&
          receipt.entity_id === p.course_id &&
          receipt.changes.mapping_sha256 === p.mapping_sha256 &&
          receipt.changes.source_sha256 === p.source_sha256,
        "PUBLICATION_RECEIPT_COLLISION",
      );
    if (receipt) assert(published, "PUBLICATION_STATE_CHANGED");
    inventory.push({ package: p, rows, published, receiptId });
  }
  return inventory;
}
export async function executePublication(
  sql,
  plan,
  actor,
  { mode = "verify", expectedHash } = {},
) {
  assert(["dry-run", "verify", "apply"].includes(mode), "INVALID_MODE");
  const manifest = publicationPlan(plan);
  if (mode === "apply")
    assert.equal(expectedHash, manifest.sha256, "PUBLICATION_HASH_MISMATCH");
  const rollback = new Error("EXPECTED_PUBLICATION_ROLLBACK");
  let result;
  try {
    await sql.begin(async (tx) => {
      await tx`SET LOCAL lock_timeout='10s'`;
      await tx`SET LOCAL statement_timeout='60s'`;
      await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
      await assertImportActor(tx, actor);
      const before = await inspectPublication(tx, plan);
      if (mode !== "dry-run") {
        for (const entry of before.filter((e) => !e.published)) {
          const p = entry.package;
          for (const [table] of revisionLinks)
            await tx.unsafe(
              `UPDATE content.${table} SET published_at=clock_timestamp() WHERE id IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid) AND published_at IS NULL`,
              [tx.json(p.rows[table].map((v) => v.id))],
            );
          for (const [table, revisions, parent] of [
            ["lessons", "lesson_revisions", "lesson_id"],
            ["assessments", "assessment_revisions", "assessment_id"],
          ]) {
            const pairs = p.rows[revisions].map((v) => ({
              id: v[parent],
              revision_id: v.id,
            }));
            await tx.unsafe(
              `UPDATE content.${table} t SET status='published',published_revision_id=p.revision_id FROM jsonb_to_recordset($1::jsonb) AS p(id uuid,revision_id uuid) WHERE t.id=p.id AND (t.status<>'published' OR t.published_revision_id IS DISTINCT FROM p.revision_id)`,
              [tx.json(pairs)],
            );
          }
          await tx`UPDATE content.topics SET status='published' WHERE id IN ${tx(p.rows.topics.map((t) => t.id))} AND status<>'published'`;
          await tx`UPDATE content.courses SET status='published' WHERE id=${p.course_id} AND status<>'published'`;
          await tx`INSERT INTO content.audit_events(id,actor_user_id,action,entity_type,entity_id,changes) VALUES(${entry.receiptId},${actor},${action},'course',${p.course_id},${tx.json({ publication_sha256: manifest.sha256, source_sha256: p.source_sha256, mapping_sha256: p.mapping_sha256, lesson_ids: p.rows.lessons.map((l) => l.id), assessment_ids: p.rows.assessments.map((a) => a.id), before: Object.fromEntries(["courses", "topics", "lessons", "assessments"].map((t) => [t, entry.rows[t].map((v) => ({ id: v.id, status: v.status, revision_id: v.published_revision_id ?? null }))])) })})`;
        }
        await tx`SET CONSTRAINTS ALL IMMEDIATE`;
        assert(
          (await inspectPublication(tx, plan)).every((e) => e.published),
          "PUBLICATION_INCOMPLETE",
        );
      }
      result = {
        mode,
        verified_at: new Date().toISOString(),
        publication_sha256: manifest.sha256,
        counts: manifest.counts,
        courses: before.map((e) => ({
          id: e.package.course_id,
          slug: e.package.slug,
          action: e.published ? "already-published" : "publish",
          before: e.rows.courses[0].status,
          after: mode === "apply" ? "published" : e.rows.courses[0].status,
          topic_ids: e.package.rows.topics.map((t) => t.id),
          lesson_ids: e.package.rows.lessons.map((l) => l.id),
          assessment_ids: e.package.rows.assessments.map((a) => a.id),
        })),
        committed: mode === "apply",
      };
      if (mode !== "apply") throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  return result;
}
export function parseArguments(args) {
  let mode = "dry-run",
    chosen = false,
    expectedHash;
  for (let i = 0; i < args.length; i++) {
    if (["--dry-run", "--verify-db", "--apply"].includes(args[i])) {
      assert(!chosen, "Choose exactly one mode");
      chosen = true;
      mode = {
        "--dry-run": "dry-run",
        "--verify-db": "verify",
        "--apply": "apply",
      }[args[i]];
    } else if (args[i] === "--expect-hash") {
      assert(
        !expectedHash && /^[a-f0-9]{64}$/.test(args[i + 1] ?? ""),
        "Expected SHA-256",
      );
      expectedHash = args[++i];
    } else throw new Error("Unknown publication argument");
  }
  assert(
    mode === "apply" ? !!expectedHash : !expectedHash,
    "--apply requires --expect-hash; other modes do not accept it",
  );
  return { mode, expectedHash };
}
export async function main(args = process.argv.slice(2)) {
  assert.equal(
    resolve(process.cwd()),
    resolve(fileURLToPath(new URL("../", import.meta.url))),
    "Run from the PBL6 repository root",
  );
  const options = parseArguments(args),
    { results } = loadTechnicalMaterials();
  const audit = JSON.parse(
    readFileSync(resolve(demoDirectory, "technical-audit.json"), "utf8"),
  );
  verifyAudit(results, audit);
  const plan = compileImportPlan(results);
  assert.equal(plan.plan_sha256, audit.plan_sha256, "IMPORT_PLAN_CHANGED");
  assert.equal(plan.packages.length, 5);
  for (const [key, n] of Object.entries({
    courses: 5,
    topics: 16,
    lessons: 36,
    assessments: 52,
    question_revisions: 340,
  }))
    assert.equal(plan.counts[key], n, `UNEXPECTED_SCOPE: ${key}`);
  if (options.mode === "apply")
    assert.equal(
      options.expectedHash,
      publicationPlan(plan).sha256,
      "PUBLICATION_HASH_MISMATCH",
    );
  const { localStatus, database, readLocal, writeLocal } =
    await import("./local-lib.mjs");
  const status = localStatus(),
    sql = database(status.DB_URL);
  try {
    const actor = readLocal("bootstrap.json").admin?.id;
    assert(actor, "Local bootstrap admin is required");
    const result = await executePublication(sql, plan, actor, options);
    if (options.mode === "apply") {
      writeLocal("technical-publication-" + Date.now() + ".json", result);
      writeLocal("technical-publication-result.json", result);
    }
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await sql.end();
  }
}
if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
)
  main().catch((e) => {
    console.error(e.code ? `${e.code}: ${e.message}` : e.message);
    process.exitCode = 1;
  });
