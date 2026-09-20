import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// Fixed UUIDv5 namespace. Never change it after the first import.
const namespace=Buffer.from('6be9905d70f45434a8b5c6750bd95f31','hex');
export function stableId(kind,key) {
  const bytes=createHash('sha1').update(namespace).update(`${kind}:${key}`).digest().subarray(0,16);
  bytes[6]=(bytes[6]&15)|80; bytes[8]=(bytes[8]&63)|128;
  const h=bytes.toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export const canonical = value => JSON.stringify(sort(value));
function sort(value) {
  if(Array.isArray(value)) return value.map(sort);
  if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])]));
  return value;
}
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
// Order also determines insertion order. Only these tables may be written.
export const tableKeys={
  courses:['id'], topics:['id'], lessons:['id'], vocabulary_entries:['id'],
  lesson_revisions:['id'], lesson_revision_vocabulary:['lesson_revision_id','vocabulary_id'],
  questions:['id'], question_revisions:['id'], question_options:['question_revision_id','option_key'],
  question_answer_keys:['question_revision_id'], assessments:['id'], assessment_revisions:['id'],
  assessment_revision_questions:['assessment_revision_id','question_id'],
};
export function compileImportPlan(results) {
  const packages=results.map(({profile,pack},courseIndex)=>{
    const rows=Object.fromEntries(Object.keys(tableKeys).map(t=>[t,[]]));
    const keys=[];
    const identify=(kind,key)=>{
      const id=stableId(kind,key); keys.push({kind,key,id}); return id;
    };
    const course=pack.course, courseId=identify('course',course.key);
    const referenceText=(pack.references??[]).map(r=>`${r.title}: ${r.url}`).join('\n');
    rows.courses.push({id:courseId,title:course.title,description:[course.description,`Thời lượng gợi ý: ${course.estimated_minutes} phút.`,pack.provenance,referenceText].filter(Boolean).join('\n\n'),objectives:course.objectives,level:course.level,position:100+courseIndex,status:'draft'});
    for(const [topicIndex,topic] of course.topics.entries()) {
      const topicId=identify('topic',topic.key);
      rows.topics.push({id:topicId,course_id:courseId,title:topic.title,description:'Học liệu tiếng Anh kỹ thuật; kiểm tra chủ đề gồm 10 câu.',objectives:topic.objectives,position:topicIndex+1,status:'draft'});
      const lessonIds=new Map(topic.lessons.map(l=>[l.key,stableId('lesson',l.key)]));
      for(const [lessonIndex,lesson] of topic.lessons.entries()) {
        const lessonId=identify('lesson',lesson.key);
        const revisionId=identify('lesson_revision',`${lesson.key}:1`);
        rows.lessons.push({id:lessonId,topic_id:topicId,position:lessonIndex+1,is_preview:false,status:'draft'});
        const vocabIds=[];
        for(const [i,v] of lesson.vocabulary.entries()) {
          const vocabId=identify('vocabulary',v.key); vocabIds.push(vocabId);
          const snapshot={word:v.word,meaning:v.meaning,example:`${v.example}\n${v.example_vi}`,phonetic:null,audio_asset_id:null};
          rows.vocabulary_entries.push({id:vocabId,...snapshot,source:`Sprout technical demo v1; ${profile.slug}; ${v.key}`,status:'active'});
          rows.lesson_revision_vocabulary.push({lesson_revision_id:revisionId,vocabulary_id:vocabId,position:i+1,snapshot});
        }
        const blocks=[
          {id:'orientation',type:'text',body:`Mục tiêu: ${lesson.objectives}\nThời lượng gợi ý: ${lesson.estimated_minutes} phút.\nHọc liệu văn bản; hội thoại đọc phân vai, chưa có audio. Sơ đồ/video được nhắc đến là tình huống mô tả trong bài.`},
          {id:'vocabulary',type:'vocabulary',vocabulary_ids:vocabIds},
          {id:'vocabulary-notes',type:'text',body:lesson.vocabulary.map(v=>`${v.word} (${v.part_of_speech})\nCụm thường dùng: ${v.collocation}\n${v.example}\n${v.example_vi}`).join('\n\n')},
          {id:'grammar',type:'grammar',body:lesson.grammar},
          {id:'reading',type:'reading',title:'Đọc trong ngữ cảnh',body:lesson.reading},
          {id:'reading-task',type:'text',body:`Hoạt động đọc có hướng dẫn:\n${lesson.reading_task}`},
          ...(lesson.dialogue?[{id:'dialogue',type:'text',body:`Hội thoại đọc phân vai:\n${lesson.dialogue}`}]:[]),
          {id:'practice',type:'text',body:`Thực hành tự luyện — không chấm tự động:\n${lesson.practice}`},
        ];
        rows.lesson_revisions.push({id:revisionId,lesson_id:lessonId,revision_no:1,title:lesson.title,objectives:lesson.objectives,blocks});
        addAssessment('quiz',lesson.key,lessonId,null,`${lesson.title} — Quiz`,lesson.quiz,lesson.reading);
      }
      addAssessment('topic_test',topic.key,null,topicId,`${topic.title} — Topic Test`,topic.test,topic.test_passage,lessonIds);
    }
    function addAssessment(kind,key,lessonId,topicId,title,questions,passage,lessonIds) {
      const assessmentId=identify('assessment',`${kind}:${key}`);
      const assessmentRevisionId=identify('assessment_revision',`${kind}:${key}:1`);
      rows.assessments.push({id:assessmentId,kind,lesson_id:lessonId,topic_id:topicId,status:'draft'});
      rows.assessment_revisions.push({id:assessmentRevisionId,assessment_id:assessmentId,revision_no:1,title,passing_percent:70,grading_policy_version:1});
      for(const [i,q] of questions.entries()) {
        const ownerLesson=kind==='quiz'?lessonId:lessonIds.get(q.lesson_key);
        assert(ownerLesson,'Question lesson must belong to the assessment topic');
        const qid=identify('question',q.key), qrid=identify('question_revision',`${q.key}:1`);
        rows.questions.push({id:qid,lesson_id:ownerLesson,status:'active'});
        rows.question_revisions.push({id:qrid,question_id:qid,revision_no:1,type:q.type,prompt:q.prompt,passage:q.use_reading?passage:null,audio_asset_id:null});
        if(q.type==='single_choice') for(const [n,text] of q.options.entries()) rows.question_options.push({question_revision_id:qrid,option_key:String.fromCharCode(65+n),text,position:n+1});
        rows.question_answer_keys.push({question_revision_id:qrid,correct_option_key:q.type==='single_choice'?q.answer:null,accepted_answers:q.type==='fill_blank'?q.answers:null,explanation:q.explanation,transcript:null});
        rows.assessment_revision_questions.push({assessment_revision_id:assessmentRevisionId,question_id:qid,question_revision_id:qrid,position:i+1});
      }
    }
    // Keep every text field within the API's 10,000-character input ceiling.
    function checkText(value) {
      if(typeof value==='string') assert(value.length<=10000,'Mapped text exceeds the Content API limit');
      else if(value && typeof value==='object') Object.values(value).forEach(checkText);
    }
    checkText(rows);
    const sourceHash=digest(pack);
    return {slug:profile.slug,course_key:course.key,course_id:courseId,source_sha256:sourceHash,
      mapping_sha256:digest(rows),receipt_id:stableId('import_receipt',course.key),keys,rows};
  });
  const counts=Object.fromEntries(Object.keys(tableKeys).map(t=>[t,packages.reduce((n,p)=>n+p.rows[t].length,0)]));
  const body={importer_version:1,target:'pbl6-local',mode:'draft-only',packages,counts};
  return {...body,plan_sha256:digest(body)};
}
