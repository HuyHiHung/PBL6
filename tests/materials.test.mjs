import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validatePack, validateCatalog, renderPack, renderCatalog } from '../scripts/materials-lib.mjs';
import { loadTechnicalMaterials, outputMaterials, demoDirectory } from '../scripts/render-technical-materials.mjs';

const {catalog,results} = loadTechnicalMaterials();
const fixture = () => structuredClone(results.find(r=>r.profile.slug==='english-data-ai'));

test('five technical packs meet the agreed demo size and share no entity keys', () => {
  assert.equal(results.length,5);
  const totals=results.reduce((s,r)=>{
    for(const k of Object.keys(s)) s[k]+=r.stats[k];
    return s;
  },{topics:0,lessons:0,vocabulary_entries:0,questions:0,minutes:0});
  assert.deepEqual(totals,{topics:16,lessons:36,vocabulary_entries:294,questions:340,minutes:880});
  // Load uses one key set across every course, topic and lesson.
  const keys=new Set();
  validatePack(results[0].pack,results[0].profile,keys);
  assert.throws(()=>validatePack(results[0].pack,results[0].profile,keys),/Duplicate key/);
});

test('revisiting vocabulary in another lesson is allowed; duplicates inside a lesson are rejected', () => {
  const {pack,profile}=fixture();
  const [a,b]=pack.course.topics[0].lessons;
  b.vocabulary[0]={...structuredClone(a.vocabulary[0]),key:b.vocabulary[0].key};
  const stats=validatePack(pack,profile);
  assert.equal(stats.vocabulary_entries,48);
  assert.equal(stats.unique_vocabulary,47);
  b.vocabulary[1]={...structuredClone(b.vocabulary[0]),key:b.vocabulary[1].key};
  assert.throws(()=>validatePack(pack,profile),/duplicate vocabulary within lesson/);
});

test('topic questions must reference a lesson in their own topic', () => {
  const {pack,profile}=fixture();
  pack.course.topics[0].test[0].lesson_key=pack.course.topics[1].lessons[0].key;
  assert.throws(()=>validatePack(pack,profile),/invalid lesson reference/);
});

test('reading passages and new-course dialogues cannot silently disappear', () => {
  const a=fixture();
  a.pack.course.topics[0].test_passage='';
  assert.throws(()=>validatePack(a.pack,a.profile),/missing test_passage/);
  const b=fixture();
  delete b.pack.course.topics[0].lessons[0].dialogue;
  assert.throws(()=>validatePack(b.pack,b.profile),/missing dialogue/);
  const c=fixture();
  c.pack.course.topics[0].lessons[0].reading='';
  assert.throws(()=>validatePack(c.pack,c.profile),/missing reading/);
});

test('invalid answer keys, duplicate choices and mixed answer types fail validation', () => {
  const a=fixture();
  a.pack.course.topics[0].lessons[0].quiz[0].answer='D';
  assert.throws(()=>validatePack(a.pack,a.profile),/invalid answer key/);
  const b=fixture();
  const q=b.pack.course.topics[0].lessons[0].quiz[0];
  q.options[1]=`  ${q.options[0].toUpperCase()}  `;
  assert.throws(()=>validatePack(b.pack,b.profile),/duplicate options/);
  const c=fixture();
  c.pack.course.topics[0].lessons[0].quiz[1].options=['wrong'];
  assert.throws(()=>validatePack(c.pack,c.profile),/mixed answer types/);
});

test('truncated assessments, wrong duration and unsafe catalog paths fail validation', () => {
  const a=fixture();
  a.pack.course.topics[0].test.pop();
  assert.throws(()=>validatePack(a.pack,a.profile),/expected ten test questions/);
  const b=fixture();
  b.pack.course.estimated_minutes++;
  assert.throws(()=>validatePack(b.pack,b.profile),/Course duration mismatch/);
  const c=structuredClone(catalog);
  c.courses[0].slug='../english-it';
  assert.throws(()=>validateCatalog(c),/Unsafe catalog slug/);
});

test('rendered Markdown is in sync, with every dialogue and explanation present', () => {
  for(const {pack,profile,stats} of results) {
    const rendered=renderPack(pack,stats);
    assert.equal(readFileSync(path.join(demoDirectory,`${profile.slug}.md`),'utf8'),rendered);
    for(const t of pack.course.topics) {
      for(const l of t.lessons) {
        if(l.dialogue) for(const line of l.dialogue.split('\n')) assert(rendered.includes(line));
        for(const q of l.quiz) assert(rendered.includes(q.explanation));
      }
      for(const q of t.test) assert(rendered.includes(q.explanation));
    }
  }
  assert.equal(readFileSync(path.join(demoDirectory,'technical-demo.md'),'utf8'),renderCatalog(catalog,results));
});

test('--check detects stale/missing copies without rewriting or creating them', () => {
  const directory=mkdtempSync(path.join(tmpdir(),'sprout-materials-'));
  // Only this newly created test directory is ever removed.
  try {
    const file=path.join(directory,'stale.md');
    const missing=path.join(directory,'missing.md');
    writeFileSync(file,'old');
    const outputs=[{file,content:'new'},{file:missing,content:'created'}];
    assert.throws(()=>outputMaterials(outputs,{check:true}),/missing or stale/);
    assert.equal(readFileSync(file,'utf8'),'old');
    assert.equal(existsSync(missing),false);
    outputMaterials(outputs);
    assert.doesNotThrow(()=>outputMaterials(outputs,{check:true}));
    assert.equal(readFileSync(file,'utf8'),'new');
  } finally {
    assert(path.dirname(directory)===path.resolve(tmpdir()) && path.basename(directory).startsWith('sprout-materials-'));
    rmSync(directory,{recursive:true,force:true});
  }
});
