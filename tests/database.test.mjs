import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localStatus,database,readLocal,apiRequest } from '../scripts/local-lib.mjs';

const status=localStatus();
const admin=database(status.DB_URL);
const credentials=readLocal('runtime.json');
const fixture=readLocal('bootstrap.json');
for(const s of ['identity','content','learning']) assert.ok(credentials[s]?.databaseUrl,'Run npm run db:provision first');
assert.ok(fixture.admin?.id,'Run npm run db:bootstrap first');
const identity=database(credentials.identity.databaseUrl),content=database(credentials.content.databaseUrl),learning=database(credentials.learning.databaseUrl);
after(async()=>{await Promise.all([admin,identity,content,learning].map(s=>s.end()));});
const uid=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const rollbackMarker=Symbol('rollback');
async function isolated(client,fn) {
  try {await client.begin(async tx=>{await fn(tx);await tx`SET CONSTRAINTS ALL IMMEDIATE`;throw rollbackMarker;});}
  catch(error) {if(error!==rollbackMarker) throw error;}
}
async function rejected(tx,fn,pattern) {
  await assert.rejects(tx.savepoint(async sp=>{await fn(sp);await sp`SET CONSTRAINTS ALL IMMEDIATE`;}),pattern);
}
async function attempt(tx,{user=randomUUID(),assessment=randomUUID(),questions=Array.from({length:5},()=>randomUUID()),kind='quiz',generation=1}={}) {
  const lesson=uid(10),id=randomUUID(),items=[];
  await tx`INSERT INTO learning.attempts(id,user_id,kind,assessment_id,assessment_revision_id,course_id,topic_id,lesson_id,title_snapshot,passing_percent,total_count)
    VALUES(${id},${user},${kind},${kind==='mistake_review'?null:assessment},${kind==='mistake_review'?null:randomUUID()},${kind==='mistake_review'?null:uid(1)},${kind==='mistake_review'?null:uid(2)},${kind==='quiz'?lesson:null},'Isolated database test',${kind==='mistake_review'?null:70},${questions.length})`;
  for(let n=0;n<questions.length;n++) {
    const item=randomUUID();items.push(item);
    await tx`INSERT INTO learning.attempt_items(id,attempt_id,question_id,question_revision_id,lesson_id,position,public_snapshot,mistake_generation)
      VALUES(${item},${id},${questions[n]},${randomUUID()},${lesson},${n+1},${tx.json({type:'single_choice',prompt:`Test ${n}`,options:[{option_key:'A',text:'yes'},{option_key:'B',text:'no'}]})},${kind==='mistake_review'?generation:null})`;
    await tx`INSERT INTO learning.attempt_item_keys(attempt_item_id,answer_snapshot,explanation_snapshot) VALUES(${item},${tx.json({type:'single_choice',correct_option_key:'A'})},'Original explanation')`;
  }
  return {id,user,assessment,items,questions,lesson};
}
async function version(tx,id) {return (await tx`SELECT row_version FROM learning.attempts WHERE id=${id}`)[0].row_version;}
async function answer(tx,a,index,option='A') {
  return (await tx`SELECT learning.check_answer(${a.user},${a.items[index]},${tx.json({option_key:option})},${randomUUID()},0,${await version(tx,a.id)}) AS result`)[0].result;
}
async function submit(tx,a,key=randomUUID(),expected) {
  return (await tx`SELECT learning.submit_attempt(${a.user},${a.id},${key},${expected??await version(tx,a.id)}) AS result`)[0].result;
}
async function cardSession(tx,{user=randomUUID(),cardId=randomUUID(),stage=0}={}) {
  await tx`INSERT INTO learning.flashcards(id,user_id,word,meaning,stage) VALUES(${cardId},${user},'hello','xin chào',${stage}) ON CONFLICT DO NOTHING`;
  const [card]=await tx`SELECT * FROM learning.flashcards WHERE id=${cardId}`;
  const session=randomUUID(),item=randomUUID();
  await tx`INSERT INTO learning.flashcard_sessions(id,user_id) VALUES(${session},${user})`;
  await tx`INSERT INTO learning.flashcard_session_items(id,user_id,session_id,flashcard_id,position,reset_generation,card_snapshot)
    VALUES(${item},${user},${session},${cardId},1,${card.reset_generation},${tx.json({word:card.word,meaning:card.meaning,example:card.example})})`;
  return {user,card:cardId,session,item};
}
async function rate(tx,c,rating='remember',key=randomUUID()) {return (await tx`SELECT learning.rate_flashcard(${c.user},${c.item},${rating},${key}) AS result`)[0].result;}

