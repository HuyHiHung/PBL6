// Explicit local-only integration test. Every insertion uses random UUIDs and rolls back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadTechnicalMaterials } from '../scripts/render-technical-materials.mjs';
import { compileImportPlan, digest } from '../scripts/materials-import-plan.mjs';
import { assertImportActor, inspectImport, insertDrafts, verifyPublication } from '../scripts/materials-import-db.mjs';
import { localStatus, database, readLocal } from '../scripts/local-lib.mjs';

test('local DB: collisions, rerun, changed source, CMS drift, publication rules and rollback',async()=>{
  const status=localStatus(), sql=database(status.DB_URL);
  const actor=readLocal('bootstrap.json').admin?.id;
  const {results}=loadTechnicalMaterials();
  const replacements=new Map();
  const plan=JSON.parse(JSON.stringify(compileImportPlan(results)),(_key,value)=>{
    if(typeof value==='string' && /^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value)) {
      if(!replacements.has(value)) replacements.set(value,randomUUID());
      return replacements.get(value);
    }
    return value;
  });
  for(const p of plan.packages) p.mapping_sha256=digest(p.rows);
  const rollback=new Error('EXPECTED_TEST_ROLLBACK');
  let verified=false;
  try {
    await sql.begin(async tx=>{
      await tx`SET LOCAL lock_timeout='10s'`;
      await tx`SET LOCAL statement_timeout='60s'`;
      await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
      await assertImportActor(tx,actor);
      const state=await inspectImport(tx,plan);
      assert(state.every(s=>s.action==='create-draft'));
      // An unrelated row using a mapped UUID must never be adopted or overwritten.
      await assert.rejects(tx.savepoint(async sp=>{
        await sp`INSERT INTO content.courses(id,title,level,position) VALUES(${plan.packages[0].course_id},'Collision fixture','A1',900)`;
        await inspectImport(sp,plan);
      }),/ID_COLLISION/);
      await insertDrafts(tx,plan,actor,state);
      await tx`SET CONSTRAINTS ALL IMMEDIATE`;
      assert((await inspectImport(tx,plan)).every(s=>s.action==='skip-identical'));
      const changed=structuredClone(plan); changed.packages[0].source_sha256='0'.repeat(64);
      await assert.rejects(inspectImport(tx,changed),/SOURCE_CHANGED/);
      await assert.rejects(tx.savepoint(async sp=>{
        const option=plan.packages[0].rows.question_options[0];
        await sp`UPDATE content.question_options SET text='CMS edit during test' WHERE question_revision_id=${option.question_revision_id} AND option_key=${option.option_key}`;
        await inspectImport(sp,plan);
      }),/DB_DRIFT/);
      // Draft validation alone is insufficient: force actual publication validation.
      await assert.rejects(tx.savepoint(async sp=>{
        await sp`SET CONSTRAINTS ALL DEFERRED`;
        const question=plan.packages[0].rows.question_answer_keys[0];
        await sp`UPDATE content.question_answer_keys SET explanation='' WHERE question_revision_id=${question.question_revision_id}`;
        await verifyPublication(sp,plan,state);
      }),/question_missing_answer_or_text/);
      await tx`SET CONSTRAINTS ALL DEFERRED`;
      await verifyPublication(tx,plan,state);
      assert((await inspectImport(tx,plan)).every(s=>s.action==='skip-identical'),'CMS publication must not trigger reimport or reset status');
      verified=true;
      throw rollback;
    });
  } catch(error) { if(error!==rollback) throw error; }
  finally {
    try {
      assert((await inspectImport(sql,plan)).every(s=>s.action==='create-draft'),'Test records or receipts survived rollback');
    } finally { await sql.end(); }
  }
  assert(verified);
});
