import { createHash,randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ApiError,baseApp,json,id,page,permission,internal,protect,principal,text,uuid,version,type Config,type DB,type Query } from '../../../packages/backend/src/http.js';
import type { AssessmentSnapshot,Catalog } from '../../../packages/backend/src/contracts.js';
import { draftRoutes } from './drafts.js';
import { expansionRoutes } from './expansion.js';

const block=z.discriminatedUnion('type',[
  z.object({id:text,type:z.literal('text'),body:text}).strict(),z.object({id:text,type:z.literal('grammar'),body:text}).strict(),
  z.object({id:text,type:z.literal('reading'),body:text,title:text.optional()}).strict(),
  z.object({id:text,type:z.literal('audio'),asset_id:uuid,transcript:text}).strict(),
  z.object({id:text,type:z.literal('vocabulary'),vocabulary_ids:z.array(uuid).min(1).max(100)}).strict()
]);
const questionBody=z.object({type:z.enum(['single_choice','fill_blank']),prompt:text,passage:text.nullable().default(null),audio_asset_id:uuid.nullable().default(null),
  options:z.array(z.object({option_key:z.string().min(1).max(10),text:text}).strict()).max(4).default([]),correct_option_key:z.string().max(10).nullable().default(null),accepted_answers:z.array(text).max(30).nullable().default(null),explanation:text,transcript:text.nullable().default(null)}).strict();
