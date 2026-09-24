import test from "node:test";
import assert from "node:assert/strict";
import {
  parseArguments,
  publicationPlan,
  executePublication,
} from "../scripts/publish-technical-materials.mjs";
import { loadTechnicalMaterials } from "../scripts/render-technical-materials.mjs";
import { compileImportPlan } from "../scripts/materials-import-plan.mjs";
const plan = compileImportPlan(loadTechnicalMaterials().results);
test("publication has the precise technical scope and a deterministic hash", () => {
  const p = publicationPlan(plan);
  assert.equal(p.courses.length, 5);
  assert.equal(p.counts.lessons, 36);
  assert.equal(p.counts.topics, 16);
  assert.equal(p.counts.assessments, 52);
  assert.equal(p.counts.question_revisions, 340);
  assert.deepEqual(p, publicationPlan(structuredClone(plan)));
  const changed = structuredClone(plan);
  changed.packages[0].mapping_sha256 = "changed";
  assert.notEqual(publicationPlan(changed).sha256, p.sha256);
});
test("ambiguous modes and missing hashes fail; a wrong hash never accesses the DB", async () => {
  assert.deepEqual(parseArguments([]), {
    mode: "dry-run",
    expectedHash: undefined,
  });
  for (const args of [
    ["--apply"],
    ["--apply", "--verify-db"],
    ["--dry-run", "--expect-hash", "a".repeat(64)],
    ["--unknown"],
  ])
    assert.throws(() => parseArguments(args));
  await assert.rejects(
    executePublication(
      {
        begin() {
          throw new Error("DATABASE_ACCESSED");
        },
      },
      plan,
      "admin",
      { mode: "apply", expectedHash: "0".repeat(64) },
    ),
    /PUBLICATION_HASH_MISMATCH/,
  );
});
