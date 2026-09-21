import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadToeicMaterials, loadToeicCatalog } from '../scripts/render-toeic-materials.mjs';
import { validateToeic, renderToeic } from '../scripts/toeic-materials-lib.mjs';

for (const { slug, pack } of loadToeicCatalog()) describe(slug, () => {
const fixture = () => structuredClone(pack);

test('TOEIC foundation preserves grouped questions and reports media gaps separately', () => {
  const stats = validateToeic(pack);
  assert.equal(stats.questions, 60);
  assert.equal(stats.reading_questions, 36);
  assert.equal(stats.listening_script_questions, 24);
  assert.equal(stats.unique_vocabulary, 64);
  assert.equal(stats.photo_briefs, 3);
  assert.deepEqual(stats.by_part, { 1:3, 2:9, 3:6, 4:6, 5:12, 6:8, 7:16 });
});

test('learner copy retains Reading but excludes answers and all listening source material', () => {
  const learner = renderToeic(pack);
  assert(!learner.includes('**Đáp án:'));
  assert(!learner.includes('**Bằng chứng/cấu trúc:'));
  for (const unit of pack.units) for (const group of unit.groups) {
    if (group.transcript) assert(!learner.includes(group.transcript));
    if (group.scene_brief) assert(!learner.includes(group.scene_brief));
    for (const item of group.items) {
      assert(!learner.includes(item.explanation), item.key);
      if (unit.part >= 5) assert(learner.includes(item.key), item.key);
      else assert(!learner.includes(item.key), item.key);
    }
  }
});

test('review copy retains evidence, correct answers and all source documents', () => {
  const review = renderToeic(pack, { reviewer:true });
  for (const unit of pack.units) for (const group of unit.groups) {
    for (const doc of group.documents ?? []) assert(review.includes(doc.body));
    for (const line of (group.transcript ?? '').split('\n').filter(Boolean)) assert(review.includes(line));
    for (const item of group.items) {
      assert(review.includes(`**Đáp án: ${item.answer}.** ${item.explanation}`));
      assert(review.includes(item.evidence));
    }
  }
  assert.equal(readFileSync(new URL(`../content/demo/${slug}.md`, import.meta.url), 'utf8'), renderToeic(pack));
  assert.equal(readFileSync(new URL(`../content/demo/${slug}-review.md`, import.meta.url), 'utf8'), review);
});

test('wrong option counts, keys and unsupported media readiness are rejected', () => {
  const a = fixture(); a.units[1].groups[0].items[0].options.push('Another response.');
  assert.throws(() => validateToeic(a), /Wrong option count/);
  const b = fixture(); b.units[2].groups[0].items[0].answer = 'Z';
  assert.throws(() => validateToeic(b), /Invalid answer key/);
  const c = fixture(); c.units[1].groups[0].delivery_status = 'text_ready';
  assert.throws(() => validateToeic(c), /Media readiness mismatch/);
  const d = fixture(); d.units[1].groups[0].transcript = '';
  assert.throws(() => validateToeic(d), /listening transcript/);
  const e = fixture(); e.units[0].groups[1].items[0].key = e.units[0].groups[0].items[0].key;
  assert.throws(() => validateToeic(e), /Duplicate key/);
});

test('missing group questions, documents and mismatched Part 6 blanks fail closed', () => {
  const a = fixture(); a.units[2].groups[0].items.pop();
  assert.throws(() => validateToeic(a), /Wrong question group size/);
  const b = fixture(); b.units[7].groups[1].documents.pop();
  assert.throws(() => validateToeic(b), /Wrong document count/);
  const c = fixture(); c.units[5].groups[0].documents[0].body += ' [1]';
  assert.throws(() => validateToeic(c), /blanks must occur once/);
  const d = fixture(); d.units[5].groups[0].items[0].prompt = 'Choose the word for [3].';
  assert.throws(() => validateToeic(d), /wrong text-completion blank/);
});
});

test('two study bands use disjoint entity keys and different question content', () => {
  const results = loadToeicCatalog();
  assert.deepEqual(results.map(r => r.pack.band), [{min:500,max:700},{min:700,max:990}]);
  const keys = new Set();
  results.forEach(r => validateToeic(r.pack, keys));
  const itemSignatures = p => p.units.flatMap(u => u.groups.flatMap(g => g.items.map(i => JSON.stringify([i.prompt, [...i.options].sort()]))));
  const lower = new Set(itemSignatures(results[0].pack));
  assert(itemSignatures(results[1].pack).every(s => !lower.has(s)));
  const collision = structuredClone(results[1].pack);
  collision.units[0].groups[0].items[0].key = results[0].pack.units[0].groups[0].items[0].key;
  const otherKeys = new Set(); validateToeic(results[0].pack, otherKeys);
  assert.throws(() => validateToeic(collision, otherKeys), /Duplicate key/);
  assert.throws(() => loadToeicMaterials('../other'), /Unsupported TOEIC study band/);
});

test('advanced graphic tables retain every cell and reject broken row widths', () => {
  const {pack} = loadToeicMaterials('700-990');
  const groups = pack.units.flatMap(u => u.groups).filter(g => g.graphic);
  assert.equal(groups.length, 2);
  const review = renderToeic(pack, {reviewer:true});
  for (const {graphic} of groups) {
    assert(review.includes(graphic.title));
    for (const row of graphic.rows) assert(review.includes(`| ${row.join(' | ')} |`));
  }
  const broken = structuredClone(pack);
  broken.units[2].groups[1].graphic.rows[0].pop();
  assert.throws(() => validateToeic(broken), /Graphic row width mismatch/);
});
