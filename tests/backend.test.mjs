import { before,test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { localStatus,readLocal,apiRequest } from '../scripts/local-lib.mjs';
const status=localStatus(),fixtures=readLocal('bootstrap.json');
const bases={identity:'http://127.0.0.1:4001',content:'http://127.0.0.1:4002',learning:'http://127.0.0.1:4003'};
const uid=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let admin,learner,other,editor,finished;
async function login(user) {
  const r=await fetch(status.API_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:status.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:user.password})});
  assert.equal(r.status,200);const data=await r.json();return {...user,id:data.user.id,token:data.access_token,refresh:data.refresh_token};
}
async function newUser(name) {
  const user={email:`backend-${randomUUID()}@pbl6.local.test`,password:randomUUID()+'aA1!'};
  await apiRequest(status,'/auth/v1/admin/users',{method:'POST',body:{...user,email_confirm:true,user_metadata:{full_name:name}}});return login(user);
}
async function request(service,path,{user,method='GET',body,key,expected=200,headers={}}={}) {
  const r=await fetch(bases[service]+path,{method,headers:{...(user?{Authorization:`Bearer ${user.token}`}:{ }),...(body!==undefined?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await r.json();assert.equal(r.status,expected,`${method} ${service}${path}: ${JSON.stringify(data)}`);return data;
}
before(async()=>{
  for(const service of Object.keys(bases)) await request(service,'/health');
  admin=await login(fixtures.admin);editor=await login(fixtures.editor);learner=await newUser('API Learner One');other=await newUser('API Learner Two');
  for(const user of [admin,editor,learner,other])await request('identity','/v1/me',{user});
});
test('real Auth is required, forged JWT/internal calls/profile role injection are rejected',async()=>{
  await request('learning','/v1/today',{expected:401});
  await request('identity','/v1/me',{user:{token:'not-a-jwt'},expected:401});
  await request('content',`/internal/assessments/${uid(12)}`,{user:learner,expected:403});
  await request('identity','/internal/verify',{user:learner,method:'POST',expected:403});
  const me=await request('identity','/v1/me',{user:learner});
  await request('identity','/v1/me',{user:learner,method:'PATCH',body:{display_name:'New Name',role:'admin',expectedVersion:Number(me.row_version)},expected:400});
  await request('content','/v1/admin/catalog',{user:learner,expected:403});
});
test('guest preview and catalog have no assessment answer keys',async()=>{
  const lesson=await request('content',`/v1/lessons/${uid(10)}`);
  assert.equal(lesson.id,uid(10));assert.ok(lesson.blocks.some(b=>b.type==='audio'&&b.audio_url));
  assert.equal(JSON.stringify(lesson).includes('correct_option_key'),false);
  const catalog=await request('content','/v1/catalog');assert.ok(catalog.courses.length>0);
});
test('quiz HTTP flow hides unchecked answers, saves result atomically and replays submission',async()=>{
  await request('learning','/v1/enrollment',{user:learner,method:'PUT',body:{course_id:uid(1)}});
  await request('learning',`/v1/lessons/${uid(10)}/open`,{user:learner,method:'POST'});
  const startKey=randomUUID();
  const start=await request('learning','/v1/attempts',{user:learner,method:'POST',body:{assessment_id:uid(12)},key:startKey,expected:201});
  assert.deepEqual(await request('learning','/v1/attempts',{user:learner,method:'POST',body:{assessment_id:uid(12)},key:startKey,expected:201}),start);
  let a=await request('learning',`/v1/attempts/${start.attempt_id}`,{user:learner});
  assert.ok(a.items.every(i=>!('answer_key'in i)&&!('explanation'in i)&&!('transcript'in i)));
  await request('learning',`/v1/attempts/${a.id}`,{user:other,expected:404});
  for(let n=0;n<4;n++) {
    const item=a.items[n];a=await request('learning',`/v1/items/${item.id}/check`,{user:learner,method:'POST',key:randomUUID(),body:{answer:n<3?{option_key:'A'}:{text:'  Good   MORNING '},expectedVersion:item.answer_version,attemptVersion:a.row_version}});
    assert.ok('answer_key'in a.items[n]);assert.ok(!('answer_key'in a.items[4]));
  }
  const k=randomUUID(),body={expectedVersion:a.row_version,confirmBlank:true};
  finished=await request('learning',`/v1/attempts/${a.id}/submit`,{user:learner,method:'POST',key:k,body});
  assert.equal(finished.score,80);assert.equal(finished.passed,true);assert.ok(finished.items.every(i=>'answer_key'in i));
  assert.deepEqual(await request('learning',`/v1/attempts/${a.id}/submit`,{user:learner,method:'POST',key:k,body}),finished);
  const progress=await request('learning','/v1/progress',{user:learner});assert.equal(progress.percent,100);assert.equal(progress.completed,false);
  assert.equal((await request('learning','/v1/mistakes',{user:learner})).total,1);
});
test('review resolves pending failure without changing original quiz score',async()=>{
  const start=await request('learning','/v1/mistake-reviews',{user:learner,method:'POST',key:randomUUID(),body:{},expected:201});
  let a=await request('learning',`/v1/attempts/${start.attempt_id}`,{user:learner});
  a=await request('learning',`/v1/items/${a.items[0].id}/check`,{user:learner,method:'POST',key:randomUUID(),body:{answer:{text:'hello'},expectedVersion:0,attemptVersion:a.row_version}});
  assert.equal(a.status,'submitted');assert.equal(a.score,null);
  assert.equal((await request('learning','/v1/mistakes',{user:learner})).total,0);
  assert.equal((await request('learning',`/v1/attempts/${finished.id}`,{user:learner})).score,80);
});
test('source cards deduplicate; rating replay changes schedule once; another user cannot rate',async()=>{
  const body={source_vocabulary_id:uid(3),lesson_id:uid(10)};
  const one=await request('learning','/v1/flashcards',{user:learner,method:'POST',key:randomUUID(),body,expected:201});
  const two=await request('learning','/v1/flashcards',{user:learner,method:'POST',key:randomUUID(),body,expected:201});assert.equal(one.card_id,two.card_id);
  const start=await request('learning','/v1/flashcard-sessions',{user:learner,method:'POST',key:randomUUID(),body:{},expected:201});
  const session=await request('learning',`/v1/flashcard-sessions/${start.session_id}`,{user:learner}),item=session.items[0];
  await request('learning',`/v1/flashcard-items/${item.id}/rate`,{user:other,method:'POST',key:randomUUID(),body:{rating:'remember'},expected:403});
  const k=randomUUID(),result=await request('learning',`/v1/flashcard-items/${item.id}/rate`,{user:learner,method:'POST',key:k,body:{rating:'remember'}});
  assert.equal(result.stage,1);assert.deepEqual(await request('learning',`/v1/flashcard-items/${item.id}/rate`,{user:learner,method:'POST',key:k,body:{rating:'remember'}}),result);
  const cards=await request('learning','/v1/flashcards',{user:learner});assert.equal(cards.items[0].stage,1);
});
test('hiding content cancels the next request to an open attempt and keeps submitted history',async()=>{
  const start=await request('learning','/v1/attempts',{user:learner,method:'POST',key:randomUUID(),body:{assessment_id:uid(12)},expected:201});
  const catalog=await request('content','/v1/admin/catalog',{user:admin}),lesson=catalog.lessons.find(l=>l.id===uid(10));
  let hidden;
  try {
    hidden=await request('content',`/v1/admin/lessons/${uid(10)}/status`,{user:admin,method:'PATCH',body:{status:'hidden',expectedVersion:Number(lesson.row_version)}});
    await request('learning',`/v1/attempts/${start.attempt_id}`,{user:learner,expected:409});
    const cancelled=await request('learning',`/v1/attempts/${start.attempt_id}`,{user:learner});assert.equal(cancelled.status,'cancelled');assert.ok(cancelled.items.every(i=>!('answer_key'in i)));
    assert.equal((await request('learning',`/v1/attempts/${finished.id}`,{user:learner})).score,80);
  } finally {if(hidden)await request('content',`/v1/admin/lessons/${uid(10)}/status`,{user:admin,method:'PATCH',body:{status:'published',expectedVersion:Number(hidden.row_version)}});}
});
test('account lock blocks an existing JWT and unlock still requires a fresh session',async()=>{
  const me=await request('identity','/v1/me',{user:other});
  const locked=await request('identity',`/v1/admin/users/${other.id}`,{user:admin,method:'PATCH',body:{status:'locked',reason:'Integration test',expectedVersion:Number(me.row_version)}});
  await request('learning','/v1/today',{user:other,expected:403});
  await request('identity',`/v1/admin/users/${other.id}`,{user:admin,method:'PATCH',body:{status:'active',expectedVersion:Number(locked.row_version)}});
  await request('learning','/v1/today',{user:other,expected:401});
  other=await login(other);await request('learning','/v1/today',{user:other});
});
test('revoking Editor permissions affects the same access token immediately',async()=>{
  const me=await request('identity','/v1/me',{user:editor});
  const changed=await request('identity',`/v1/admin/users/${editor.id}/editor`,{user:admin,method:'PUT',body:{enabled:true,permissions:[],expectedVersion:Number(me.row_version)}});
  try {await request('content','/v1/admin/catalog',{user:editor,expected:403});}
  finally {await request('identity',`/v1/admin/users/${editor.id}/editor`,{user:admin,method:'PUT',body:{enabled:true,permissions:['content.write'],expectedVersion:Number(changed.row_version)}});}
});
test('logout rejects the still-unexpired JWT on the next protected request',async()=>{
  await request('identity','/v1/logout',{user:other,method:'POST'});
  await request('identity','/v1/me',{user:other,expected:401});
});
test('CMS creates and edits drafts, publishes lesson+quiz atomically, then serves a real topic test',async()=>{
  const course=await request('content','/v1/admin/courses',{user:admin,method:'POST',body:{title:'HTTP Test Course',level:'A1',position:10},expected:201});
  const topic=await request('content','/v1/admin/topics',{user:admin,method:'POST',body:{course_id:course.id,title:'HTTP Test Topic',position:1},expected:201});
  const lesson=await request('content','/v1/admin/lessons',{user:editor,method:'POST',body:{topic_id:topic.id,position:1,is_preview:false},expected:201});
  const revision=await request('content',`/v1/admin/lessons/${lesson.id}/revisions`,{user:editor,method:'POST',body:{title:'Draft lesson',objectives:'Practice greetings',blocks:[{id:'body',type:'text',body:'Hello, HTTP.'}]},expected:201});
  await request('content',`/v1/lessons/${lesson.id}`,{user:learner,expected:404});
  await request('content',`/v1/admin/lesson-revisions/${revision.id}`,{user:editor,method:'PATCH',body:{title:'Published lesson',objectives:'Practice greetings',blocks:[{id:'body',type:'text',body:'Hello, database.'}],expectedVersion:Number(revision.row_version)}});
  const question={type:'single_choice',prompt:'Choose hello',options:[{option_key:'A',text:'Hello'},{option_key:'B',text:'Table'}],correct_option_key:'A',explanation:'Hello is a greeting.'};
  const quizQuestions=[];
  for(let n=0;n<5;n++)quizQuestions.push(await request('content','/v1/admin/questions',{user:editor,method:'POST',body:{...question,lesson_id:lesson.id,prompt:`Quiz ${n}`},expected:201}));
  await request('content',`/v1/admin/question-revisions/${quizQuestions[0].id}`,{user:editor,method:'PATCH',body:{...question,prompt:'Edited draft question',expectedVersion:Number(quizQuestions[0].row_version)}});
  const quiz=await request('content','/v1/admin/assessments',{user:editor,method:'POST',body:{kind:'quiz',lesson_id:lesson.id,title:'HTTP quiz',question_revision_ids:quizQuestions.map(q=>q.id)},expected:201});
  await request('content',`/v1/admin/lessons/${lesson.id}/publish`,{user:editor,method:'POST',body:{lessonRevisionId:revision.id,assessmentRevisionId:quiz.id,expectedVersion:Number(lesson.row_version)},expected:403});
  await request('content',`/v1/admin/lessons/${lesson.id}/publish`,{user:admin,method:'POST',body:{lessonRevisionId:revision.id,assessmentRevisionId:quiz.id,expectedVersion:Number(lesson.row_version)}});
  await request('content',`/v1/admin/topics/${topic.id}/status`,{user:admin,method:'PATCH',body:{status:'published',expectedVersion:Number(topic.row_version)}});
  const catalog=await request('content','/v1/admin/catalog',{user:admin}),courseVersion=catalog.courses.find(c=>c.id===course.id).row_version;
  await request('content',`/v1/admin/courses/${course.id}/status`,{user:admin,method:'PATCH',body:{status:'published',expectedVersion:Number(courseVersion)}});
  await request('content',`/v1/lessons/${lesson.id}`,{expected:401});
  assert.equal((await request('content',`/v1/lessons/${lesson.id}`,{user:learner})).title,'Published lesson');
  await request('content',`/v1/admin/question-revisions/${quizQuestions[0].id}`,{user:editor,method:'PATCH',body:{...question,expectedVersion:2},expected:409});
  const testQuestions=[];
  for(let n=0;n<10;n++)testQuestions.push(await request('content','/v1/admin/questions',{user:editor,method:'POST',body:{...question,lesson_id:lesson.id,prompt:`Test ${n}`},expected:201}));
  const exam=await request('content','/v1/admin/assessments',{user:editor,method:'POST',body:{kind:'topic_test',topic_id:topic.id,title:'HTTP Topic Test',question_revision_ids:testQuestions.map(q=>q.id)},expected:201});
  await request('content',`/v1/admin/assessments/${exam.assessment_id}/publish`,{user:admin,method:'POST',body:{revisionId:exam.id,expectedVersion:1}});
  await request('learning','/v1/attempts',{user:learner,method:'POST',key:randomUUID(),body:{assessment_id:exam.assessment_id},expected:409});
  await request('learning',`/v1/lessons/${lesson.id}/open`,{user:learner,method:'POST'});
  const start=await request('learning','/v1/attempts',{user:learner,method:'POST',key:randomUUID(),body:{assessment_id:exam.assessment_id},expected:201});
  let attempt=await request('learning',`/v1/attempts/${start.attempt_id}`,{user:learner});
  assert.ok(attempt.items.every(i=>!('answer_key'in i)&&!('transcript'in i)&&!('explanation'in i)));
  for(const item of attempt.items.slice(0,7)) {
    const saved=await request('learning',`/v1/items/${item.id}/answer`,{user:learner,method:'PUT',body:{answer:{option_key:'A'},expectedVersion:0,attemptVersion:attempt.row_version}});attempt.row_version=saved.attempt_version;
  }
  const result=await request('learning',`/v1/attempts/${attempt.id}/submit`,{user:learner,method:'POST',key:randomUUID(),body:{expectedVersion:attempt.row_version,confirmBlank:true}});
  assert.equal(result.score,70);assert.equal(result.passed,true);assert.ok(result.items.every(i=>'answer_key'in i));
});
test('reports require permission and count real learner activities in the selected timezone',async()=>{
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const url=`/v1/admin/reports?from=${day}&to=${day}`;
  await request('learning',url,{user:learner,expected:403});await request('learning',url,{user:editor,expected:403});
  const report=await request('learning',url,{user:admin});assert.equal(report.timezone,'Asia/Ho_Chi_Minh');assert.ok(report.active_users>=1);assert.ok(report.attempts.some(a=>a.kind==='quiz'&&a.attempt_count>=1));
  await request('identity','/v1/admin/summary',{user:admin});
});
test('logout-all invalidates separate existing sessions and allows a new login',async()=>{
  const first=await newUser('All Sessions Test'),second=await login(first);
  await request('identity','/v1/me',{user:first});
  await request('identity','/v1/logout-all',{user:first,method:'POST'});
  await request('identity','/v1/me',{user:first,expected:401});
  await request('identity','/v1/me',{user:second,expected:401});
  const fresh=await login(first);await request('identity','/v1/me',{user:fresh});
});
