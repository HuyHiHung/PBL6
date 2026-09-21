import { z } from 'zod';
import { ApiError,baseApp,json,jsonValue,id,key,page,protect,permission,contentCall,text,uuid,version,type Config,type DB,type Query } from '../../../packages/backend/src/http.js';
import type { AssessmentSnapshot,Availability,Catalog,LessonInfo,SnapshotItem,VocabularySnapshot } from '../../../packages/backend/src/contracts.js';
import { reportRoutes } from './reports.js';
import { expansionRoutes } from './expansion.js';
import { typingRoutes } from './typing.js';
const answerSchema=z.union([z.object({option_key:z.string().min(1).max(10)}).strict(),z.object({text:z.string().max(1000)}).strict()]);

export function createLearning(cfg:Config,sql:DB) {
  const app=baseApp(cfg,sql);app.use('/v1/*',protect(cfg));
  expansionRoutes(app,cfg,sql);
  typingRoutes(app,cfg,sql);
  async function dedup(user:string,operation:string,k:string,payload:unknown,fn:(tx:Query)=>Promise<Record<string,unknown>>) {
    return sql.begin(async tx=>{
      const [old]=await tx`SELECT learning.claim_request(${user},${operation},${k},${tx.json(jsonValue(payload))}) AS result`;
      if(old!.result)return old!.result;
      const result=await fn(tx);await tx`SELECT learning.finish_request(${user},${operation},${k},${tx.json(jsonValue(result))})`;return result;
    });
  }
  async function available(assessment:string|null,lessons:string[],questions:string[]) {
    return (await contentCall<Availability>(cfg,'/availability',{assessment_id:assessment,lesson_ids:[...new Set(lessons)],question_ids:[...new Set(questions)]})).available;
  }
  async function ownedAttempt(user:string,attemptId:string,check=true) {
    const [a]=await sql`SELECT * FROM learning.attempts WHERE id=${attemptId} AND user_id=${user}`;if(!a)throw new ApiError(404,'ATTEMPT_NOT_FOUND');
    if(check&&a.status==='in_progress') {
      const items=await sql`SELECT lesson_id,question_id FROM learning.attempt_items WHERE attempt_id=${attemptId}`;
      if(!await available(a.assessment_id,items.map(i=>i.lesson_id),items.map(i=>i.question_id))) {
        await sql`UPDATE learning.attempts SET status='cancelled',cancelled_at=clock_timestamp(),cancel_reason='content_unavailable' WHERE id=${attemptId} AND user_id=${user} AND status='in_progress'`;
        throw new ApiError(409,'CONTENT_UNAVAILABLE');
      }
    }return a;
  }
  async function dto(user:string,attemptId:string,check=true) {
    const a=await ownedAttempt(user,attemptId,check);
    const items=await sql`SELECT i.id,i.position,i.lesson_id,i.public_snapshot,ans.answer,ans.is_correct,ans.checked_at,ans.row_version AS answer_version,k.answer_snapshot,k.explanation_snapshot,k.transcript_snapshot FROM learning.attempt_items i LEFT JOIN learning.attempt_answers ans ON ans.attempt_item_id=i.id JOIN learning.attempt_item_keys k ON k.attempt_item_id=i.id WHERE i.attempt_id=${attemptId} ORDER BY i.position`;
    const out=await Promise.all(items.map(async i=>{
      const s=i.public_snapshot,reveal=a.status==='submitted'||(a.kind!=='topic_test'&&i.checked_at!==null);
      const audio=s.audio_asset_id?await contentCall<{url:string|null}>(cfg,`/media/${uuid.parse(s.audio_asset_id)}`):{url:null};
      return {id:i.id,position:i.position,lesson_id:i.lesson_id,type:s.type,prompt:s.prompt,passage:s.passage??null,
        options:Array.isArray(s.options)?s.options.map((o:Record<string,unknown>)=>({option_key:o.option_key,text:o.text})):[],audio_url:audio.url,
        answer:i.answer??null,answer_version:Number(i.answer_version??0),checked:!!i.checked_at,
        ...(reveal?{is_correct:i.is_correct,answer_key:i.answer_snapshot,explanation:i.explanation_snapshot,transcript:i.transcript_snapshot}:{})};
    }));
    return {id:a.id,kind:a.kind,title:a.title_snapshot,status:a.status,row_version:Number(a.row_version),total_count:a.total_count,
      correct_count:a.status==='submitted'?a.correct_count:null,passed:a.passed,
      score:a.status==='submitted'&&a.kind!=='mistake_review'?Math.round(1000*a.correct_count/a.total_count)/10:null,passing_percent:a.passing_percent,
      started_at:a.started_at,submitted_at:a.submitted_at,cancel_reason:a.cancel_reason,items:out};
  }
  async function createAttempt(tx:Query,user:string,s:AssessmentSnapshot|{kind:'mistake_review';title:string;items:SnapshotItem[]},generations?:Map<string,string>) {
    const normal=s.kind!=='mistake_review';
    const [a]=await tx`INSERT INTO learning.attempts(user_id,kind,assessment_id,assessment_revision_id,course_id,topic_id,lesson_id,title_snapshot,passing_percent,grading_policy_version,total_count)
      VALUES(${user},${s.kind},${normal?s.id:null},${normal?s.revision_id:null},${normal?s.course_id:null},${normal?s.topic_id:null},${normal?s.lesson_id:null},${s.title},${normal?s.passing_percent:null},${normal?s.grading_policy_version:1},${s.items.length}) RETURNING id`;
    for(const [index,i] of s.items.entries()) {
      const [item]=await tx`INSERT INTO learning.attempt_items(attempt_id,question_id,question_revision_id,lesson_id,position,public_snapshot,mistake_generation) VALUES(${a!.id},${i.question_id},${i.question_revision_id},${i.lesson_id},${index+1},${tx.json(jsonValue(i.public_snapshot))},${generations?.get(i.question_id)??null}) RETURNING id`;
      await tx`INSERT INTO learning.attempt_item_keys(attempt_item_id,answer_snapshot,explanation_snapshot,transcript_snapshot) VALUES(${item!.id},${tx.json(jsonValue(i.answer_snapshot))},${i.explanation},${i.transcript})`;
    }return {attempt_id:a!.id};
  }
  app.post('/v1/attempts',async c=>{
    const user=c.get('principal').user_id,b=await json(c,z.object({assessment_id:uuid}).strict()),k=key(c);
    const snapshot=await contentCall<AssessmentSnapshot>(cfg,`/assessments/${b.assessment_id}`);
    const testCatalog=snapshot.kind==='topic_test'?await contentCall<Catalog>(cfg,'/catalog'):null;
    const testLessons=testCatalog?.courses.flatMap(c=>c.topics).find(t=>t.id===snapshot.topic_id)?.lessons.map(l=>l.id)??[];
    const result=await dedup(user,'attempt.start',k,b,async tx=>{
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${user},11))`;
      const [existing]=await tx`SELECT id FROM learning.attempts WHERE user_id=${user} AND assessment_id=${b.assessment_id} AND status='in_progress'`;
      if(existing)return {attempt_id:existing.id};
      if(snapshot.kind==='topic_test') {
        if(!testLessons.length||!(await tx`SELECT 1 FROM learning.lesson_progress WHERE user_id=${user} AND lesson_id IN ${tx(testLessons)} LIMIT 1`)[0])throw new ApiError(409,'OPEN_A_LESSON_FIRST');
      }
      return createAttempt(tx,user,snapshot);
    });return c.json(result,201);
  });
  app.get('/v1/attempts',async c=>{
    const rows=await sql`SELECT id,kind,title_snapshot,status,correct_count,total_count,passed,started_at,submitted_at FROM learning.attempts WHERE user_id=${c.get('principal').user_id} ORDER BY started_at DESC,id LIMIT 20 OFFSET ${(page(c)-1)*20}`;return c.json({items:rows,page:page(c)});
  });
  app.get('/v1/attempts/:id',async c=>c.json(await dto(c.get('principal').user_id,id(c))));
  app.post('/v1/attempts/:id/submit',async c=>{
    const user=c.get('principal').user_id,attemptId=id(c),b=await json(c,z.object({expectedVersion:version,confirmBlank:z.boolean().default(false)}).strict()),k=key(c);
    const a=await ownedAttempt(user,attemptId);
    if(a.status==='in_progress') {
      const [empty]=await sql`SELECT count(*)::int AS n FROM learning.attempt_items i LEFT JOIN learning.attempt_answers ans ON ans.attempt_item_id=i.id WHERE i.attempt_id=${attemptId} AND (ans.attempt_item_id IS NULL OR ans.answer='{}' OR (ans.answer ? 'text' AND btrim(ans.answer->>'text')=''))`;
      if(empty!.n>0&&!b.confirmBlank)throw new ApiError(409,'CONFIRM_BLANK_REQUIRED');
    }
    await sql`SELECT learning.submit_attempt(${user},${attemptId},${k},${b.expectedVersion})`;return c.json(await dto(user,attemptId,false));
  });
  app.post('/v1/attempts/:id/cancel',async c=>{
    const user=c.get('principal').user_id,attemptId=id(c),b=await json(c,z.object({expectedVersion:version}).strict());await ownedAttempt(user,attemptId,false);
    const rows=await sql`UPDATE learning.attempts SET status='cancelled',cancelled_at=clock_timestamp(),cancel_reason='user_cancelled' WHERE id=${attemptId} AND user_id=${user} AND status='in_progress' AND row_version=${b.expectedVersion} RETURNING id`;if(!rows[0])throw new ApiError(409,'VERSION_CONFLICT');return c.json({cancelled:true});
  });
  async function itemOwner(user:string,itemId:string) {const [i]=await sql`SELECT i.attempt_id FROM learning.attempt_items i JOIN learning.attempts a ON a.id=i.attempt_id WHERE i.id=${itemId} AND a.user_id=${user}`;if(!i)throw new ApiError(404,'ITEM_NOT_FOUND');return ownedAttempt(user,i.attempt_id);}
  app.post('/v1/items/:id/check',async c=>{
    const user=c.get('principal').user_id,item=id(c),b=await json(c,z.object({answer:answerSchema,expectedVersion:z.number().int().min(0),attemptVersion:version}).strict()),k=key(c);
    const a=await itemOwner(user,item);await sql`SELECT learning.check_answer(${user},${item},${sql.json(b.answer)},${k},${b.expectedVersion},${b.attemptVersion})`;return c.json(await dto(user,a.id,false));
  });
  app.put('/v1/items/:id/answer',async c=>{
    const user=c.get('principal').user_id,item=id(c),b=await json(c,z.object({answer:answerSchema,expectedVersion:z.number().int().min(0),attemptVersion:version}).strict());const a=await itemOwner(user,item);
    if(a.kind!=='topic_test')throw new ApiError(409,'USE_CHECK_ENDPOINT');
    const result=await sql.begin(async tx=>{
      const [parent]=await tx`SELECT status,row_version FROM learning.attempts WHERE id=${a.id} AND user_id=${user} FOR UPDATE`;
      if(!parent||parent.status!=='in_progress'||Number(parent.row_version)!==b.attemptVersion)throw new ApiError(409,'VERSION_CONFLICT');
      const [old]=await tx`SELECT row_version FROM learning.attempt_answers WHERE attempt_item_id=${item}`;
      if(Number(old?.row_version??0)!==b.expectedVersion)throw new ApiError(409,'VERSION_CONFLICT');
      const [r]=await tx`INSERT INTO learning.attempt_answers(attempt_item_id,answer) VALUES(${item},${tx.json(b.answer)}) ON CONFLICT(attempt_item_id) DO UPDATE SET answer=EXCLUDED.answer,answered_at=clock_timestamp() RETURNING row_version`;
      const [p]=await tx`SELECT row_version FROM learning.attempts WHERE id=${a.id}`;return {answer_version:Number(r!.row_version),attempt_version:Number(p!.row_version)};
    });return c.json(result);
  });
  app.put('/v1/enrollment',async c=>{
    const user=c.get('principal').user_id,b=await json(c,z.object({course_id:uuid}).strict()),catalog=await contentCall<Catalog>(cfg,'/catalog');
    if(!catalog.courses.some(course=>course.id===b.course_id))throw new ApiError(404,'COURSE_NOT_FOUND');
    await sql.begin(async tx=>{await tx`SELECT pg_advisory_xact_lock(hashtextextended(${user},11))`;await tx`UPDATE learning.enrollments SET is_active=false WHERE user_id=${user} AND is_active`;await tx`INSERT INTO learning.enrollments(user_id,course_id,is_active) VALUES(${user},${b.course_id},true) ON CONFLICT(user_id,course_id) DO UPDATE SET is_active=true`;});return c.json({course_id:b.course_id});
  });
  app.post('/v1/lessons/:id/open',async c=>{
    const user=c.get('principal').user_id,lesson=id(c);await contentCall<LessonInfo>(cfg,`/lessons/${lesson}`);
    await sql.begin(async tx=>{await tx`INSERT INTO learning.lesson_progress(user_id,lesson_id) VALUES(${user},${lesson}) ON CONFLICT(user_id,lesson_id) DO UPDATE SET last_opened_at=clock_timestamp()`;await tx`INSERT INTO learning.lesson_daily_views(user_id,lesson_id,activity_date) VALUES(${user},${lesson},(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) ON CONFLICT DO NOTHING`;});return c.json({opened:true});
  });
  app.put('/v1/favorites/:id',async c=>{const lesson=id(c);await contentCall<LessonInfo>(cfg,`/lessons/${lesson}`);await sql`INSERT INTO learning.lesson_favorites(user_id,lesson_id) VALUES(${c.get('principal').user_id},${lesson}) ON CONFLICT DO NOTHING`;return c.json({saved:true});});
  app.delete('/v1/favorites/:id',async c=>{await sql`DELETE FROM learning.lesson_favorites WHERE user_id=${c.get('principal').user_id} AND lesson_id=${id(c)}`;return c.json({saved:false});});
  app.get('/v1/favorites',async c=>{
    const rows=await sql`SELECT lesson_id,created_at FROM learning.lesson_favorites WHERE user_id=${c.get('principal').user_id} ORDER BY created_at DESC,lesson_id`;
    const catalog=await contentCall<Catalog>(cfg,'/catalog'),lessons=catalog.courses.flatMap(c=>c.topics.flatMap(t=>t.lessons)),q=(c.req.query('q')??'').toLowerCase();
    const filtered=rows.map(r=>({...r,title:lessons.find(l=>l.id===r.lesson_id)?.title??'Nội dung không còn khả dụng',available:lessons.some(l=>l.id===r.lesson_id)})).filter(r=>r.title.toLowerCase().includes(q));
    return c.json({items:filtered.slice((page(c)-1)*20,page(c)*20),total:filtered.length,page:page(c)});
  });
  async function mistakes(user:string,topic?:string) {
    const rows=await sql`SELECT w.*,i.lesson_id,i.question_revision_id,i.public_snapshot,k.answer_snapshot,k.explanation_snapshot,k.transcript_snapshot FROM learning.wrong_questions w JOIN learning.attempt_items i ON i.id=w.source_attempt_item_id JOIN learning.attempt_item_keys k ON k.attempt_item_id=i.id WHERE w.user_id=${user} AND w.status='pending' AND (${topic??null}::uuid IS NULL OR i.public_snapshot->>'topic_id'=${topic??null}) ORDER BY w.last_failed_at,w.question_id`;
    const active=[];for(const r of rows) {
      if(await available(null,[r.lesson_id],[r.question_id]))active.push(r);
      else await sql`UPDATE learning.wrong_questions SET status='suppressed',suppressed_reason='content_unavailable' WHERE user_id=${user} AND question_id=${r.question_id} AND generation=${r.generation} AND status='pending'`;
    }return active;
  }
  app.get('/v1/mistakes',async c=>{const rows=await mistakes(c.get('principal').user_id,c.req.query('topic_id')?uuid.parse(c.req.query('topic_id')):undefined);return c.json({items:rows.slice((page(c)-1)*20,page(c)*20).map(r=>({question_id:r.question_id,lesson_id:r.lesson_id,prompt:r.public_snapshot.prompt,explanation:r.explanation_snapshot,generation:r.generation,last_failed_at:r.last_failed_at})),total:rows.length});});
  app.post('/v1/mistake-reviews',async c=>{
    const user=c.get('principal').user_id,b=await json(c,z.object({topic_id:uuid.optional()}).strict()),k=key(c),selected=(await mistakes(user,b.topic_id)).slice(0,10);
    const result=await dedup(user,'mistake_review.start',k,b,async tx=>{
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${user},11))`;
      const [existing]=await tx`SELECT id FROM learning.attempts WHERE user_id=${user} AND kind='mistake_review' AND status='in_progress'`;if(existing)return {attempt_id:existing.id};
      if(!selected.length)throw new ApiError(409,'NO_MISTAKES');
      for(const r of [...selected].sort((a,b)=>a.question_id.localeCompare(b.question_id))) {
        const [now]=await tx`SELECT generation,status FROM learning.wrong_questions WHERE user_id=${user} AND question_id=${r.question_id} FOR UPDATE`;
        if(!now||now.status!=='pending'||now.generation!==r.generation)throw new ApiError(409,'MISTAKES_CHANGED');
      }
      return createAttempt(tx,user,{kind:'mistake_review',title:'Ôn câu sai',items:selected.map((r,n)=>({question_id:r.question_id,question_revision_id:r.question_revision_id,lesson_id:r.lesson_id,position:n+1,public_snapshot:r.public_snapshot,answer_snapshot:r.answer_snapshot,explanation:r.explanation_snapshot,transcript:r.transcript_snapshot}))},new Map(selected.map(r=>[r.question_id,r.generation])));
    });return c.json(result,201);
  });
  app.post('/v1/flashcards',async c=>{
    const user=c.get('principal').user_id,b=await json(c,z.union([z.object({source_vocabulary_id:uuid,lesson_id:uuid}).strict(),z.object({word:text,meaning:text,example:z.string().max(10000).default('')}).strict()])),k=key(c);
    const source='source_vocabulary_id' in b?await contentCall<VocabularySnapshot>(cfg,`/vocabulary/${b.lesson_id}/${b.source_vocabulary_id}`):null;
    const result=await dedup(user,'flashcard.create',k,b,async tx=>{
      if(source) {
        const v=source.snapshot;
        await tx`INSERT INTO learning.flashcards(user_id,source_vocabulary_id,source_lesson_id,source_topic_id,source_course_id,word,meaning,example,phonetic,audio_asset_id) VALUES(${user},${source.vocabulary_id},${source.lesson_id},${source.topic_id},${source.course_id},${v.word},${v.meaning},${v.example},${v.phonetic??null},${v.audio_asset_id??null}) ON CONFLICT(user_id,source_vocabulary_id) DO UPDATE SET deleted_at=NULL WHERE learning.flashcards.deleted_at IS NOT NULL`;
        const [card]=await tx`SELECT id FROM learning.flashcards WHERE user_id=${user} AND source_vocabulary_id=${source.vocabulary_id}`;return {card_id:card!.id};
      }
      if(!('word' in b))throw new ApiError(400,'INVALID_CARD');const [card]=await tx`INSERT INTO learning.flashcards(user_id,word,meaning,example) VALUES(${user},${b.word},${b.meaning},${b.example}) RETURNING id`;return {card_id:card!.id};
    });return c.json(result,201);
  });
  app.get('/v1/flashcards',async c=>{
    const filter=z.enum(['all','new','due']).parse(c.req.query('filter')??'all'),topic=c.req.query('topic_id')?uuid.parse(c.req.query('topic_id')):null;
    const rows=await sql`SELECT id,word,meaning,example,phonetic,source_topic_id,stage,due_at,last_reviewed_at,row_version FROM learning.flashcards WHERE user_id=${c.get('principal').user_id} AND deleted_at IS NULL AND (${topic}::uuid IS NULL OR source_topic_id=${topic}) AND (${filter}='all' OR (${filter}='new' AND last_reviewed_at IS NULL) OR (${filter}='due' AND last_reviewed_at IS NOT NULL AND due_at<=now())) ORDER BY due_at,id LIMIT 20 OFFSET ${(page(c)-1)*20}`;return c.json({items:rows,page:page(c)});
  });
  app.patch('/v1/flashcards/:id',async c=>{
    const b=await json(c,z.object({word:text,meaning:text,example:z.string().max(10000),expectedVersion:version}).strict());
    const [r]=await sql`UPDATE learning.flashcards SET word=${b.word},meaning=${b.meaning},example=${b.example} WHERE id=${id(c)} AND user_id=${c.get('principal').user_id} AND deleted_at IS NULL AND row_version=${b.expectedVersion} RETURNING id,row_version,stage,due_at,reset_generation`;if(!r)throw new ApiError(409,'VERSION_CONFLICT');return c.json(r);
  });
  app.delete('/v1/flashcards/:id',async c=>{
    const b=await json(c,z.object({expectedVersion:version}).strict());const [r]=await sql`UPDATE learning.flashcards SET deleted_at=clock_timestamp() WHERE id=${id(c)} AND user_id=${c.get('principal').user_id} AND deleted_at IS NULL AND row_version=${b.expectedVersion} RETURNING id`;if(!r)throw new ApiError(409,'VERSION_CONFLICT');return c.json({deleted:true});
  });
  app.post('/v1/flashcard-sessions',async c=>{
    await json(c,z.object({}).strict());const user=c.get('principal').user_id,k=key(c);const result=await dedup(user,'flashcard_session.start',k,{},async tx=>{
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${user},11))`;
      const [old]=await tx`SELECT id FROM learning.flashcard_sessions WHERE user_id=${user} AND status='in_progress'`;if(old)return {session_id:old.id};
      const cards=await tx`SELECT * FROM learning.flashcards WHERE user_id=${user} AND deleted_at IS NULL AND due_at<=now() ORDER BY (last_reviewed_at IS NULL),CASE WHEN last_reviewed_at IS NOT NULL THEN due_at ELSE created_at END,id LIMIT 20 FOR UPDATE`;
      if(!cards.length)throw new ApiError(409,'NO_CARDS_DUE');const [session]=await tx`INSERT INTO learning.flashcard_sessions(user_id) VALUES(${user}) RETURNING id`;
      for(const [n,card] of cards.entries())await tx`INSERT INTO learning.flashcard_session_items(session_id,flashcard_id,user_id,position,reset_generation,card_snapshot) VALUES(${session!.id},${card.id},${user},${n+1},${card.reset_generation},${tx.json({word:card.word,meaning:card.meaning,example:card.example,phonetic:card.phonetic,audio_asset_id:card.audio_asset_id})})`;
      return {session_id:session!.id};
    });return c.json(result,201);
  });
  app.get('/v1/flashcard-sessions/:id',async c=>{
    const user=c.get('principal').user_id,sid=id(c);
    const result=await sql.begin(async tx=>{
      const [s]=await tx`SELECT id,status,started_at,finished_at,row_version FROM learning.flashcard_sessions WHERE id=${sid} AND user_id=${user} FOR UPDATE`;if(!s)throw new ApiError(404,'SESSION_NOT_FOUND');
      if(s.status==='in_progress') {
        const items=await tx`SELECT id,flashcard_id,reset_generation FROM learning.flashcard_session_items WHERE session_id=${sid} AND status='pending' ORDER BY flashcard_id FOR UPDATE`;
        for(const item of items) {
          const [card]=await tx`SELECT deleted_at,reset_generation FROM learning.flashcards WHERE id=${item.flashcard_id} FOR UPDATE`;
          if(card!.deleted_at||card!.reset_generation!==item.reset_generation)await tx`UPDATE learning.flashcard_session_items SET status='skipped',skip_reason=${card!.deleted_at?'card_deleted':'card_reset'} WHERE id=${item.id}`;
        }
        if(!(await tx`SELECT 1 FROM learning.flashcard_session_items WHERE session_id=${sid} AND status='pending' LIMIT 1`)[0]) {const [closed]=await tx`UPDATE learning.flashcard_sessions SET status='completed',finished_at=clock_timestamp() WHERE id=${sid} RETURNING status,finished_at,row_version`;Object.assign(s,closed);}
      }
      const items=await tx`SELECT id,position,card_snapshot,status,rating,reviewed_at,skip_reason FROM learning.flashcard_session_items WHERE session_id=${sid} ORDER BY position`;return {...s,items};
    });return c.json(result);
  });
  app.post('/v1/flashcard-items/:id/rate',async c=>{
    const b=await json(c,z.object({rating:z.enum(['remember','again'])}).strict()),[r]=await sql`SELECT learning.rate_flashcard(${c.get('principal').user_id},${id(c)},${b.rating},${key(c)}) AS result`;return c.json(r!.result);
  });
  app.post('/v1/flashcard-sessions/:id/cancel',async c=>{
    const b=await json(c,z.object({expectedVersion:version}).strict()),[r]=await sql`UPDATE learning.flashcard_sessions SET status='cancelled',finished_at=clock_timestamp() WHERE id=${id(c)} AND user_id=${c.get('principal').user_id} AND status='in_progress' AND row_version=${b.expectedVersion} RETURNING id`;if(!r)throw new ApiError(409,'VERSION_CONFLICT');return c.json({cancelled:true});
  });
  async function progress(user:string) {
    const catalog=await contentCall<Catalog>(cfg,'/catalog'),[enrollment]=await sql`SELECT course_id,last_seen_catalog_version FROM learning.enrollments WHERE user_id=${user} AND is_active`;
    const course=catalog.courses.find(c=>c.id===enrollment?.course_id);if(!course)return {course:null,topics:[],next_lesson_id:null,catalog_changed:false,completed:false};
    const rows=await sql`SELECT lesson_id,completed_at,last_opened_at FROM learning.lesson_progress WHERE user_id=${user}`;
    const tests=await sql`SELECT topic_id,bool_or(passed) AS passed FROM learning.attempts WHERE user_id=${user} AND kind='topic_test' AND status='submitted' GROUP BY topic_id`;
    const topics=course.topics.map(t=>{const lessons=t.lessons.map(l=>({...l,status:rows.find(p=>p.lesson_id===l.id)?.completed_at?'completed':rows.some(p=>p.lesson_id===l.id)?'in_progress':'not_started'}));const count=lessons.filter(l=>l.status==='completed').length,passed=!!tests.find(a=>a.topic_id===t.id)?.passed;return {...t,lessons,completed_count:count,total_count:lessons.length,percent:lessons.length?Math.round(count*100/lessons.length):null,test_passed:passed,completed:lessons.length>0&&count===lessons.length&&passed};});
    const unfinished=topics.flatMap(t=>t.lessons).filter(l=>l.status!=='completed'),recent=[...rows].sort((a,b)=>new Date(b.last_opened_at).getTime()-new Date(a.last_opened_at).getTime()).find(p=>unfinished.some(l=>l.id===p.lesson_id));
    const total=topics.reduce((s,t)=>s+t.total_count,0),done=topics.reduce((s,t)=>s+t.completed_count,0);
    return {course:{id:course.id,title:course.title,catalog_version:course.catalog_version},topics,next_lesson_id:recent?.lesson_id??unfinished[0]?.id??null,next_assessment_id:unfinished.length?null:topics.find(t=>!t.test_passed)?.assessment_id??null,catalog_changed:String(enrollment!.last_seen_catalog_version)!==String(course.catalog_version),completed:topics.length>0&&topics.every(t=>t.completed),percent:total?Math.round(done*100/total):null};
  }
  app.get('/v1/progress',async c=>c.json(await progress(c.get('principal').user_id)));
  app.post('/v1/catalog-seen',async c=>{
    const b=await json(c,z.object({course_id:uuid,catalog_version:version}).strict()),catalog=await contentCall<Catalog>(cfg,'/catalog');
    if(!catalog.courses.some(r=>r.id===b.course_id&&Number(r.catalog_version)===b.catalog_version))throw new ApiError(409,'CATALOG_CHANGED');
    await sql`UPDATE learning.enrollments SET last_seen_catalog_version=${b.catalog_version} WHERE user_id=${c.get('principal').user_id} AND course_id=${b.course_id}`;return c.json({seen:true});
  });
  app.get('/v1/today',async c=>{
    const user=c.get('principal').user_id,[cards]=await sql`SELECT count(*) FILTER(WHERE last_reviewed_at IS NULL)::int AS new_cards,count(*) FILTER(WHERE last_reviewed_at IS NOT NULL AND due_at<=now())::int AS due_cards FROM learning.flashcards WHERE user_id=${user} AND deleted_at IS NULL`;
    const pending=await mistakes(user),[session]=await sql`SELECT id FROM learning.flashcard_sessions WHERE user_id=${user} AND status='in_progress'`;
    return c.json({...cards,wrong_questions:pending.length,flashcard_session_id:session?.id??null,progress:await progress(user)});
  });
  app.get('/v1/flashcards/:id/audio',async c=>{
    const [card]=await sql`SELECT audio_asset_id FROM learning.flashcards WHERE id=${id(c)} AND user_id=${c.get('principal').user_id} AND deleted_at IS NULL`;
    if(!card)throw new ApiError(404,'CARD_NOT_FOUND');return c.json(card.audio_asset_id?await contentCall<{url:string|null}>(cfg,`/media/${card.audio_asset_id}`):{url:null});
  });
  reportRoutes(app,cfg,sql);
  return app;
}