export function createContent(cfg:Config,sql:DB) {
  const app=baseApp(cfg,sql);
  function cmsTransaction<T>(fn:(tx:Query)=>Promise<T>) {return sql.begin(async tx=>{await tx`SELECT pg_advisory_xact_lock(19092026,1)`;return fn(tx);}) as Promise<T>;}
  async function lessonInfo(lessonId:string,db:Query=sql) {
    const [r]=await db`SELECT l.id,l.topic_id,t.course_id,r.title,r.id AS revision_id,l.is_preview,a.id AS assessment_id FROM content.lessons l JOIN content.topics t ON t.id=l.topic_id JOIN content.courses c ON c.id=t.course_id JOIN content.lesson_revisions r ON r.id=l.published_revision_id LEFT JOIN content.assessments a ON a.lesson_id=l.id AND a.status='published' WHERE l.id=${lessonId} AND l.status='published' AND t.status='published' AND c.status='published'`;
    if(!r) throw new ApiError(404,'CONTENT_UNAVAILABLE');return r;
  }
  async function signed(assetId:string) {
    const [asset]=await sql`SELECT bucket,object_key FROM content.media_assets WHERE id=${assetId} AND status='ready'`;
    if(!asset) return null;
    const r=await fetch(`${cfg.supabaseUrl}/storage/v1/object/sign/${asset.bucket}/${asset.object_key}`,{method:'POST',headers:{apikey:cfg.serviceKey,Authorization:`Bearer ${cfg.serviceKey}`,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:120}),signal:AbortSignal.timeout(5000)}).catch(()=>null);
    if(!r?.ok) return null;const result=await r.json() as {signedURL:string};return cfg.supabaseUrl+'/storage/v1'+result.signedURL;
  }
  async function catalog():Promise<Catalog> {
    const courses=await sql`SELECT id,title,level,description,objectives,catalog_version FROM content.courses WHERE status='published' ORDER BY position,id`;
    const topics=await sql`SELECT t.id,t.course_id,t.title,t.position,a.id AS assessment_id FROM content.topics t LEFT JOIN content.assessments a ON a.topic_id=t.id AND a.status='published' WHERE t.status='published' ORDER BY t.position,t.id`;
    const lessons=await sql`SELECT l.id,l.topic_id,r.title,l.position,l.is_preview FROM content.lessons l JOIN content.lesson_revisions r ON r.id=l.published_revision_id WHERE l.status='published' ORDER BY l.position,l.id`;
    return {courses:courses.map(c=>({...c,id:c.id,title:c.title,catalog_version:c.catalog_version,topics:topics.filter(t=>t.course_id===c.id).map(t=>({...t,id:t.id,title:t.title,assessment_id:t.assessment_id,lessons:lessons.filter(l=>l.topic_id===t.id).map(l=>({id:l.id,title:l.title,position:l.position,is_preview:l.is_preview}))}))}))};
  }
  app.get('/v1/catalog',async c=>c.json(await catalog()));
  app.get('/v1/lessons/:id',async c=>{
    const info=await lessonInfo(id(c));
    if(c.req.header('Authorization')) await principal(cfg,c);else if(!info.is_preview) throw new ApiError(401,'AUTH_REQUIRED');
    const [r]=await sql`SELECT id,title,objectives,blocks FROM content.lesson_revisions WHERE id=${info.revision_id}`;
    const vocab=await sql`SELECT vocabulary_id,position,snapshot FROM content.lesson_revision_vocabulary WHERE lesson_revision_id=${info.revision_id} ORDER BY position`;
    const blocks=await Promise.all((r!.blocks as Array<Record<string,unknown>>).map(async b=>({...b,...(b.type==='audio'?{audio_url:await signed(b.asset_id as string)}:{})})));
    return c.json({...info,objectives:r!.objectives,blocks,vocabulary:await Promise.all(vocab.map(async v=>({...v,snapshot:{...v.snapshot,audio_url:v.snapshot.audio_asset_id?await signed(v.snapshot.audio_asset_id):null}})))});
  });
  app.use('/internal/*',internal(cfg.contentToken));
  app.get('/internal/catalog',async c=>c.json(await catalog()));
  app.get('/internal/lessons/:id',async c=>c.json(await lessonInfo(id(c))));
  app.get('/internal/media/:id',async c=>c.json({url:await signed(id(c))}));
  app.get('/internal/vocabulary/:lesson/:id',async c=>{
    const info=await lessonInfo(id(c,'lesson'));
    const [r]=await sql`SELECT vocabulary_id,snapshot FROM content.lesson_revision_vocabulary WHERE lesson_revision_id=${info.revision_id} AND vocabulary_id=${id(c)}`;
    if(!r) throw new ApiError(404,'VOCABULARY_NOT_FOUND');return c.json({...r,lesson_id:info.id,topic_id:info.topic_id,course_id:info.course_id});
  });
  app.post('/internal/availability',async c=>{
    const b=await json(c,z.object({assessment_id:uuid.nullable().optional(),lesson_ids:z.array(uuid).max(30).default([]),question_ids:z.array(uuid).max(30).default([])}).strict());
    for(const lesson of new Set(b.lesson_ids)) {try {await lessonInfo(lesson);} catch(e) {if(e instanceof ApiError&&e.status===404)return c.json({available:false});throw e;}}
    if(b.assessment_id) {
      const [a]=await sql`SELECT status FROM content.assessments WHERE id=${b.assessment_id}`;
      if(!a||a.status!=='published') return c.json({available:false});
    }
    if(b.question_ids.length) {
      const rows=await sql`SELECT id FROM content.questions WHERE id IN ${sql([...new Set(b.question_ids)])} AND status='active'`;
      if(rows.length!==new Set(b.question_ids).size) return c.json({available:false});
    }
    return c.json({available:true});
  });
  app.get('/internal/assessments/:id',async c=>{
    const [a]=await sql`SELECT a.id,a.kind,a.lesson_id,a.topic_id,a.published_revision_id AS revision_id,r.title,r.passing_percent,r.grading_policy_version FROM content.assessments a JOIN content.assessment_revisions r ON r.id=a.published_revision_id WHERE a.id=${id(c)} AND a.status='published'`;
    if(!a) throw new ApiError(404,'CONTENT_UNAVAILABLE');
    const questions=await sql`SELECT aq.position,q.id AS question_id,q.lesson_id,q.status,qr.id AS question_revision_id,qr.type,qr.prompt,qr.passage,qr.audio_asset_id,k.correct_option_key,k.accepted_answers,k.explanation,k.transcript FROM content.assessment_revision_questions aq JOIN content.questions q ON q.id=aq.question_id JOIN content.question_revisions qr ON qr.id=aq.question_revision_id JOIN content.question_answer_keys k ON k.question_revision_id=qr.id WHERE aq.assessment_revision_id=${a.revision_id} ORDER BY aq.position`;
    const items=[];let courseId='',topicId='';
    for(const q of questions) {
      if(q.status!=='active') throw new ApiError(409,'CONTENT_UNAVAILABLE');const info=await lessonInfo(q.lesson_id);courseId=info.course_id;topicId=info.topic_id;
      const options=await sql`SELECT option_key,text FROM content.question_options WHERE question_revision_id=${q.question_revision_id} ORDER BY position`;
      items.push({question_id:q.question_id,question_revision_id:q.question_revision_id,lesson_id:q.lesson_id,position:q.position,
        public_snapshot:{type:q.type,prompt:q.prompt,passage:q.passage,audio_asset_id:q.audio_asset_id,options,lesson_title:info.title,topic_id:info.topic_id},
        answer_snapshot:q.type==='single_choice'?{type:q.type,correct_option_key:q.correct_option_key}:{type:q.type,accepted_answers:q.accepted_answers},explanation:q.explanation,transcript:q.transcript});
    }
    if(!items.length) throw new ApiError(409,'CONTENT_UNAVAILABLE');
    return c.json({id:a.id,revision_id:a.revision_id,kind:a.kind,lesson_id:a.lesson_id,topic_id:a.topic_id??topicId,course_id:courseId,title:a.title,passing_percent:a.passing_percent,grading_policy_version:a.grading_policy_version,items} as AssessmentSnapshot);
  });

  app.use('/v1/admin/*',protect(cfg));
  app.use('/v1/admin/*',async(c,next)=>{
    const p=c.get('principal');
    if(c.req.method==='GET') {if(p.role!=='admin'&&!p.permissions.some(v=>['content.write','content.publish'].includes(v)))throw new ApiError(403,'FORBIDDEN');}
    else permission(p,/\/(publish|status)$/.test(c.req.path)?'content.publish':'content.write');
    await next();
  });
  expansionRoutes(app,cfg,sql,signed);
  app.get('/v1/admin/catalog',async c=>c.json({courses:await sql`SELECT * FROM content.courses ORDER BY position,id`,topics:await sql`SELECT * FROM content.topics ORDER BY position,id`,lessons:await sql`SELECT * FROM content.lessons ORDER BY position,id`}));
  app.get('/v1/admin/vocabulary',async c=>c.json({items:await sql`SELECT * FROM content.vocabulary_entries ORDER BY word,id`}));
  app.get('/v1/admin/media',async c=>c.json({items:await sql`SELECT id,object_key,mime_type,size_bytes,status FROM content.media_assets WHERE status='ready' ORDER BY created_at DESC LIMIT 100`}));
  app.get('/v1/admin/assessment-revisions/:id',async c=>{
    const [r]=await sql`SELECT * FROM content.assessment_revisions WHERE id=${id(c)}`;if(!r)throw new ApiError(404,'REVISION_NOT_FOUND');
    return c.json({...r,question_revision_ids:(await sql`SELECT question_revision_id FROM content.assessment_revision_questions WHERE assessment_revision_id=${r.id} ORDER BY position`).map(q=>q.question_revision_id)});
  });
  app.post('/v1/admin/courses',async c=>{
    const b=await json(c,z.object({title:text,description:z.string().max(10000).default(''),objectives:z.string().max(10000).default(''),level:text,position:z.number().int().positive()}).strict());
    const [r]=await sql`INSERT INTO content.courses ${sql(b)} RETURNING id,row_version`;return c.json(r!,201);
  });
  app.post('/v1/admin/topics',async c=>{
    const b=await json(c,z.object({course_id:uuid,title:text,description:z.string().max(10000).default(''),objectives:z.string().max(10000).default(''),position:z.number().int().positive()}).strict());
    const [r]=await sql`INSERT INTO content.topics ${sql(b)} RETURNING id,row_version`;return c.json(r!,201);
  });
  app.post('/v1/admin/lessons',async c=>{
    const b=await json(c,z.object({topic_id:uuid,position:z.number().int().positive(),is_preview:z.boolean().default(false)}).strict());
    const [r]=await sql`INSERT INTO content.lessons ${sql(b)} RETURNING id,row_version`;return c.json(r!,201);
  });
  app.post('/v1/admin/vocabulary',async c=>{
    const b=await json(c,z.object({word:text,meaning:text,example:z.string().max(10000).default(''),phonetic:z.string().max(300).nullable().default(null),audio_asset_id:uuid.nullable().default(null)}).strict());
    const [r]=await sql`INSERT INTO content.vocabulary_entries ${sql(b)} RETURNING id,row_version`;return c.json(r!,201);
  });
  app.post('/v1/admin/lessons/:id/revisions',async c=>{
    const lesson=id(c),b=await json(c,z.object({title:text,objectives:text,blocks:z.array(block).min(1).max(100)}).strict());
    const result=await cmsTransaction(async tx=>{
      const [parent]=await tx`SELECT id FROM content.lessons WHERE id=${lesson} FOR UPDATE`;if(!parent)throw new ApiError(404,'LESSON_NOT_FOUND');
      const [r]=await tx`INSERT INTO content.lesson_revisions(lesson_id,revision_no,title,objectives,blocks,created_by) SELECT ${lesson},coalesce(max(revision_no),0)+1,${b.title},${b.objectives},${tx.json(b.blocks)},${c.get('principal').user_id} FROM content.lesson_revisions WHERE lesson_id=${lesson} RETURNING id,row_version`;
      const assets=new Set<string>(),vocabs=new Set<string>();for(const block of b.blocks) {if(block.type==='audio') assets.add(block.asset_id);if(block.type==='vocabulary')block.vocabulary_ids.forEach(v=>vocabs.add(v));}
      let position=0;for(const vocabId of vocabs) {
        const [v]=await tx`SELECT word,meaning,example,phonetic,audio_asset_id FROM content.vocabulary_entries WHERE id=${vocabId} AND status='active'`;if(!v)throw new ApiError(404,'VOCABULARY_NOT_FOUND');
        await tx`INSERT INTO content.lesson_revision_vocabulary(lesson_revision_id,vocabulary_id,position,snapshot) VALUES(${r!.id},${vocabId},${++position},${tx.json(v)})`;if(v.audio_asset_id)assets.add(v.audio_asset_id);
      }
      for(const asset of assets) await tx`INSERT INTO content.lesson_revision_assets(lesson_revision_id,asset_id) VALUES(${r!.id},${asset})`;
      await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'draft.create','lesson_revision',${r!.id},'{}')`;return r;
    });return c.json(result!,201);
  });
  async function makeQuestion(db:Query,question:string,b:z.infer<typeof questionBody>,actor:string) {
    const [r]=await db`INSERT INTO content.question_revisions(question_id,revision_no,type,prompt,passage,audio_asset_id,created_by) SELECT ${question},coalesce(max(revision_no),0)+1,${b.type},${b.prompt},${b.passage},${b.audio_asset_id},${actor} FROM content.question_revisions WHERE question_id=${question} RETURNING id,row_version`;
    for(const [n,o] of b.options.entries()) await db`INSERT INTO content.question_options(question_revision_id,option_key,text,position) VALUES(${r!.id},${o.option_key},${o.text},${n+1})`;
    await db`INSERT INTO content.question_answer_keys(question_revision_id,correct_option_key,accepted_answers,explanation,transcript) VALUES(${r!.id},${b.correct_option_key},${b.accepted_answers},${b.explanation},${b.transcript})`;return r!;
  }
  app.post('/v1/admin/questions',async c=>{
    const b=await json(c,questionBody.extend({lesson_id:uuid}));
    const result=await cmsTransaction(async tx=>{const [q]=await tx`INSERT INTO content.questions(lesson_id) VALUES(${b.lesson_id}) RETURNING id`;return {question_id:q!.id,...await makeQuestion(tx,q!.id,b,c.get('principal').user_id)};});return c.json(result,201);
  });
  app.post('/v1/admin/questions/:id/revisions',async c=>{
    const question=id(c),b=await json(c,questionBody);
    const result=await cmsTransaction(async tx=>{if(!(await tx`SELECT id FROM content.questions WHERE id=${question} FOR UPDATE`)[0])throw new ApiError(404,'QUESTION_NOT_FOUND');return makeQuestion(tx,question,b,c.get('principal').user_id);});return c.json(result,201);
  });
  app.get('/v1/admin/lessons/:id/revisions',async c=>c.json({items:await sql`SELECT id,revision_no,title,objectives,blocks,published_at,row_version FROM content.lesson_revisions WHERE lesson_id=${id(c)} ORDER BY revision_no DESC LIMIT 20`}));
  app.get('/v1/admin/questions',async c=>{
    const lesson=uuid.parse(c.req.query('lesson_id'));return c.json({items:await sql`SELECT q.id,q.status,qr.id AS revision_id,qr.revision_no,qr.type,qr.prompt,qr.published_at FROM content.questions q JOIN content.question_revisions qr ON qr.question_id=q.id WHERE q.lesson_id=${lesson} ORDER BY q.id,qr.revision_no DESC LIMIT 20 OFFSET ${(page(c)-1)*20}`});
  });
  app.post('/v1/admin/assessments',async c=>{
    const b=await json(c,z.object({kind:z.enum(['quiz','topic_test']),lesson_id:uuid.nullable().default(null),topic_id:uuid.nullable().default(null),title:text,question_revision_ids:z.array(uuid).min(1).max(20)}).strict());
    const result=await cmsTransaction(async tx=>{
      let [a]=await tx`SELECT id FROM content.assessments WHERE kind=${b.kind} AND (lesson_id=${b.lesson_id} OR topic_id=${b.topic_id}) FOR UPDATE`;
      if(!a) [a]=await tx`INSERT INTO content.assessments(kind,lesson_id,topic_id) VALUES(${b.kind},${b.lesson_id},${b.topic_id}) RETURNING id`;
      const [r]=await tx`INSERT INTO content.assessment_revisions(assessment_id,revision_no,title,created_by) SELECT ${a!.id},coalesce(max(revision_no),0)+1,${b.title},${c.get('principal').user_id} FROM content.assessment_revisions WHERE assessment_id=${a!.id} RETURNING id,row_version`;
      for(const [n,rev] of b.question_revision_ids.entries()) {
        const [q]=await tx`SELECT question_id FROM content.question_revisions WHERE id=${rev}`;if(!q)throw new ApiError(404,'QUESTION_NOT_FOUND');
        await tx`INSERT INTO content.assessment_revision_questions(assessment_revision_id,question_id,question_revision_id,position) VALUES(${r!.id},${q.question_id},${rev},${n+1})`;
      }return {assessment_id:a!.id,...r};
    });return c.json(result,201);
  });
  async function publishAssessment(tx:Query,assessment:string,revision:string) {
    const [r]=await tx`SELECT id FROM content.assessment_revisions WHERE id=${revision} AND assessment_id=${assessment} AND published_at IS NULL FOR UPDATE`;if(!r)throw new ApiError(409,'DRAFT_REQUIRED');
    await tx`UPDATE content.question_revisions SET published_at=clock_timestamp() WHERE id IN (SELECT question_revision_id FROM content.assessment_revision_questions WHERE assessment_revision_id=${revision}) AND published_at IS NULL`;
    await tx`UPDATE content.assessment_revisions SET published_at=clock_timestamp() WHERE id=${revision}`;
    await tx`UPDATE content.assessments SET status='published',published_revision_id=${revision} WHERE id=${assessment}`;
  }
  app.post('/v1/admin/lessons/:id/publish',async c=>{
    permission(c.get('principal'),'content.publish');const lesson=id(c),b=await json(c,z.object({lessonRevisionId:uuid,assessmentRevisionId:uuid,expectedVersion:version}).strict());
    await cmsTransaction(async tx=>{
      const [l]=await tx`SELECT * FROM content.lessons WHERE id=${lesson} FOR UPDATE`;if(!l)throw new ApiError(404,'LESSON_NOT_FOUND');if(Number(l.row_version)!==b.expectedVersion)throw new ApiError(409,'VERSION_CONFLICT');
      const [q]=await tx`SELECT id FROM content.assessments WHERE lesson_id=${lesson}`;if(!q)throw new ApiError(409,'QUIZ_REQUIRED');
      await publishAssessment(tx,q.id,b.assessmentRevisionId);
      const rows=await tx`UPDATE content.lesson_revisions SET published_at=clock_timestamp() WHERE id=${b.lessonRevisionId} AND lesson_id=${lesson} AND published_at IS NULL RETURNING id`;if(!rows[0])throw new ApiError(409,'DRAFT_REQUIRED');
      await tx`UPDATE content.lessons SET status='published',published_revision_id=${b.lessonRevisionId} WHERE id=${lesson}`;
      await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'publish','lesson',${lesson},${tx.json({revision_id:b.lessonRevisionId})})`;
    });return c.json({published:true});
  });
  app.post('/v1/admin/assessments/:id/publish',async c=>{
    permission(c.get('principal'),'content.publish');const assessment=id(c),b=await json(c,z.object({revisionId:uuid,expectedVersion:version}).strict());
    await cmsTransaction(async tx=>{const [a]=await tx`SELECT row_version FROM content.assessments WHERE id=${assessment} FOR UPDATE`;if(!a)throw new ApiError(404,'ASSESSMENT_NOT_FOUND');if(Number(a.row_version)!==b.expectedVersion)throw new ApiError(409,'VERSION_CONFLICT');await publishAssessment(tx,assessment,b.revisionId);await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'publish','assessment',${assessment},${tx.json({revision_id:b.revisionId})})`;});return c.json({published:true});
  });
  app.patch('/v1/admin/:entity/:id/status',async c=>{
    permission(c.get('principal'),'content.publish');const entity=z.enum(['courses','topics','lessons','assessments','questions']).parse(c.req.param('entity')),target=id(c);
    const b=await json(c,z.object({status:z.enum(['published','hidden','active','invalid']),expectedVersion:version}).strict());
    if(entity==='questions'?!['active','hidden','invalid'].includes(b.status):!['published','hidden'].includes(b.status))throw new ApiError(400,'INVALID_STATUS');
    const result=await cmsTransaction(async tx=>{const rows=await tx.unsafe(`UPDATE content.${entity} SET status=$1 WHERE id=$2 AND row_version=$3 RETURNING id,status,row_version`,[b.status,target,b.expectedVersion]);if(!rows[0])throw new ApiError(409,'VERSION_CONFLICT');await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'status',${entity},${target},${tx.json({status:b.status})})`;return rows[0];});return c.json(result!);
  });
  app.post('/v1/admin/media',async c=>{
    const mime=c.req.header('Content-Type')??'',bytes=Buffer.from(await c.req.arrayBuffer());
    if(bytes.length===0||bytes.length>10485760)throw new ApiError(413,'INVALID_MEDIA_SIZE');
    const mp3=bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===255&&((bytes[1]??0)&224)===224),m4a=bytes.subarray(4,8).toString()==='ftyp';
    if(!((mime==='audio/mpeg'&&mp3)||(['audio/mp4','audio/x-m4a'].includes(mime)&&m4a)))throw new ApiError(400,'INVALID_MEDIA_TYPE');
    const checksum=createHash('sha256').update(bytes).digest('hex'),objectKey=`uploads/${randomUUID()}.${mp3?'mp3':'m4a'}`;
    const response=await fetch(`${cfg.supabaseUrl}/storage/v1/object/learning-media/${objectKey}`,{method:'POST',headers:{apikey:cfg.serviceKey,Authorization:`Bearer ${cfg.serviceKey}`,'Content-Type':mime,'x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw new ApiError(503,'STORAGE_UNAVAILABLE');
    const [r]=await sql`INSERT INTO content.media_assets(bucket,object_key,mime_type,size_bytes,checksum,uploaded_by) VALUES('learning-media',${objectKey},${mime},${bytes.length},${checksum},${c.get('principal').user_id}) RETURNING id,mime_type,size_bytes`;return c.json(r!,201);
  });
  draftRoutes(app,sql,block);
  return app;
}
