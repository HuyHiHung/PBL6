import assert from 'node:assert/strict';

const text = (value, label) => assert(typeof value === 'string' && value.trim(), `Missing ${label}`);
const norm = value => value.trim().replace(/\s+/g, ' ').toLowerCase();
const letters = 'ABCD';
const cell = value => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');

export function validateToeic(pack, keys = new Set()) {
  assert.equal(pack.schema_version, 1);
  assert.equal(pack.schema, 'sprout_toeic_materials_v1');
  assert.equal(pack.status, 'authored_not_imported');
  for (const field of ['title', 'target', 'audience', 'provenance', 'scope_note', 'entry_guidance', 'progression']) text(pack[field], field);
  assert(pack.band && ((pack.band.min === 500 && pack.band.max === 700) || (pack.band.min === 700 && pack.band.max === 990)), 'Unsupported TOEIC study band');
  const key = value => {
    assert(typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value), `Invalid key: ${value}`);
    assert(!keys.has(value), `Duplicate key: ${value}`);
    keys.add(value);
  };
  key(pack.key);
  const totals = { units: 0, vocabulary_entries: 0, questions: 0, listening_script_questions: 0, reading_questions: 0, photo_briefs: 0, minutes: 0, by_part: Object.fromEntries([1,2,3,4,5,6,7].map(p => [p, 0])) };
  const kinds = { 1: ['photo_brief'], 2: ['question_response'], 3: ['conversation'], 4: ['talk'], 5: ['sentences'], 6: ['text_completion'], 7: ['single_passage', 'double_passage', 'triple_passage'] };
  const words = new Set();
  assert.equal(pack.units?.length, 8, 'Expected eight units per study band');
  for (const unit of pack.units) {
    key(unit.key);
    for (const field of ['title', 'objectives', 'lesson', 'practice']) text(unit[field], `${unit.key}/${field}`);
    assert(kinds[unit.part], 'Invalid TOEIC part');
    assert(Number.isInteger(unit.minutes) && unit.minutes > 0, 'Invalid lesson time');
    assert(Array.isArray(unit.strategy) && unit.strategy.length > 0);
    unit.strategy.forEach(s => text(s, 'strategy'));
    totals.units++; totals.minutes += unit.minutes;
    assert.equal(unit.vocabulary?.length, 8, 'Expected eight vocabulary entries per unit');
    const unitWords = new Set();
    for (const v of unit.vocabulary) {
      key(v.key);
      for (const f of ['word', 'part_of_speech', 'meaning', 'collocation', 'example', 'example_vi']) text(v[f], `${v.key}/${f}`);
      assert(!unitWords.has(norm(v.word)), 'Duplicate vocabulary in unit');
      unitWords.add(norm(v.word)); words.add(norm(v.word)); totals.vocabulary_entries++;
    }
    assert(Array.isArray(unit.groups) && unit.groups.length > 0);
    for (const group of unit.groups) {
      key(group.key);
      assert(kinds[unit.part].includes(group.kind), 'Group kind does not match TOEIC part');
      const expectedStatus = unit.part === 1 ? 'needs_image_and_audio' : unit.part <= 4 ? 'needs_audio' : 'text_ready';
      assert.equal(group.delivery_status, expectedStatus, 'Media readiness mismatch');
      // This starter version has scripts/briefs only. Assets need a reviewed schema update.
      assert.deepEqual(group.media, { audio: null, image: null }, 'Unexpected unverified media');
      if (group.graphic) {
        assert([3,4].includes(unit.part), 'Graphics are supported for Listening Parts 3–4');
        text(group.graphic.title, 'graphic title');
        assert(Array.isArray(group.graphic.columns) && group.graphic.columns.length >= 2, 'Invalid graphic columns');
        group.graphic.columns.forEach(c => text(c, 'graphic column'));
        assert(Array.isArray(group.graphic.rows) && group.graphic.rows.length > 0, 'Missing graphic rows');
        for (const row of group.graphic.rows) {
          assert(Array.isArray(row) && row.length === group.graphic.columns.length, 'Graphic row width mismatch');
          row.forEach(c => text(c, 'graphic cell'));
        }
      }
      if (unit.part === 1) { text(group.scene_brief, 'scene brief'); totals.photo_briefs++; }
      if ([2,3,4].includes(unit.part)) text(group.transcript, 'listening transcript');
      if (unit.part >= 6) {
        const docCount = group.kind === 'double_passage' ? 2 : group.kind === 'triple_passage' ? 3 : 1;
        assert.equal(group.documents?.length, docCount, 'Wrong document count');
        for (const doc of group.documents) { key(doc.key); text(doc.title, 'document title'); text(doc.body, 'document body'); }
      }
      const fixedCount = { photo_brief: 1, question_response: 1, conversation: 3, talk: 3, text_completion: 4, double_passage: 5, triple_passage: 5 }[group.kind];
      assert(Array.isArray(group.items) && group.items.length > 0);
      if (fixedCount) assert.equal(group.items.length, fixedCount, 'Wrong question group size');
      if (group.kind === 'single_passage') assert(group.items.length >= 2 && group.items.length <= 4, 'Single passage needs 2–4 items');
      if (unit.part === 6) {
        assert.deepEqual([...group.documents[0].body.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1])), [1,2,3,4], 'Text-completion blanks must occur once and in order');
      }
      const prompts = new Set();
      for (const [index, item] of group.items.entries()) {
        key(item.key);
        assert.equal(item.type, 'single_choice', 'TOEIC drills require single choice');
        for (const f of ['prompt', 'explanation', 'evidence']) text(item[f], `${item.key}/${f}`);
        assert(!prompts.has(norm(item.prompt)), 'Duplicate question in group'); prompts.add(norm(item.prompt));
        assert.equal(item.options?.length, unit.part === 2 ? 3 : 4, 'Wrong option count');
        item.options.forEach(o => text(o, 'option'));
        assert.equal(new Set(item.options.map(norm)).size, item.options.length, 'Duplicate options');
        assert(typeof item.answer === 'string' && /^[A-D]$/.test(item.answer) && item.options[letters.indexOf(item.answer)], 'Invalid answer key');
        if (unit.part === 6) assert(item.prompt.includes(`[${index+1}]`), 'Question refers to the wrong text-completion blank');
        totals.questions++; totals.by_part[unit.part]++;
        if (unit.part <= 4) totals.listening_script_questions++; else totals.reading_questions++;
      }
    }
  }
  assert.deepEqual(totals, pack.counts, 'TOEIC content counts differ from manifest');
  assert.deepEqual(pack.exam_reference.parts.map(p => p.questions), [6,25,39,30,30,16,54]);
  assert.equal(pack.exam_reference.listening_minutes, 45);
  assert.equal(pack.exam_reference.reading_minutes, 75);
  assert(Array.isArray(pack.references) && pack.references.length > 0);
  for (const ref of pack.references) {
    text(ref.title, 'source title'); text(ref.note, 'source note');
    const url = new URL(ref.url); assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'www.ets.org');
  }
  return { ...totals, unique_vocabulary: words.size };
}

