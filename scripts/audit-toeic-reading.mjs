import assert from 'node:assert/strict';
import { compileToeicImportPlan } from './toeic-import-plan.mjs';
import { inspectImport } from './materials-import-db.mjs';
import { digest, tableKeys } from './materials-import-plan.mjs';
import { localStatus, database, writeLocal } from './local-lib.mjs';

const plan=compileToeicImportPlan();
const sql=database(localStatus().DB_URL);
async function fingerprint() {
  const snapshot={};
  for(const table of Object.keys(tableKeys)) {
    const column=tableKeys[table][0];
    const ids=[...new Set(plan.packages.flatMap(p=>p.rows[table].map(r=>r[column])))];
    snapshot[table]=Array.from(await sql.unsafe(`SELECT to_jsonb(r) AS row FROM content.${table} r WHERE ${column} IN (SELECT jsonb_array_elements_text($1::jsonb)::uuid) ORDER BY to_jsonb(r)::text`,[sql.json(ids)]));
  }
  return digest(snapshot);
}
try {
  const sourceComparison=await inspectImport(sql,plan);
  assert(sourceComparison.every(r=>r.action==='skip-identical'),'Imported content differs from source or is missing');
  const before=await fingerprint();
  const courseIds=plan.packages.map(p=>p.course_id);
  const lessons=await sql`SELECT c.title AS course,t.id AS topic_id,c.id AS course_id,l.id AS lesson_id,l.status,
    lr.id AS lesson_revision_id,lr.title,lr.published_at,
    a.id AS assessment_id,ar.id AS assessment_revision_id,
    (SELECT count(*)::int FROM content.assessment_revision_questions aq WHERE aq.assessment_revision_id=ar.id) AS questions
    FROM content.courses c JOIN content.topics t ON t.course_id=c.id
    JOIN content.lessons l ON l.topic_id=t.id
    JOIN LATERAL (SELECT * FROM content.lesson_revisions WHERE lesson_id=l.id ORDER BY revision_no DESC LIMIT 1) lr ON true
    JOIN content.assessments a ON a.lesson_id=l.id AND a.kind='quiz'
    JOIN LATERAL (SELECT * FROM content.assessment_revisions WHERE assessment_id=a.id ORDER BY revision_no DESC LIMIT 1) ar ON true
    WHERE c.id IN ${sql(courseIds)} AND t.title='Reading' ORDER BY c.position,l.position`;
  assert.equal(lessons.length,8,'Expected eight imported Reading lessons');
  const results=[];
  for(const l of lessons) {
    assert(l.status==='draft' && l.published_at===null,'Audit expects current draft content; inspect changed publication state first');
    const rollback=new Error('SUCCESS_ROLLBACK');
    let result={course:l.course,title:l.title,questions:l.questions,lesson_id:l.lesson_id,assessment_id:l.assessment_id};
    try {
      await sql.begin(async tx=>{
        await tx`SET LOCAL lock_timeout='10s'`;
        await tx`SET LOCAL statement_timeout='30s'`;
        await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
        await tx`SET CONSTRAINTS ALL DEFERRED`;
        await tx`UPDATE content.question_revisions SET published_at=clock_timestamp() WHERE id IN
          (SELECT question_revision_id FROM content.assessment_revision_questions WHERE assessment_revision_id=${l.assessment_revision_id})`;
        await tx`UPDATE content.assessment_revisions SET published_at=clock_timestamp() WHERE id=${l.assessment_revision_id}`;
        await tx`UPDATE content.assessments SET status='published',published_revision_id=${l.assessment_revision_id} WHERE id=${l.assessment_id}`;
        await tx`UPDATE content.lesson_revisions SET published_at=clock_timestamp() WHERE id=${l.lesson_revision_id}`;
        await tx`UPDATE content.lessons SET status='published',published_revision_id=${l.lesson_revision_id} WHERE id=${l.lesson_id}`;
        await tx`UPDATE content.topics SET status='published' WHERE id=${l.topic_id}`;
        await tx`UPDATE content.courses SET status='published' WHERE id=${l.course_id}`;
        await tx`SET CONSTRAINTS ALL IMMEDIATE`;
        throw rollback;
      });
    } catch(error) {
      if(error===rollback) result={...result,publication_check:'passed_rolled_back'};
      else if(error.code==='23514') result={...result,publication_check:'blocked_rolled_back',reason:error.message};
      else throw error;
    }
    results.push(result);
  }
  const after=await fingerprint();
  assert.equal(after,before,'Database changed during the audit; inspect concurrent edits before reporting');
  const report={checked_at:new Date().toISOString(),target:'pbl6-local',sourceComparison,unchanged_after_rollback:true,results};
  writeLocal('toeic-reading-readiness.json',report);
  console.log(JSON.stringify(report,null,2));
} finally { await sql.end(); }