test('38 tables, RLS enabled, 3 restricted runtime roles, no cross-service foreign keys',async()=>{
  const tables=await admin`SELECT schemaname,count(*)::int AS count FROM pg_tables WHERE schemaname IN ('identity','content','learning') GROUP BY schemaname ORDER BY schemaname`;
  assert.deepEqual(tables.map(r=>[r.schemaname,r.count]),[['content',18],['identity',4],['learning',16]]);
  const [rls]=await admin`SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('identity','content','learning') AND c.relkind='r' AND NOT c.relrowsecurity`;
  assert.equal(rls.n,0);
  const roles=await admin`SELECT rolname,rolsuper,rolbypassrls,rolcreaterole FROM pg_roles WHERE rolname LIKE 'app_%_runtime'`;
  assert.equal(roles.length,3);assert.ok(roles.every(r=>!r.rolsuper&&!r.rolbypassrls&&!r.rolcreaterole));
  const fks=await admin`SELECT n.nspname AS source,r.nspname AS target FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace JOIN pg_class u ON u.oid=c.confrelid JOIN pg_namespace r ON r.oid=u.relnamespace WHERE c.contype='f' AND n.nspname IN ('identity','content','learning') AND n.nspname<>r.nspname`;
  assert.deepEqual(fks.map(r=>[r.source,r.target]),[['identity','auth']]);
});
test('actual runtime connections are isolated and browser roles cannot read private tables/functions',async()=>{
  await identity`SELECT count(*) FROM identity.profiles`;
  await content`SELECT count(*) FROM content.lessons`;
  await learning`SELECT count(*) FROM learning.flashcards`;
  for(const [client,schema] of [[identity,'content'],[identity,'learning'],[content,'identity'],[content,'learning'],[learning,'identity'],[learning,'content']]) {
    await assert.rejects(client.unsafe(`SELECT * FROM ${schema}.${schema==='identity'?'profiles':schema==='content'?'lessons':'attempts'}`),e=>e.code==='42501');
  }
  for(const role of ['anon','authenticated']) await isolated(admin,async tx=>{
    await tx.unsafe(`SET LOCAL ROLE ${role}`);
    await rejected(tx,sp=>sp`SELECT * FROM learning.attempt_item_keys`,e=>e.code==='42501');
    await rejected(tx,sp=>sp`SELECT identity.session_state(${randomUUID()},${randomUUID()})`,e=>e.code==='42501');
  });
  await assert.rejects(identity`SELECT * FROM auth.sessions`,e=>e.code==='42501');
});
test('seed/bootstrap use real Auth users; last active admin and append-only audit are protected',()=>isolated(identity,async tx=>{
  assert.equal((await tx`SELECT count(*)::int AS n FROM identity.profiles WHERE user_id IN (${fixture.admin.id},${fixture.editor.id},${fixture.learner.id})`)[0].n,3);
  await rejected(tx,sp=>sp`UPDATE identity.profiles SET status='locked' WHERE user_id=${fixture.admin.id}`,/last_active_admin/);
  await rejected(tx,sp=>sp`INSERT INTO identity.editor_permissions(user_id,permission_code,granted_by) VALUES(${fixture.learner.id},'reports.view',${fixture.admin.id})`,/editor_role_required/);
  await rejected(tx,sp=>sp`DELETE FROM identity.audit_events`,e=>e.code==='42501');
}));
test('published questions/options/keys and lesson pointers cannot be modified',()=>isolated(content,async tx=>{
  await rejected(tx,sp=>sp`UPDATE content.question_revisions SET prompt='Changed' WHERE id=${uid(30)}`,/published_revision_immutable/);
  await rejected(tx,sp=>sp`UPDATE content.question_answer_keys SET correct_option_key='B' WHERE question_revision_id=${uid(30)}`,/published_revision_children_immutable/);
  await rejected(tx,sp=>sp`INSERT INTO content.question_options(question_revision_id,option_key,text,position) VALUES(${uid(30)},'C','Extra',3)`,/published_revision_children_immutable/);
  const other=randomUUID();await tx`INSERT INTO content.lessons(id,topic_id,position) VALUES(${other},${uid(2)},2)`;
  await rejected(tx,sp=>sp`UPDATE content.lessons SET published_revision_id=${uid(11)} WHERE id=${other}`,e=>e.code==='23503');
  await rejected(tx,sp=>sp`UPDATE content.lessons SET first_published_at=NULL WHERE id=${uid(10)}`,/immutable_first_publication/);
}));
test('malformed single-choice and undersized assessments cannot publish',()=>isolated(content,async tx=>{
  const q=randomUUID(),r=randomUUID();
  await tx`INSERT INTO content.questions(id,lesson_id) VALUES(${q},${uid(10)})`;
  await tx`INSERT INTO content.question_revisions(id,question_id,revision_no,type,prompt,created_by) VALUES(${r},${q},1,'single_choice','Only one option',${fixture.admin.id})`;
  await tx`INSERT INTO content.question_options(question_revision_id,option_key,text,position) VALUES(${r},'A','One',1)`;
  await tx`INSERT INTO content.question_answer_keys(question_revision_id,correct_option_key,explanation) VALUES(${r},'A','Test')`;
  await rejected(tx,sp=>sp`UPDATE content.question_revisions SET published_at=now() WHERE id=${r}`,/invalid_single_choice/);
  const ar=randomUUID();await tx`INSERT INTO content.assessment_revisions(id,assessment_id,revision_no,title,created_by) VALUES(${ar},${uid(12)},2,'Empty draft',${fixture.admin.id})`;
  await rejected(tx,sp=>sp`UPDATE content.assessment_revisions SET published_at=now() WHERE id=${ar}`,/invalid_assessment_structure/);
  await rejected(tx,sp=>sp`UPDATE content.assessments SET published_revision_id=${ar} WHERE id=${uid(12)}`,/pointer_requires_published_revision/);
}));
test('new draft does not modify published content and media keys are immutable',()=>isolated(content,async tx=>{
  const r=randomUUID();await tx`INSERT INTO content.question_revisions(id,question_id,revision_no,type,prompt,created_by) VALUES(${r},${uid(20)},2,'single_choice','Draft text',${fixture.admin.id})`;
  assert.notEqual((await tx`SELECT prompt FROM content.question_revisions WHERE id=${uid(30)}`)[0].prompt,'Draft text');
  await rejected(tx,sp=>sp`INSERT INTO content.question_revisions(question_id,revision_no,type,prompt,created_by) VALUES(${uid(20)},3,'single_choice','Second draft',${fixture.admin.id})`,e=>e.code==='23505');
  await rejected(tx,sp=>sp`UPDATE content.media_assets SET object_key='replace.mp3' WHERE id=${uid(4)}`,/media_object_immutable/);
}));
test('hiding the last lesson preserves its snapshots and increases catalog version',()=>isolated(content,async tx=>{
  const before=(await tx`SELECT catalog_version FROM content.courses WHERE id=${uid(1)}`)[0].catalog_version;
  await tx`UPDATE content.lessons SET status='hidden' WHERE id=${uid(10)}`;
  await tx`SET CONSTRAINTS ALL IMMEDIATE`;
  assert.ok(BigInt((await tx`SELECT catalog_version FROM content.courses WHERE id=${uid(1)}`)[0].catalog_version)>BigInt(before));
  assert.equal((await tx`SELECT count(*)::int AS n FROM content.lesson_revisions WHERE id=${uid(11)}`)[0].n,1);
}));
test('incomplete snapshots and multiple active attempts are rejected',()=>isolated(learning,async tx=>{
  await rejected(tx,sp=>sp`INSERT INTO learning.attempts(user_id,kind,title_snapshot,total_count) VALUES(${randomUUID()},'mistake_review','Missing items',1)`,/attempt_snapshot_incomplete/);
  const a=await attempt(tx);
  await rejected(tx,sp=>attempt(sp,{user:a.user,assessment:a.assessment}),e=>e.code==='23505');
  const c=await cardSession(tx);
  await rejected(tx,sp=>cardSession(sp,{user:c.user}),e=>e.code==='23505');
}));
test('submit is atomic and idempotent; 4/5 passes and updates progress and one wrong question',()=>isolated(learning,async tx=>{
  const a=await attempt(tx);for(let n=0;n<4;n++) await answer(tx,a,n);
  const key=randomUUID(),expected=await version(tx,a.id),result=await submit(tx,a,key,expected);
  assert.equal(result.correct_count,4);assert.equal(result.passed,true);
  assert.deepEqual(await submit(tx,a,key,expected),result);
  assert.deepEqual(await submit(tx,a,randomUUID(),expected),result);
  assert.equal((await tx`SELECT count(*)::int AS n FROM learning.lesson_progress WHERE user_id=${a.user} AND completed_at IS NOT NULL`)[0].n,1);
  assert.equal((await tx`SELECT generation FROM learning.wrong_questions WHERE user_id=${a.user}`)[0].generation,'1');
  await rejected(tx,sp=>submit(sp,a,key,999),/idempotency_conflict/);
  await rejected(tx,sp=>sp`UPDATE learning.attempts SET correct_count=5 WHERE id=${a.id}`,/attempt_terminal/);
}));
test('failed transaction rolls back result, progress, wrong questions and dedup claim',()=>isolated(learning,async tx=>{
  const a=await attempt(tx),key=randomUUID();
  await assert.rejects(tx.savepoint(async sp=>{await submit(sp,a,key);throw new Error('injected_failure_before_commit');}),/injected_failure/);
  assert.equal((await tx`SELECT status FROM learning.attempts WHERE id=${a.id}`)[0].status,'in_progress');
  assert.equal((await tx`SELECT count(*)::int AS n FROM learning.request_dedup WHERE user_id=${a.user}`)[0].n,0);
  assert.equal((await tx`SELECT count(*)::int AS n FROM learning.wrong_questions WHERE user_id=${a.user}`)[0].n,0);
  assert.equal((await submit(tx,a,key)).correct_count,0);
}));
test('stale answer versions cannot overwrite and a checked quiz answer is locked',()=>isolated(learning,async tx=>{
  const a=await attempt(tx),v=await version(tx,a.id);
  await answer(tx,a,0);
  await rejected(tx,sp=>sp`SELECT learning.check_answer(${a.user},${a.items[1]},'{}',${randomUUID()},0,${v})`,/version_conflict/);
  await rejected(tx,sp=>sp`UPDATE learning.attempt_answers SET answer='{"option_key":"B"}' WHERE attempt_item_id=${a.items[0]}`,/answer_locked/);
  await rejected(tx,sp=>sp`SELECT learning.submit_attempt(${randomUUID()},${a.id},${randomUUID()},1)`,e=>e.code==='42501');
}));
test('review captured before a new failure does not resolve the new generation',()=>isolated(learning,async tx=>{
  const a=await attempt(tx);await submit(tx,a);
  const review=await attempt(tx,{user:a.user,questions:[a.questions[0]],kind:'mistake_review',generation:1});
  const next=await attempt(tx,{user:a.user,questions:a.questions});await submit(tx,next);
  const result=await answer(tx,review,0);
  assert.equal(result.is_correct,true);assert.equal(result.mistake_resolved,false);
  const [wrong]=await tx`SELECT generation,status FROM learning.wrong_questions WHERE user_id=${a.user} AND question_id=${a.questions[0]}`;
  assert.equal(wrong.generation,'2');assert.equal(wrong.status,'pending');
  const current=await attempt(tx,{user:a.user,questions:[a.questions[0]],kind:'mistake_review',generation:2});
  assert.equal((await answer(tx,current,0)).mistake_resolved,true);
}));
test('topic test rejects early grading and passing does not complete its lessons',()=>isolated(learning,async tx=>{
  const a=await attempt(tx,{kind:'topic_test',questions:Array.from({length:10},()=>randomUUID())});
  await rejected(tx,sp=>sp`SELECT learning.check_answer(${a.user},${a.items[0]},'{"option_key":"A"}',${randomUUID()},0,1)`,/answer_not_checkable/);
  for(const item of a.items.slice(0,7)) await tx`INSERT INTO learning.attempt_answers(attempt_item_id,answer) VALUES(${item},'{"option_key":"A"}')`;
  const result=await submit(tx,a);assert.equal(result.passed,true);assert.equal(result.correct_count,7);
  assert.equal((await tx`SELECT count(*)::int AS n FROM learning.lesson_progress WHERE user_id=${a.user}`)[0].n,0);
}));
test('normalization preserves punctuation, combines Unicode and collapses whitespace',async()=>{
  const [r]=await learning`SELECT learning.grade_answer('{"text":"  Good   MORNING  "}','{"type":"fill_blank","accepted_answers":["good morning"]}') AS normalized,
  learning.grade_answer(${learning.json({text:'it is'})},${learning.json({type:'fill_blank',accepted_answers:["it's"]})}) AS punctuation,
  learning.normalize_answer(${String.fromCodePoint(101,769)})=learning.normalize_answer('é') AS unicode`;
  assert.equal(r.normalized,true);assert.equal(r.punctuation,false);assert.equal(r.unicode,true);
  assert.equal((await learning`SELECT learning.normalize_answer(${"\t Good\n morning \t"}) AS value`)[0].value,'good morning');
});
test('flashcard schedule, retry, duplicate rating and stage-4 interval are enforced',()=>isolated(learning,async tx=>{
  for(const [stage,rating,next,hours] of [[0,'remember',1,24],[1,'remember',2,72],[2,'remember',3,168],[3,'remember',4,336],[4,'remember',4,336],[4,'again',0,24]]) {
    const c=await cardSession(tx,{stage}),key=randomUUID(),result=await rate(tx,c,rating,key);
    assert.equal(result.stage,next);assert.deepEqual(await rate(tx,c,rating,key),result);
    const [r]=await tx`SELECT extract(epoch FROM due_at-last_reviewed_at)/3600 AS hours FROM learning.flashcards WHERE id=${c.card}`;
    assert.equal(Number(r.hours),hours);
    await rejected(tx,sp=>rate(sp,c,rating),/item_already_finished/);
  }
}));
test('reset/deletion skips stale session items and restore keeps history and one source card',()=>isolated(learning,async tx=>{
  const c=await cardSession(tx);
  await tx`UPDATE learning.flashcards SET meaning='new meaning' WHERE id=${c.card}`;
  assert.equal((await rate(tx,c)).status,'skipped');
  assert.equal((await tx`SELECT reset_generation FROM learning.flashcards WHERE id=${c.card}`)[0].reset_generation,'2');
  const second=await cardSession(tx,{user:c.user,cardId:c.card});
  await tx`UPDATE learning.flashcards SET deleted_at=now() WHERE id=${c.card}`;
  assert.equal((await rate(tx,second)).status,'skipped');
  await tx`UPDATE learning.flashcards SET deleted_at=NULL WHERE id=${c.card}`;
  const [restored]=await tx`SELECT stage,reset_generation,last_reviewed_at FROM learning.flashcards WHERE id=${c.card}`;
  assert.equal(restored.stage,0);assert.equal(restored.reset_generation,'3');assert.equal(restored.last_reviewed_at,null);
  const [source]=await tx`SELECT * FROM learning.flashcards WHERE user_id=${fixture.learner.id} LIMIT 1`;
  await tx`UPDATE learning.flashcards SET deleted_at=now() WHERE id=${source.id}`;
  await rejected(tx,sp=>sp`INSERT INTO learning.flashcards(user_id,source_vocabulary_id,source_lesson_id,source_topic_id,source_course_id,word,meaning) VALUES(${source.user_id},${source.source_vocabulary_id},${source.source_lesson_id},${source.source_topic_id},${source.source_course_id},'hello','duplicate')`,e=>e.code==='23505');
}));
test('two real connections submitting the same request produce one result and one failure generation',async()=>{
  const a=await learning.begin(tx=>attempt(tx)),key=randomUUID();
  const connection=database(credentials.learning.databaseUrl);
  try {
    const [one,two]=await Promise.all([submit(learning,a,key,1),submit(connection,a,key,1)]);
    assert.deepEqual(one,two);
    const [counts]=await learning`SELECT count(*)::int AS n,max(generation)::int AS generation FROM learning.wrong_questions WHERE user_id=${a.user}`;
    assert.equal(counts.n,5);assert.equal(counts.generation,1);
  } finally {await connection.end();}
});
test('two real connections rating a card produce exactly one stage transition',async()=>{
  const c=await learning.begin(tx=>cardSession(tx)),key=randomUUID(),connection=database(credentials.learning.databaseUrl);
  try {
    const results=await Promise.all([rate(learning,c,'remember',key),rate(connection,c,'remember',key)]);
    assert.deepEqual(results[0],results[1]);
    assert.equal((await learning`SELECT stage FROM learning.flashcards WHERE id=${c.card}`)[0].stage,1);
  } finally {await connection.end();}
});
test('two real connections starting the same quiz cannot commit two active attempts',async()=>{
  const user=randomUUID(),assessment=randomUUID(),connection=database(credentials.learning.databaseUrl);
  try {
    const results=await Promise.allSettled([learning.begin(tx=>attempt(tx,{user,assessment})),connection.begin(tx=>attempt(tx,{user,assessment}))]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(results.find(r=>r.status==='rejected').reason.code,'23505');
    assert.equal((await learning`SELECT count(*)::int AS n FROM learning.attempts WHERE user_id=${user} AND assessment_id=${assessment} AND status='in_progress'`)[0].n,1);
  } finally {await connection.end();}
});
test('a committed attempt cannot accept extra snapshot items in a later transaction',async()=>{
  const a=await learning.begin(tx=>attempt(tx));
  await assert.rejects(learning`INSERT INTO learning.attempt_items(attempt_id,question_id,question_revision_id,lesson_id,position,public_snapshot)
    VALUES(${a.id},${randomUUID()},${randomUUID()},${uid(10)},6,'{"type":"single_choice","options":[]}')`,/attempt_items_frozen/);
});
test('Auth login creates a session visible only through the narrow lookup; logout removes it',async()=>{
  const user=fixture.learner;
  assert.ok(user.password,'Fresh bootstrap credentials are required for this local Auth test');
  const response=await fetch(`${status.API_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:status.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:user.password})});
  assert.equal(response.status,200);
  const session=await response.json();
  const claims=JSON.parse(Buffer.from(session.access_token.split('.')[1],'base64url').toString());
  assert.equal(claims.sub,user.id);
  assert.equal((await identity`SELECT * FROM identity.session_state(${claims.session_id},${user.id})`).length,1);
  assert.equal((await identity`SELECT * FROM identity.session_state(${claims.session_id},${fixture.editor.id})`).length,0);
  const logout=await fetch(`${status.API_URL}/auth/v1/logout?scope=local`,{method:'POST',headers:{apikey:status.ANON_KEY,Authorization:`Bearer ${session.access_token}`}});
  assert.equal(logout.ok,true);
  assert.equal((await identity`SELECT * FROM identity.session_state(${claims.session_id},${user.id})`).length,0);
});
test('private media exists and is not downloadable anonymously',async()=>{
  const [asset]=await content`SELECT * FROM content.media_assets WHERE id=${uid(4)}`;
  const response=await apiRequest(status,`/storage/v1/object/authenticated/${asset.bucket}/${asset.object_key}`);
  assert.equal((await response.arrayBuffer()).byteLength,Number(asset.size_bytes));
  const anonymous=await fetch(`${status.API_URL}/storage/v1/object/public/${asset.bucket}/${asset.object_key}`);
  assert.equal(anonymous.ok,false);
});
