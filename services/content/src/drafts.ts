import { z } from 'zod';
import { ApiError,id,json,text,uuid,version,type App,type DB,type Query } from '../../../packages/backend/src/http.js';

export function draftRoutes(app:App,sql:DB,block:z.ZodType) {
  function transaction<T>(fn:(tx:Query)=>Promise<T>) {return sql.begin(async tx=>{await tx`SELECT pg_advisory_xact_lock(19092026,1)`;return fn(tx);}) as Promise<T>;}
  async function lock(tx:Query,entity:string,rev:string,v:number) {
    const [row]=await tx.unsafe(`SELECT published_at,row_version FROM content.${entity} WHERE id=$1 FOR UPDATE`,[rev]);
    if(!row)throw new ApiError(404,'REVISION_NOT_FOUND');if(row.published_at)throw new ApiError(409,'DRAFT_REQUIRED');if(Number(row.row_version)!==v)throw new ApiError(409,'VERSION_CONFLICT');
  }
  app.get('/v1/admin/question-revisions/:id',async c=>{
    const [r]=await sql`SELECT qr.*,k.correct_option_key,k.accepted_answers,k.explanation,k.transcript FROM content.question_revisions qr LEFT JOIN content.question_answer_keys k ON k.question_revision_id=qr.id WHERE qr.id=${id(c)}`;
    if(!r)throw new ApiError(404,'REVISION_NOT_FOUND');return c.json({...r,options:await sql`SELECT option_key,text,position FROM content.question_options WHERE question_revision_id=${r.id} ORDER BY position`});
  });
  app.patch('/v1/admin/question-revisions/:id',async c=>{
    const rev=id(c),b=await json(c,z.object({type:z.enum(['single_choice','fill_blank']),prompt:text,passage:text.nullable().default(null),audio_asset_id:uuid.nullable().default(null),options:z.array(z.object({option_key:z.string().min(1).max(10),text:text}).strict()).max(4).default([]),correct_option_key:z.string().max(10).nullable().default(null),accepted_answers:z.array(text).max(30).nullable().default(null),explanation:text,transcript:text.nullable().default(null),expectedVersion:version}).strict());
    const result=await transaction(async tx=>{
      await lock(tx,'question_revisions',rev,b.expectedVersion);
      await tx`DELETE FROM content.question_answer_keys WHERE question_revision_id=${rev}`;await tx`DELETE FROM content.question_options WHERE question_revision_id=${rev}`;
      const [r]=await tx`UPDATE content.question_revisions SET type=${b.type},prompt=${b.prompt},passage=${b.passage},audio_asset_id=${b.audio_asset_id} WHERE id=${rev} RETURNING id,row_version`;
      for(const [n,o] of b.options.entries())await tx`INSERT INTO content.question_options(question_revision_id,option_key,text,position) VALUES(${rev},${o.option_key},${o.text},${n+1})`;
      await tx`INSERT INTO content.question_answer_keys(question_revision_id,correct_option_key,accepted_answers,explanation,transcript) VALUES(${rev},${b.correct_option_key},${b.accepted_answers},${b.explanation},${b.transcript})`;
      await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'draft.update','question_revision',${rev},'{}')`;return r;
    });return c.json(result!);
  });
  app.patch('/v1/admin/lesson-revisions/:id',async c=>{
    const rev=id(c),b=await json(c,z.object({title:text,objectives:text,blocks:z.array(block).min(1).max(100),expectedVersion:version}).strict());
    const blocks=b.blocks as Array<{type:string;asset_id?:string;vocabulary_ids?:string[]}>;
    const result=await transaction(async tx=>{
      await lock(tx,'lesson_revisions',rev,b.expectedVersion);
      await tx`DELETE FROM content.lesson_revision_vocabulary WHERE lesson_revision_id=${rev}`;await tx`DELETE FROM content.lesson_revision_assets WHERE lesson_revision_id=${rev}`;
      const [r]=await tx`UPDATE content.lesson_revisions SET title=${b.title},objectives=${b.objectives},blocks=${tx.json(blocks)} WHERE id=${rev} RETURNING id,row_version`;
      const assets=new Set<string>(),vocabs=new Set<string>();for(const block of blocks){if(block.type==='audio')assets.add(block.asset_id!);if(block.type==='vocabulary')block.vocabulary_ids!.forEach(v=>vocabs.add(v));}
      let n=0;for(const vocab of vocabs){const [v]=await tx`SELECT word,meaning,example,phonetic,audio_asset_id FROM content.vocabulary_entries WHERE id=${vocab} AND status='active'`;if(!v)throw new ApiError(404,'VOCABULARY_NOT_FOUND');await tx`INSERT INTO content.lesson_revision_vocabulary(lesson_revision_id,vocabulary_id,position,snapshot) VALUES(${rev},${vocab},${++n},${tx.json(v)})`;if(v.audio_asset_id)assets.add(v.audio_asset_id);}
      for(const asset of assets)await tx`INSERT INTO content.lesson_revision_assets(lesson_revision_id,asset_id) VALUES(${rev},${asset})`;
      await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'draft.update','lesson_revision',${rev},'{}')`;return r;
    });return c.json(result!);
  });
  app.get('/v1/admin/assessments',async c=>c.json({items:await sql`SELECT a.id,a.kind,a.lesson_id,a.topic_id,a.status,a.row_version,r.id AS revision_id,r.revision_no,r.title,r.published_at,r.row_version AS revision_version FROM content.assessments a JOIN content.assessment_revisions r ON r.assessment_id=a.id ORDER BY a.created_at DESC,r.revision_no DESC LIMIT 100`}));
  app.patch('/v1/admin/assessment-revisions/:id',async c=>{
    const rev=id(c),b=await json(c,z.object({title:text,question_revision_ids:z.array(uuid).min(1).max(20),expectedVersion:version}).strict());
    const result=await transaction(async tx=>{
      await lock(tx,'assessment_revisions',rev,b.expectedVersion);await tx`DELETE FROM content.assessment_revision_questions WHERE assessment_revision_id=${rev}`;
      for(const [n,qr] of b.question_revision_ids.entries()){const [q]=await tx`SELECT question_id FROM content.question_revisions WHERE id=${qr}`;if(!q)throw new ApiError(404,'QUESTION_NOT_FOUND');await tx`INSERT INTO content.assessment_revision_questions(assessment_revision_id,question_id,question_revision_id,position) VALUES(${rev},${q.question_id},${qr},${n+1})`;}
      const [r]=await tx`UPDATE content.assessment_revisions SET title=${b.title} WHERE id=${rev} RETURNING id,row_version`;
      await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'draft.update','assessment_revision',${rev},'{}')`;return r;
    });return c.json(result!);
  });
  app.patch('/v1/admin/:entity/:id/metadata',async c=>{
    const entity=z.enum(['courses','topics','lessons','vocabulary_entries']).parse(c.req.param('entity')),target=id(c);
    const schemas={courses:z.object({title:text,description:z.string().max(10000),objectives:z.string().max(10000),level:text,position:z.number().int().positive(),expectedVersion:version}).strict(),
      topics:z.object({title:text,description:z.string().max(10000),objectives:z.string().max(10000),position:z.number().int().positive(),expectedVersion:version}).strict(),
      lessons:z.object({position:z.number().int().positive(),is_preview:z.boolean(),expectedVersion:version}).strict(),
      vocabulary_entries:z.object({word:text,meaning:text,example:z.string().max(10000),phonetic:z.string().max(300).nullable(),audio_asset_id:uuid.nullable(),status:z.enum(['active','hidden']),expectedVersion:version}).strict()};
    const {expectedVersion,...fields}=schemas[entity].parse(await c.req.json()),entries=Object.entries(fields);
    const result=await transaction(async tx=>{
      const rows=await tx.unsafe(`UPDATE content.${entity} SET ${entries.map(([k],n)=>`"${k}"=$${n+1}`).join(',')} WHERE id=$${entries.length+1} AND row_version=$${entries.length+2} RETURNING id,row_version`,[...entries.map(([,v])=>v),target,expectedVersion]);
      if(!rows[0])throw new ApiError(409,'VERSION_CONFLICT');await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${c.get('principal').user_id},'metadata.update',${entity},${target},'{}')`;return rows[0];
    });return c.json(result!);
  });
}
