import test from 'node:test';
import assert from 'node:assert/strict';
import { loadToeicCatalog } from '../scripts/render-toeic-materials.mjs';
import { compileToeicImportPlan } from '../scripts/toeic-import-plan.mjs';
import { stableId } from '../scripts/materials-import-plan.mjs';
import { main } from '../scripts/import-toeic-materials.mjs';

const sources=loadToeicCatalog();
const plan=compileToeicImportPlan(sources);
test('TOEIC import keeps both bands, all questions, and draft roots',()=>{
  assert.equal(plan.counts.courses,2);
  assert.equal(plan.counts.topics,4);
  assert.equal(plan.counts.lessons,16);
  assert.equal(plan.counts.vocabulary_entries,128);
  assert.equal(plan.counts.questions,120);
  assert.equal(plan.counts.assessments,16);
  for(const p of plan.packages) {
    for(const table of ['courses','topics','lessons','assessments']) assert(p.rows[table].every(r=>r.status==='draft'));
    assert(p.rows.lessons.every(r=>!r.is_preview));
    assert(p.rows.question_revisions.every(r=>r.audio_asset_id===null));
  }
});
test('group order, shared passages and correct options survive the mapping',()=>{
  sources.forEach(({pack},pi)=>{
    const p=plan.packages[pi];
    for(const u of pack.units) for(const g of u.groups) {
      const mapped=p.groups.find(x=>x.key===g.key);
      assert.deepEqual(mapped.question_ids,g.items.map(q=>stableId('question',q.key)));
      assert(mapped.positions.every((v,i)=>i===0||v===mapped.positions[i-1]+1));
      for(const q of g.items) {
        const rid=stableId('question_revision',`${q.key}:1`);
        const row=p.rows.question_revisions.find(r=>r.id===rid);
        const answer=p.rows.question_answer_keys.find(r=>r.question_revision_id===rid);
        assert.equal(answer.correct_option_key,q.answer);
        const options=p.rows.question_options.filter(r=>r.question_revision_id===rid);
        assert.deepEqual(options.map(o=>o.text),q.options);
        for(const doc of g.documents??[]) assert(row.passage.includes(doc.body));
        for(const cells of g.graphic?.rows??[]) assert(row.passage.includes(cells.join(' | ')));
        assert(answer.explanation.includes(q.evidence));
      }
    }
  });
});
test('private listening scripts and photo briefs never enter lesson blocks or question passages',()=>{
  sources.forEach(({pack},pi)=>{
    const p=plan.packages[pi];
    const publicText=JSON.stringify([p.rows.lesson_revisions,p.rows.question_revisions]);
    for(const u of pack.units.filter(u=>u.part<=4)) for(const g of u.groups) {
      const secret=g.transcript??g.scene_brief;
      assert(!publicText.includes(JSON.stringify(secret).slice(1,-1)));
      for(const q of g.items) {
        const answer=p.rows.question_answer_keys.find(r=>r.question_revision_id===stableId('question_revision',`${q.key}:1`));
        assert(answer.transcript.includes(secret));
        assert(!publicText.includes(JSON.stringify(q.explanation).slice(1,-1)));
      }
    }
  });
});
test('wrong hash and ambiguous arguments are rejected before DB access',async()=>{
  await assert.rejects(main(['--apply','--expect-hash','bad']),/hash mismatch/);
  await assert.rejects(main(['--dry-run','--apply']),/Unexpected arguments/);
});
