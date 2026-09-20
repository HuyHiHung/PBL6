import { randomBytes,createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { localStatus,database,readLocal,writeLocal,apiRequest } from './local-lib.mjs';
const status=localStatus(),sql=database(status.DB_URL),saved=readLocal('bootstrap.json');
const uid=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
try {
  const users=[];
  for(let page=1;;page++) {
    const response=await (await apiRequest(status,`/auth/v1/admin/users?page=${page}&per_page=100`)).json();
    const batch=response.users ?? []; users.push(...batch); if(batch.length<100) break;
  }
  for(const role of ['admin','editor','learner']) {
    const email=`${role}@pbl6.local.test`;
    let user=users.find(u=>u.email===email);
    if(!user) {
      const password=randomBytes(24).toString('base64url')+'aA1!';
      user=await (await apiRequest(status,'/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true}})).json();
      saved[role]={id:user.id,email,password};
      writeLocal('bootstrap.json',saved);
    } else if(!saved[role]) saved[role]={id:user.id,email};
    if(saved[role].id!==user.id) throw new Error(`Fixture identity changed for ${role}; inspect local bootstrap state`);
  }
  writeLocal('bootstrap.json',saved);
  await sql.begin(async tx=>{
    for(const role of ['admin','editor','learner']) {
      const u=saved[role];
      await tx`INSERT INTO identity.profiles(user_id,display_name,email_cached,role) VALUES(${u.id},${`Local ${role}`},${u.email},${role}) ON CONFLICT(user_id) DO NOTHING`;
    }
    await tx`INSERT INTO identity.editor_permissions(user_id,permission_code,granted_by) VALUES(${saved.editor.id},'content.write',${saved.admin.id}) ON CONFLICT DO NOTHING`;
  });
  await sql.begin(tx=>tx.unsafe(readFileSync('supabase/seed.sql','utf8')));
  try { await apiRequest(status,'/storage/v1/bucket/learning-media'); }
  catch(error) {
    if(error.status!==404 && error.status!==400) throw error;
    await apiRequest(status,'/storage/v1/bucket',{method:'POST',body:{id:'learning-media',name:'learning-media',public:false,file_size_limit:10485760,allowed_mime_types:['audio/mpeg','audio/mp4','audio/x-m4a']}});
  }
  // Valid MPEG-1 Layer III silence frames. Connectivity fixture, not language-learning audio.
  const frame=Buffer.alloc(417); frame.writeUInt32BE(0xfffb9000,0);
  const bytes=Buffer.concat(Array.from({length:20},()=>frame));
  const checksum=createHash('sha256').update(bytes).digest('hex');
  const objectKey=`local-fixtures/${checksum}.mp3`;
  try {
    const existing=await apiRequest(status,`/storage/v1/object/authenticated/learning-media/${objectKey}`);
    if(createHash('sha256').update(Buffer.from(await existing.arrayBuffer())).digest('hex')!==checksum) throw new Error('Immutable media checksum mismatch');
  } catch(error) {
    if(error.status!==404 && error.status!==400) throw error;
    await apiRequest(status,`/storage/v1/object/learning-media/${objectKey}`,{method:'POST',bytes,headers:{'Content-Type':'audio/mpeg','x-upsert':'false'}});
  }
  const existing=await sql`SELECT id FROM content.lessons WHERE id=${uid(10)}`;
  if(existing.length===0) await sql.begin(async tx=>{
    const author=saved.admin.id;
    await tx`INSERT INTO content.media_assets(id,bucket,object_key,mime_type,size_bytes,checksum,source,uploaded_by) VALUES(${uid(4)},'learning-media',${objectKey},'audio/mpeg',${bytes.length},${checksum},'Generated silence for local Storage smoke test',${author})`;
    await tx`INSERT INTO content.lessons(id,topic_id,position,is_preview) VALUES(${uid(10)},${uid(2)},1,true)`;
    await tx`INSERT INTO content.lesson_revisions(id,lesson_id,revision_no,title,objectives,blocks,created_by) VALUES(${uid(11)},${uid(10)},1,'Hello and introductions','Recognize simple greetings.',${tx.json([{id:'intro',type:'text',body:'Hello! My name is Linh. Nice to meet you.'},{id:'vocab',type:'vocabulary',vocabulary_ids:[uid(3)]},{id:'audio-test',type:'audio',asset_id:uid(4),transcript:'[Silent fixture to verify local Storage; not lesson narration.]'}])},${author})`;
    await tx`INSERT INTO content.lesson_revision_assets(lesson_revision_id,asset_id) VALUES(${uid(11)},${uid(4)})`;
    await tx`INSERT INTO content.lesson_revision_vocabulary(lesson_revision_id,vocabulary_id,position,snapshot) VALUES(${uid(11)},${uid(3)},1,${tx.json({word:'hello',meaning:'xin chào',example:'Hello, my name is Linh.',phonetic:null,audio_asset_id:null})})`;
    await tx`INSERT INTO content.assessments(id,kind,lesson_id) VALUES(${uid(12)},'quiz',${uid(10)})`;
    await tx`INSERT INTO content.assessment_revisions(id,assessment_id,revision_no,title,created_by) VALUES(${uid(13)},${uid(12)},1,'Greetings quiz',${author})`;
    const prompts=['Which word is a greeting?','Choose a polite reply to Hello.','Complete: My ___ is Linh.','Type the greeting: good morning','Type the word: hello'];
    for(let n=0;n<5;n++) {
      const q=uid(20+n),rev=uid(30+n),choice=n<3;
      await tx`INSERT INTO content.questions(id,lesson_id) VALUES(${q},${uid(10)})`;
      await tx`INSERT INTO content.question_revisions(id,question_id,revision_no,type,prompt,created_by) VALUES(${rev},${q},1,${choice?'single_choice':'fill_blank'},${prompts[n]},${author})`;
      if(choice) {
        await tx`INSERT INTO content.question_options(question_revision_id,option_key,text,position) VALUES(${rev},'A',${['Hello','Hello!','name'][n]},1),(${rev},'B',${['Table','Blue','chair'][n]},2)`;
        await tx`INSERT INTO content.question_answer_keys(question_revision_id,correct_option_key,explanation) VALUES(${rev},'A','The first option correctly completes this example.')`;
      } else await tx`INSERT INTO content.question_answer_keys(question_revision_id,accepted_answers,explanation) VALUES(${rev},${n===3?['good morning']:['hello']},'Match the greeting, ignoring letter case and repeated spaces.')`;
      await tx`UPDATE content.question_revisions SET published_at=now() WHERE id=${rev}`;
      await tx`INSERT INTO content.assessment_revision_questions(assessment_revision_id,question_id,question_revision_id,position) VALUES(${uid(13)},${q},${rev},${n+1})`;
    }
    await tx`UPDATE content.lesson_revisions SET published_at=now() WHERE id=${uid(11)}`;
    await tx`UPDATE content.assessment_revisions SET published_at=now() WHERE id=${uid(13)}`;
    await tx`UPDATE content.assessments SET published_revision_id=${uid(13)},status='published' WHERE id=${uid(12)}`;
    await tx`UPDATE content.lessons SET published_revision_id=${uid(11)},status='published' WHERE id=${uid(10)}`;
    await tx`UPDATE content.topics SET status='published' WHERE id=${uid(2)}`;
    await tx`UPDATE content.courses SET status='published' WHERE id=${uid(1)}`;
    await tx`INSERT INTO content.audit_events(actor_user_id,action,entity_type,entity_id,changes) VALUES(${author},'local.bootstrap','lesson',${uid(10)},'{}')`;
  });
  await sql.begin(async tx=>{
    await tx`INSERT INTO learning.enrollments(user_id,course_id,is_active) VALUES(${saved.learner.id},${uid(1)},true) ON CONFLICT DO NOTHING`;
    await tx`INSERT INTO learning.flashcards(user_id,source_vocabulary_id,source_lesson_id,source_topic_id,source_course_id,word,meaning,example) VALUES(${saved.learner.id},${uid(3)},${uid(10)},${uid(2)},${uid(1)},'hello','xin chào','Hello, my name is Linh.') ON CONFLICT DO NOTHING`;
  });
  console.log('Bootstrap complete: 3 Auth users/profiles, 1 lesson + 5-question quiz, 1 private MP3 fixture, 1 learner card.');
  console.log('Local credentials: .local/bootstrap.json (gitignored). Reruns preserve existing users and learning data.');
} finally { await sql.end(); }
