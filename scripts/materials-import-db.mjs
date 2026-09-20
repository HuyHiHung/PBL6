import assert from 'node:assert/strict';
import { canonical, tableKeys } from './materials-import-plan.mjs';

const revisionTables=new Set(['lesson_revisions','question_revisions','assessment_revisions']);
const receiptAction='materials.import.draft.v1';
function rowKey(table,row) { return tableKeys[table].map(k=>row[k]).join(':'); }

export async function assertImportActor(tx,actorId) {
  const [actor]=await tx`SELECT role,status FROM identity.profiles WHERE user_id=${actorId}`;
  assert(actor?.role==='admin' && actor.status==='active','An active local admin is required; run db:bootstrap first');
}

export async function inspectImport(tx,plan) {
  const state=[];
  for(const item of plan.packages) {
    const [receipt]=await tx`SELECT action,entity_id,changes FROM content.audit_events WHERE id=${item.receipt_id}`;
    if(receipt) {
      assert(receipt.action===receiptAction && receipt.entity_id===item.course_id,'IMPORT_RECEIPT_COLLISION');
      assert(receipt.changes.importer_version===plan.importer_version && receipt.changes.source_sha256===item.source_sha256 && receipt.changes.mapping_sha256===item.mapping_sha256,`SOURCE_CHANGED: ${item.slug}; existing import is preserved. Use CMS revisions for updates.`);
    }
    for(const table of Object.keys(tableKeys)) {
      const wanted=item.rows[table];
      if(!wanted.length) continue;
      const scopeColumn=tableKeys[table][0];
      const scope=[...new Set(wanted.map(r=>r[scopeColumn]))];
      // Identifier strings are fixed by tableKeys, never input content.
      const found=await tx.unsafe(`SELECT to_jsonb(r) AS row FROM content.${table} r WHERE ${scopeColumn} IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid)`,[tx.json(scope)]);
      if(!receipt) {
        assert.equal(found.length,0,`ID_COLLISION: ${item.slug}/${table}; rows exist without an import receipt`);
        continue;
      }
      assert.equal(found.length,wanted.length,`DB_DRIFT: ${item.slug}/${table}; missing or added rows`);
      const indexed=new Map(found.map(({row})=>[rowKey(table,row),row]));
      for(const expected of wanted) {
        const actual=indexed.get(rowKey(table,expected));
        assert(actual,`DB_DRIFT: missing ${table} row`);
        // Publication/hiding is a later CMS action. Never reset those states on rerun.
        const fields=Object.keys(expected).filter(k=>k!=='status');
        assert.equal(canonical(Object.fromEntries(fields.map(k=>[k,actual[k]]))),canonical(Object.fromEntries(fields.map(k=>[k,expected[k]]))),`DB_DRIFT: ${item.slug}/${table}; content was edited after import`);
      }
    }
    state.push({slug:item.slug,action:receipt?'skip-identical':'create-draft'});
  }
  return state;
}

export async function insertDrafts(tx,plan,actorId,state) {
  const create=new Set(state.filter(s=>s.action==='create-draft').map(s=>s.slug));
  for(const item of plan.packages.filter(p=>create.has(p.slug))) {
    for(const table of Object.keys(tableKeys)) {
      const rows=item.rows[table].map(r=>revisionTables.has(table)?{...r,created_by:actorId}:r);
      if(!rows.length) continue;
      const columns=Object.keys(rows[0]);
      const names=columns.map(c=>`"${c}"`).join(',');
      // PostgreSQL's table type converts JSON to uuid/jsonb/text[] without string-built values.
      await tx.unsafe(`INSERT INTO content.${table} (${names}) SELECT ${names} FROM jsonb_populate_recordset(NULL::content.${table},$1::jsonb)`,[tx.json(rows)]);
    }
    await tx`INSERT INTO content.audit_events(id,actor_user_id,action,entity_type,entity_id,changes)
      VALUES(${item.receipt_id},${actorId},${receiptAction},'course',${item.course_id},${tx.json({importer_version:plan.importer_version,source_key:item.course_key,source_sha256:item.source_sha256,mapping_sha256:item.mapping_sha256,mode:'draft-only'})})`;
  }
}

// Only called inside a transaction that is ALWAYS rolled back. This exercises the
// actual deferred publication validators, which intentionally ignore draft rows.
export async function verifyPublication(tx,plan,state) {
  const created=new Set(state.filter(s=>s.action==='create-draft').map(s=>s.slug));
  for(const item of plan.packages.filter(p=>created.has(p.slug))) {
    for(const table of ['question_revisions','assessment_revisions','lesson_revisions']) {
      await tx.unsafe(`UPDATE content.${table} SET published_at=clock_timestamp() WHERE id IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid)`,[tx.json(item.rows[table].map(r=>r.id))]);
    }
    for(const [table,revisionTable,parent] of [['assessments','assessment_revisions','assessment_id'],['lessons','lesson_revisions','lesson_id']]) {
      const pairs=item.rows[revisionTable].map(r=>({id:r[parent],revision_id:r.id}));
      await tx.unsafe(`UPDATE content.${table} t SET status='published',published_revision_id=p.revision_id FROM jsonb_to_recordset($1::jsonb) AS p(id uuid,revision_id uuid) WHERE t.id=p.id`,[tx.json(pairs)]);
    }
    await tx.unsafe(`UPDATE content.topics SET status='published' WHERE id IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid)`,[tx.json(item.rows.topics.map(t=>t.id))]);
    await tx`UPDATE content.courses SET status='published' WHERE id=${item.course_id}`;
  }
  await tx`SET CONSTRAINTS ALL IMMEDIATE`;
}

export async function executeImport(sql,plan,actorId,{verifyOnly=false}={}) {
  const rollback=new Error('EXPECTED_IMPORT_VERIFICATION_ROLLBACK');
  let result;
  try {
    await sql.begin(async tx=>{
      await tx`SET LOCAL lock_timeout='10s'`;
      await tx`SET LOCAL statement_timeout='60s'`;
      await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
      await assertImportActor(tx,actorId);
      const state=await inspectImport(tx,plan); // Check all courses before inserting any.
      await insertDrafts(tx,plan,actorId,state);
      await tx`SET CONSTRAINTS ALL IMMEDIATE`;
      const rerun=await inspectImport(tx,plan);
      assert(rerun.every(s=>s.action==='skip-identical'),'Idempotency verification failed');
      if(verifyOnly) {
        await tx`SET CONSTRAINTS ALL DEFERRED`;
        await verifyPublication(tx,plan,state);
      }
      result={mode:verifyOnly?'verified-and-rolled-back':'drafts-imported',state};
      if(verifyOnly) throw rollback;
    });
  } catch(error) { if(error!==rollback) throw error; }
  return result;
}