export function renderToeic(pack, { reviewer = false } = {}) {
  const stats = validateToeic(pack);
  const out = [`# ${pack.title} — ${reviewer ? 'Bản người duyệt: kịch bản và đáp án' : 'Bản người học'}`, '', pack.audience, '',
    `**Quy mô:** ${stats.units} bài · ${stats.vocabulary_entries} mục từ · ${stats.questions} câu biên soạn · ${stats.minutes} phút học gợi ý.`, '',
    pack.target, '', `**Chọn bộ:** ${pack.entry_guidance}`, '', `**Tiến trình:** ${pack.progression}`, '', pack.provenance, '', `**Trạng thái:** ${pack.scope_note}`, '',
    reviewer ? '**Bản này chứa đáp án.** Transcript và câu A/B/C/D phần Listening dành cho người đọc/thu âm; không hiển thị chúng trong lần làm bài nghe.' : `**Bản này không chứa đáp án.** ${stats.reading_questions} câu Reading có thể làm ngay. ${stats.listening_script_questions} câu Listening đang chờ audio; Part 1 còn chờ ảnh. Các mục Listening dưới đây là hướng dẫn kỹ năng, chưa có bài nghe phát được.`, '',
    '## Lộ trình', '', '| Bài | Part | Mục từ | Câu | Phút |', '|---|---:|---:|---:|---:|',
    ...pack.units.map(u => `| [${cell(u.title)}](#${u.key}) | ${u.part} | ${u.vocabulary.length} | ${u.groups.reduce((n,g) => n+g.items.length,0)} | ${u.minutes} |`), '',
    '## Cách học', '', '1. Học nghĩa, cụm từ và ví dụ; che nghĩa rồi tự nhớ lại.', '2. Đọc hướng dẫn kỹ năng và làm bài chưa xem đáp án. Listening cần người đọc hoặc audio được chuẩn bị từ script; chưa có thì chỉ học từ và cách xử lý.', '3. Chữa bằng bằng chứng trong bài; ghi lỗi vào sổ và viết một ví dụ mới.', '4. Ôn lại sau 1, 3 và 7 ngày. Số đúng khi làm lại cùng câu chỉ phản ánh việc ôn, không đo tăng điểm TOEIC.', '',
    '**Chấm bài tự luyện:** ghi số đúng/tổng câu theo Part và loại lỗi. Không cộng bài làm bằng transcript vào điểm nghe, không quy đổi kết quả sang 10–990.', ''];
  for (const [i,u] of pack.units.entries()) {
    out.push(`<a id="${u.key}"></a>`, '', `## Bài ${i+1}: ${u.title}`, '', `**Mục tiêu:** ${u.objectives}`, '', '### Từ vựng', '', '| Từ | Loại | Nghĩa | Cụm thường dùng |', '|---|---|---|---|',
      ...u.vocabulary.map(v => `| ${[v.word,v.part_of_speech,v.meaning,v.collocation].map(cell).join(' | ')} |`), '',
      ...u.vocabulary.map(v => `- **${v.word}:** ${v.example} — ${v.example_vi}`), '', '### Hướng dẫn kỹ năng', '', u.lesson, '', ...u.strategy.map(s => `- ${s}`), '', '### Thực hành bổ trợ', '', u.practice, '');
    if (u.part <= 4 && !reviewer) {
      out.push('### Trạng thái bài tập', '', `Đã biên soạn ${u.groups.reduce((n,g) => n+g.items.length,0)} câu trong bản người duyệt. ${u.part === 1 ? 'Cần tạo và kiểm tra ảnh cùng audio.' : 'Cần thu âm và kiểm tra audio.'} Chưa làm hoặc chấm như bài Listening độc lập.`, '');
      continue;
    }
    for (const [gi,g] of u.groups.entries()) {
      out.push(`### Nhóm ${gi+1} — ${g.key}`, '');
      if (g.scene_brief) out.push('**Mô tả để sản xuất ảnh — chưa có ảnh:**', '', g.scene_brief, '');
      if (g.graphic) out.push(`**Bảng dùng cùng bài nghe: ${g.graphic.title}**`, '', `| ${g.graphic.columns.map(cell).join(' | ')} |`, `| ${g.graphic.columns.map(() => '---').join(' | ')} |`, ...g.graphic.rows.map(row => `| ${row.map(cell).join(' | ')} |`), '');
      if (g.transcript) out.push('**Kịch bản đọc/thu âm — chưa có audio:**', '', ...g.transcript.split('\n').flatMap(line => [line, '']));
      for (const doc of g.documents ?? []) out.push(`#### ${doc.title}`, '', doc.body, '');
      for (const [qi,item] of g.items.entries()) {
        out.push(`${qi+1}. ${item.prompt} (${item.key})`, '', ...item.options.map((o,oi) => `   - ${letters[oi]}. ${o}`), '');
        if (reviewer) out.push(`   **Đáp án: ${item.answer}.** ${item.explanation}`, '', `   **Bằng chứng/cấu trúc:** ${item.evidence}`, '');
      }
    }
  }
  out.push('## Nguồn định dạng bài thi', '', ...pack.references.map(r => `- [${r.title}](${r.url}): ${r.note}`), '');
  return out.join('\n') + '\n';
}
