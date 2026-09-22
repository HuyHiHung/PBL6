import assert from 'node:assert/strict';
import { stableId, digest, tableKeys } from './materials-import-plan.mjs';
import { loadToeicCatalog } from './render-toeic-materials.mjs';

export function compileToeicImportPlan(results = loadToeicCatalog()) {
  const packages = results.map(({slug,pack}, ci) => {
    const rows = Object.fromEntries(Object.keys(tableKeys).map(t => [t, []]));
    const keys = [], groups = [];
    const id = (kind,key) => { const value = stableId(kind,key); keys.push({kind,key,id:value}); return value; };
    const courseId = id('course',pack.key);
    rows.courses.push({id:courseId,title:pack.title,description:[pack.target,pack.provenance,pack.scope_note, 'Import bản nháp: Listening thiếu media; quiz Part 1/5 chưa đáp ứng giới hạn xuất bản hiện tại. Chưa có trình thi TOEIC theo nhóm.', ...pack.references.map(r => `${r.title}: ${r.url}`)].join('\n\n'),objectives:pack.progression,level:`TOEIC ${pack.band.min}–${pack.band.max}`,position:110+ci,status:'draft'});
    for (const [si,section] of ['Listening','Reading'].entries()) {
      const topicId = id('topic',`${pack.key}-${section.toLowerCase()}`);
      rows.topics.push({id:topicId,course_id:courseId,title:section,description:section === 'Listening' ? 'Kịch bản chờ thu âm; Part 1 còn thiếu ảnh. Chưa dùng để đánh giá nghe.' : 'Bài tập đọc theo Part, không quy đổi điểm TOEIC.',objectives:pack.target,position:si+1,status:'draft'});
      const units = pack.units.filter(u => (u.part <= 4) === (si === 0));
      for (const [ui,u] of units.entries()) {
        const lessonId = id('lesson',u.key), revisionId = id('lesson_revision',`${u.key}:1`);
        rows.lessons.push({id:lessonId,topic_id:topicId,position:ui+1,is_preview:false,status:'draft'});
        const vocabularyIds = [];
        for (const [vi,v] of u.vocabulary.entries()) {
          const vid = id('vocabulary',v.key); vocabularyIds.push(vid);
          const snapshot = {word:v.word,meaning:v.meaning,example:`${v.example}\n${v.example_vi}`,phonetic:null,audio_asset_id:null};
          rows.vocabulary_entries.push({id:vid,...snapshot,source:`Sprout TOEIC; ${slug}; ${v.key}`,status:'active'});
          rows.lesson_revision_vocabulary.push({lesson_revision_id:revisionId,vocabulary_id:vid,position:vi+1,snapshot});
        }
        const blocks = [
          {id:'orientation',type:'text',body:`${u.objectives}\nThời lượng học gợi ý: ${u.minutes} phút.\n${u.part<=4?'Listening chưa có audio; Part 1 còn thiếu ảnh. Không làm bài bằng cách đọc transcript để tính điểm nghe.':'Reading dùng được bằng văn bản.'}\nĐây là bản nháp, chưa phải đề thi TOEIC; không quy đổi số đúng sang điểm. Quiz Part 1 có 3 câu, Part 5 có 12 câu, cần hỗ trợ cấu trúc TOEIC trước khi xuất bản.`},
          {id:'vocabulary',type:'vocabulary',vocabulary_ids:vocabularyIds},
          {id:'vocabulary-notes',type:'text',body:u.vocabulary.map(v => `${v.word} (${v.part_of_speech}): ${v.meaning}\n${v.collocation}\n${v.example}\n${v.example_vi}`).join('\n\n')},
          {id:'skills',type:'grammar',body:u.lesson},
          {id:'strategy',type:'text',body:u.strategy.join('\n')},
          {id:'practice',type:'text',body:u.practice},
        ];
        rows.lesson_revisions.push({id:revisionId,lesson_id:lessonId,revision_no:1,title:u.title,objectives:u.objectives,blocks});
        const aid = id('assessment',`quiz:${u.key}`), arid = id('assessment_revision',`quiz:${u.key}:1`);
        rows.assessments.push({id:aid,kind:'quiz',lesson_id:lessonId,topic_id:null,status:'draft'});
        rows.assessment_revisions.push({id:arid,assessment_id:aid,revision_no:1,title:`${u.title} — Bản nháp${u.part<=4?' chờ media':''}`,passing_percent:70,grading_policy_version:1});
        let position = 0;
        for (const [gi,g] of u.groups.entries()) {
          const heading = `Nhóm ${gi+1}`;
          const graphic = g.graphic ? [g.graphic.title,g.graphic.columns.join(' | '),...g.graphic.rows.map(r=>r.join(' | '))].join('\n') : '';
          const documentText = (g.documents??[]).map(d=>`${d.title}\n${d.body}`).join('\n\n');
          const passage = [heading,documentText,graphic].filter(Boolean).join('\n\n');
          if(documentText || graphic) blocks.push({id:`group-${gi+1}`,type:'reading',title:heading,body:passage});
          const groupInfo = {key:g.key,lesson_id:lessonId,assessment_revision_id:arid,kind:g.kind,delivery_status:g.delivery_status,question_ids:[],positions:[]};
          groups.push(groupInfo);
          for (const [qi,q] of g.items.entries()) {
            const qid = id('question',q.key), qrid = id('question_revision',`${q.key}:1`);
            rows.questions.push({id:qid,lesson_id:lessonId,status:'active'});
            rows.question_revisions.push({id:qrid,question_id:qid,revision_no:1,type:'single_choice',prompt:`${heading} · Câu ${qi+1}: ${q.prompt}`,passage:documentText||graphic?passage:null,audio_asset_id:null});
            q.options.forEach((text,oi)=>rows.question_options.push({question_revision_id:qrid,option_key:String.fromCharCode(65+oi),text,position:oi+1}));
            const transcript = g.scene_brief ? `Mô tả sản xuất ảnh — CHƯA CÓ ẢNH:\n${g.scene_brief}` : g.transcript ? `Kịch bản — CHƯA CÓ AUDIO:\n${g.transcript}${u.part===2?'\n'+q.options.map((o,i)=>`${String.fromCharCode(65+i)}. ${o}`).join('\n'):''}` : null;
            rows.question_answer_keys.push({question_revision_id:qrid,correct_option_key:q.answer,accepted_answers:null,explanation:`${q.explanation}\nBằng chứng/cấu trúc: ${q.evidence}`,transcript});
            rows.assessment_revision_questions.push({assessment_revision_id:arid,question_id:qid,question_revision_id:qrid,position:++position});
            groupInfo.question_ids.push(qid); groupInfo.positions.push(position);
          }
        }
      }
    }
    function check(value) {
      if(typeof value==='string') assert(value.length<=10000,'Mapped text exceeds API limit');
      else if(value && typeof value==='object') Object.values(value).forEach(check);
    }
    check(rows);
    return {slug,course_key:pack.key,course_id:courseId,receipt_id:stableId('import_receipt',pack.key),source_sha256:digest(pack),mapping_sha256:digest(rows),keys,groups,rows};
  });
  const counts = Object.fromEntries(Object.keys(tableKeys).map(t=>[t,packages.reduce((n,p)=>n+p.rows[t].length,0)]));
  const body = {importer_version:1,target:'pbl6-local',mode:'draft-only',packages,counts};
  return {...body,plan_sha256:digest(body)};
}
