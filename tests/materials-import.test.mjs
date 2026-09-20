import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadTechnicalMaterials, demoDirectory } from '../scripts/render-technical-materials.mjs';
import { compileImportPlan, stableId, digest } from '../scripts/materials-import-plan.mjs';
import { verifyAudit, main } from '../scripts/import-technical-materials.mjs';

const {results}=loadTechnicalMaterials();
const audit=JSON.parse(readFileSync(path.join(demoDirectory,'technical-audit.json'),'utf8'));
const plan=compileImportPlan(results);

test('the audited snapshot matches all five packs and the concrete import plan',()=>{
  verifyAudit(results,audit);
  assert.equal(plan.plan_sha256,audit.plan_sha256);
  assert.deepEqual(plan.counts,audit.counts);
  assert.equal(plan.counts.assessments,52);
  assert.equal(plan.counts.questions,340);
  assert.equal(plan.counts.question_options,612);
});

test('keys map to stable UUIDs when questions or vocabulary are reordered',()=>{
  const reordered=structuredClone(results);
  const lesson=reordered[0].pack.course.topics[0].lessons[0];
  lesson.quiz.reverse(); lesson.vocabulary.reverse();
  const other=compileImportPlan(reordered);
  const ids=p=>Object.fromEntries(p.packages[0].keys.map(k=>[`${k.kind}:${k.key}`,k.id]));
  assert.deepEqual(ids(other),ids(plan));
  assert.notEqual(other.plan_sha256,plan.plan_sha256,'Ordering changes should still require a new audit');
  assert.match(stableId('lesson','example'),/^[a-f0-9]{8}-[a-f0-9]{4}-5[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});

test('contextual passages and source lessons survive mapping; test and quiz question IDs are distinct',()=>{
  for(const [i,item] of plan.packages.entries()) {
    const source=results[i].pack.course;
    for(const topic of source.topics) {
      for(const [qs,passage,owner] of [[topic.test,topic.test_passage,null],...topic.lessons.map(l=>[l.quiz,l.reading,l.key])]) {
        for(const q of qs) {
          const revision=item.rows.question_revisions.find(r=>r.id===stableId('question_revision',`${q.key}:1`));
          const root=item.rows.questions.find(r=>r.id===revision.question_id);
          assert.equal(revision.passage,q.use_reading?passage:null);
          assert.equal(root.lesson_id,stableId('lesson',owner??q.lesson_key));
          const key=item.rows.question_answer_keys.find(k=>k.question_revision_id===revision.id);
          assert.equal(key.explanation,q.explanation);
          if(q.type==='single_choice') {
            const option=item.rows.question_options.find(o=>o.question_revision_id===revision.id && o.option_key===key.correct_option_key);
            assert.equal(option.text,q.options[q.answer.charCodeAt(0)-65]);
          } else assert.deepEqual(key.accepted_answers,q.answers);
        }
      }
    }
    assert.equal(new Set(item.rows.questions.map(q=>q.id)).size,item.rows.questions.length);
  }
});

test('lesson blocks use existing API types and carry bilingual vocabulary without assessment answer keys',()=>{
  for(const item of plan.packages) {
    assert(item.rows.courses.every(r=>r.status==='draft'));
    assert(item.rows.lessons.every(r=>r.status==='draft' && !r.is_preview));
    assert(item.rows.assessments.every(r=>r.status==='draft'));
    for(const revision of item.rows.lesson_revisions) {
      assert(revision.blocks.length<=100);
      assert(revision.blocks.every(b=>['text','grammar','reading','vocabulary'].includes(b.type)));
      const serialized=JSON.stringify(revision.blocks);
      assert(!serialized.includes('correct_option_key') && !serialized.includes('accepted_answers'));
      for(const id of revision.blocks.find(b=>b.type==='vocabulary').vocabulary_ids) {
        const snapshot=item.rows.lesson_revision_vocabulary.find(v=>v.lesson_revision_id===revision.id && v.vocabulary_id===id);
        assert(snapshot && snapshot.snapshot.example.includes('\n'));
        assert.equal(snapshot.snapshot.audio_asset_id,null);
      }
    }
  }
});

test('a changed answer or passage invalidates the content audit',()=>{
  const changed=structuredClone(results);
  changed[0].pack.course.topics[0].lessons[0].reading+=' Changed.';
  assert.throws(()=>verifyAudit(changed,audit),/AUDIT_STALE/);
  assert.notEqual(digest(changed[0].pack),audit.sources[changed[0].profile.slug].sha256);
});

test('apply cannot run without the exact reviewed hash, and ambiguous modes are rejected before DB access',async()=>{
  await assert.rejects(main(['--apply']),/requires --expect-hash/);
  await assert.rejects(main(['--apply','--expect-hash','0'.repeat(64)]),/requires --expect-hash/);
  await assert.rejects(main(['--dry-run','--verify-db']),/exactly one mode/);
  await assert.rejects(main(['--publish']),/Usage/);
});
