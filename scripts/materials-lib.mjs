import assert from 'node:assert/strict';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const normalize = text => text.trim().replace(/\s+/g, ' ').toLowerCase();
const textFields = (object, fields, context) => {
  for (const field of fields) assert(nonempty(object?.[field]), `${context}: missing ${field}`);
};
const array = (value, context) => {
  assert(Array.isArray(value) && value.length > 0, `${context}: expected a nonempty array`);
};
const link = value => {
  const url = new URL(value);
  assert(url.protocol === 'https:', `Reference must use HTTPS: ${value}`);
};

export function validatePack(pack, profile, globalKeys = new Set()) {
  assert.equal(pack.schema_version, 1, 'Unsupported pack schema');
  assert.equal(pack.status, 'authored_demo_pack_not_imported');
  assert.equal(pack.audio_status, 'not_included');
  textFields(pack, ['provenance'], 'Pack');
  const course = pack.course;
  textFields(course, ['key','title','level','description','objectives'], 'Course');
  assert.equal(course.key, profile.course_key, 'Catalog course key mismatch');
  const stats = {topics:0, lessons:0, vocabulary_entries:0, questions:0, minutes:0};
  const uniqueWords = new Set();
  const uniqueKey = key => {
    assert(typeof key === 'string' && /^[a-z][a-z0-9-]*$/.test(key), `Invalid key: ${key}`);
    assert(!globalKeys.has(key), `Duplicate key: ${key}`);
    globalKeys.add(key);
  };
  function questions(items, passage, lessonKeys, context) {
    array(items, context);
    const prompts = new Set();
    for (const q of items) {
      stats.questions++;
      textFields(q, ['prompt','explanation'], context);
      uniqueKey(q.key);
      assert(!prompts.has(normalize(q.prompt)), `${context}: duplicate prompt`);
      prompts.add(normalize(q.prompt));
      assert(q.use_reading === undefined || typeof q.use_reading === 'boolean', 'use_reading must be boolean');
      if (q.use_reading) assert(nonempty(passage), `${context}: missing passage`);
      if (lessonKeys) assert(lessonKeys.has(q.lesson_key), `${context}: invalid lesson reference ${q.lesson_key}`);
      if (q.type === 'single_choice') {
        array(q.options, context);
        assert(q.options.length >= 2 && q.options.length <= 4 && q.options.every(nonempty), `${context}: invalid options`);
        assert.equal(new Set(q.options.map(normalize)).size, q.options.length, `${context}: duplicate options`);
        assert(typeof q.answer === 'string' && /^[A-D]$/.test(q.answer) && q.options[q.answer.charCodeAt(0)-65], `${context}: invalid answer key`);
        assert(q.answers === undefined, `${context}: mixed answer types`);
      } else {
        assert.equal(q.type, 'fill_blank', `${context}: unsupported question type`);
        array(q.answers, context);
        assert(q.answers.every(nonempty), `${context}: empty accepted answer`);
        assert.equal(new Set(q.answers.map(normalize)).size, q.answers.length, `${context}: duplicate accepted answers`);
        assert(q.options === undefined && q.answer === undefined, `${context}: mixed answer types`);
        assert(q.prompt.includes('___') || /write|copy|complete/i.test(q.prompt), `${context}: clarify fill-answer format`);
      }
    }
  }
  uniqueKey(course.key);
  array(course.topics, 'Topics');
  for (const topic of course.topics) {
    uniqueKey(topic.key);
    stats.topics++;
    textFields(topic, ['title','objectives','test_passage'], topic.key);
    array(topic.lessons, topic.key);
    if (profile.require_dialogue) assert.equal(topic.lessons.length, 2, `${topic.key}: expected two lessons`);
    const lessonKeys = new Set(topic.lessons.map(l => l.key));
    for (const lesson of topic.lessons) {
      uniqueKey(lesson.key);
      stats.lessons++;
      textFields(lesson, ['title','objectives','grammar','reading','reading_task','practice'], lesson.key);
      assert(Number.isInteger(lesson.estimated_minutes) && lesson.estimated_minutes > 0, `${lesson.key}: invalid duration`);
      stats.minutes += lesson.estimated_minutes;
      if (profile.require_dialogue || 'dialogue' in lesson) {
        assert(nonempty(lesson.dialogue) && lesson.dialogue.split('\n').length >= 2, `${lesson.key}: missing dialogue`);
      }
      array(lesson.vocabulary, lesson.key);
      const [min,max] = profile.vocabulary_per_lesson;
      assert(lesson.vocabulary.length >= min && lesson.vocabulary.length <= max, `${lesson.key}: invalid vocabulary count`);
      const lessonWords = new Set();
      for (const entry of lesson.vocabulary) {
        textFields(entry, ['word','part_of_speech','meaning','collocation','example','example_vi'], lesson.key);
        const word = normalize(entry.word);
        assert(!lessonWords.has(word), `${lesson.key}: duplicate vocabulary within lesson`);
        uniqueKey(entry.key);
        lessonWords.add(word);
        uniqueWords.add(word);
        stats.vocabulary_entries++;
      }
      assert.equal(lesson.quiz?.length, 5, `${lesson.key}: expected five quiz questions`);
      questions(lesson.quiz, lesson.reading, null, lesson.key);
    }
    assert.equal(topic.test?.length, 10, `${topic.key}: expected ten test questions`);
    questions(topic.test, topic.test_passage, lessonKeys, topic.key);
    stats.minutes += 10;
  }
  assert.equal(course.estimated_minutes, stats.minutes, 'Course duration mismatch');
  assert.deepEqual(stats, profile.expected, `Counts differ from catalog: ${course.key}`);
  if (pack.references) {
    array(pack.references, 'References');
    for (const ref of pack.references) {
      textFields(ref, ['title','url','note'], 'Reference');
      link(ref.url);
    }
  }
  return {...stats, unique_vocabulary:uniqueWords.size};
}

export function validateCatalog(catalog) {
  assert.equal(catalog.schema_version, 1);
  assert.equal(catalog.status, 'authored_demo_pack_not_imported');
  textFields(catalog, ['title','audience','level','assessment_note'], 'Catalog');
  array(catalog.sources, 'Catalog sources');
  for (const ref of catalog.sources) { textFields(ref, ['title','url','note'], 'Catalog source'); link(ref.url); }
  assert.equal(catalog.courses?.length, 5, 'The agreed demo contains five courses');
  const slugs = new Set();
  for (const profile of catalog.courses) {
    assert(/^english-[a-z0-9-]+$/.test(profile.slug), 'Unsafe catalog slug');
    assert(!slugs.has(profile.slug), 'Duplicate catalog slug');
    slugs.add(profile.slug);
    textFields(profile, ['course_key','field','outcome'], profile.slug);
    assert(typeof profile.require_dialogue === 'boolean');
    assert(profile.vocabulary_per_lesson?.length === 2);
    const [min,max] = profile.vocabulary_per_lesson;
    assert(Number.isInteger(min) && Number.isInteger(max) && min > 0 && min <= max);
    for (const skill of ['reading','communication','writing']) {
      assert(Number.isInteger(profile.scores?.[skill]) && profile.scores[skill] >= 1 && profile.scores[skill] <= 5, 'Invalid skill score');
    }
    for (const field of ['topics','lessons','vocabulary_entries','questions','minutes']) {
      assert(Number.isInteger(profile.expected?.[field]) && profile.expected[field] > 0, `Invalid expected ${field}`);
    }
  }
}

const cell = s => String(s).replaceAll('|','\\|').replaceAll('\n','<br>');
export function renderPack(pack, stats) {
  const c = pack.course;
  const out = [`# ${c.title}`, '', c.description, '',
    `**Mức mục tiêu:** ${c.level} · **Thời lượng:** ${stats.minutes} phút.`, '',
    `**Quy mô:** ${stats.topics} chủ đề, ${stats.lessons} bài, ${stats.vocabulary_entries} mục từ/cụm từ theo bài và ${stats.questions} câu hỏi.`, '',
    `**Mục tiêu:** ${c.objectives}`, '',
    '> Bản dành cho người duyệt có đáp án. Chưa nhập CMS, không kèm audio. Hội thoại dùng để đọc phân vai; tình huống và số liệu là giả lập.', '',
    pack.provenance, '', '## Lộ trình', '',
    '| Chủ đề | Các bài học | Thời lượng |', '|---|---|---|',
    ...c.topics.map(t => `| [${cell(t.title)}](#${t.key}) | ${t.lessons.map(l=>cell(l.title)).join('; ')} | ${t.lessons.reduce((n,l)=>n+l.estimated_minutes,10)} phút |`), '',
    '## Cách học', '',
    '1. Đọc từ, nghĩa và ví dụ; che nghĩa để nhớ từ rồi đổi chiều.',
    '2. Đọc bài, trả lời yêu cầu và đọc hội thoại theo vai nếu có.',
    '3. Thực hành nói/viết theo mẫu; tự kiểm bằng tiêu chí cuối hoạt động.',
    '4. Làm quiz trước khi xem đáp án; thêm từ còn nhầm vào flashcard và ôn ở buổi tiếp theo.', '',
    'Mỗi bài khoảng 20 phút, mỗi kiểm tra chủ đề khoảng 10 phút. Bài nói/viết và hội thoại không được chấm tự động. Bản này không chứa file audio, hình kỹ thuật hoặc video; các đoạn đọc mô tả tình huống giả lập và cung cấp dữ kiện cần để trả lời câu hỏi.', '',
  ];
  function questions(qs) {
    for (const [i,q] of qs.entries()) {
      out.push(`${i+1}. ${q.prompt}${q.use_reading ? ' (Dựa vào bài đọc.)' : ''}`, '');
      if (q.type === 'single_choice') out.push(...q.options.map((o,n)=>`   - ${String.fromCharCode(65+n)}. ${o}`), '', `   **Đáp án: ${q.answer}.** ${q.explanation}`, '');
      else out.push(`   **Đáp án: ${q.answers.join(' / ')}.** ${q.explanation}`, '');
    }
  }
  for (const [ti,t] of c.topics.entries()) {
    out.push(`<a id="${t.key}"></a>`, '', `## Chủ đề ${ti+1}: ${t.title}`, '', t.objectives, '');
    for (const [li,l] of t.lessons.entries()) {
      out.push(`### Bài ${ti+1}.${li+1}: ${l.title}`, '', `**Mục tiêu:** ${l.objectives}`, '',
        '#### Từ vựng', '', '| Từ | Loại từ | Nghĩa | Cụm thường dùng |', '|---|---|---|---|',
        ...l.vocabulary.map(v=>`| ${[v.word,v.part_of_speech,v.meaning,v.collocation].map(cell).join(' | ')} |`), '',
        '#### Ví dụ Anh–Việt', '', ...l.vocabulary.map(v=>`- **${v.word}:** ${v.example} — ${v.example_vi}`), '',
        '#### Cách dùng và mẫu câu', '', l.grammar, '', '#### Đọc trong ngữ cảnh', '', l.reading, '',
        `**Yêu cầu:** ${l.reading_task}`, '');
      if(l.dialogue) out.push('#### Hội thoại đọc phân vai', '', ...l.dialogue.split('\n').flatMap(s=>[s,'']));
      out.push('#### Thực hành', '', l.practice, '', '#### Quiz — 5 câu', '');
      questions(l.quiz);
    }
    out.push(`### Kiểm tra chủ đề ${ti+1} — 10 câu`, '', '**Bài đọc dành cho câu có ghi “Dựa vào bài đọc”:**', '', t.test_passage, '');
    questions(t.test);
  }
  if(pack.references?.length) {
    out.push('## Nguồn đối chiếu khái niệm', '');
    for(const ref of pack.references) out.push(`- [${ref.title}](${ref.url}): ${ref.note}`);
    out.push('', 'Nguồn giúp rà soát khái niệm; không chứng nhận chất lượng bộ học liệu hoặc thay thế giáo viên/chuyên gia duyệt nội dung.', '');
  }
  return out.join('\n')+'\n';
}

export function renderCatalog(catalog, results) {
  const totals = results.reduce((sum,r)=> {
    for(const field of Object.keys(sum)) sum[field]+=r.stats[field];
    return sum;
  }, {topics:0,lessons:0,vocabulary_entries:0,questions:0,minutes:0});
  return [
    `# ${catalog.title}`, '', catalog.audience, '',
    `**Tổng:** ${results.length} khóa · ${totals.topics} topic · ${totals.lessons} bài · ${totals.vocabulary_entries} mục từ theo bài · ${totals.questions} câu hỏi · ${totals.minutes} phút.`, '',
    '**Trạng thái:** gói nội dung để duyệt, chưa nhập CMS hoặc xuất bản; chưa có audio, hình kỹ thuật hay video. Không sửa database hoặc API.', '',
    '## Danh sách và nhu cầu tiếng Anh', '', catalog.assessment_note, '',
    'Thang điểm: 1 ít xuất hiện; 2 thỉnh thoảng; 3 thường dùng ở một số vai trò; 4 thường xuyên; 5 là trọng tâm trong bối cảnh được xét. Nghe–nói được gộp vào cột Giao tiếp.', '',
    '| Nhóm ngành | Đọc | Giao tiếp | Viết | Đầu ra thực hành | Học liệu |', '|---|---:|---:|---:|---|---|',
    ...results.map(({profile:p})=>`| ${p.field} | ${p.scores.reading} | ${p.scores.communication} | ${p.scores.writing} | ${p.outcome} | [Đọc](${p.slug}.md) · [JSON](${p.slug}.json) |`), '',
    '## Quy mô và lộ trình', '', '| Khóa | Topic | Bài | Mục từ | Câu hỏi | Phút |', '|---|---:|---:|---:|---:|---:|',
    ...results.map(({profile:p,stats:s})=>`| ${p.field} | ${s.topics} | ${s.lessons} | ${s.vocabulary_entries} | ${s.questions} | ${s.minutes} |`), '',
    'Mục từ được đếm theo bài; cùng một từ có thể được dạy lại trong ngữ cảnh khác. Mức ngôn ngữ mục tiêu A2–B1 không phải chuẩn đủ để thực hiện mọi công việc chuyên môn.', '',
    ...results.flatMap(({profile:p,pack})=>[`### ${p.field}`, '', ...pack.course.topics.map(t=>`- **${t.title}:** ${t.lessons.map(l=>l.title).join('; ')}.`), '']),
    '## Cách demo và trạng thái duyệt', '',
    'Chọn một ngành → học từ và ví dụ → đọc tình huống → đọc hội thoại theo vai → làm quiz → đối chiếu giải thích → luyện nói/viết theo mẫu. Khi chưa nhập CMS, dùng bản Markdown để trình bày nội dung; chưa coi đó là kiểm chứng luồng ứng dụng.', '',
    'Mỗi khóa mới gồm ba topic, mỗi topic hai bài và một kiểm tra 10 câu. Mỗi bài có tám mục từ và quiz năm câu. Bộ IT được giữ nội dung nguồn hiện có. Hoạt động tự do không chấm tự động.', '',
    'Cấu trúc, đáp án hợp lệ và bản Markdown được kiểm tra bằng công cụ. Thuật ngữ đã được đối chiếu ở mức biên soạn; chưa có thẩm định độc lập của giáo viên/chuyên gia. Dữ kiện của mọi câu hỏi có trong văn bản, không cần ảnh/video thật được nhắc đến trong tình huống.', '',
    '## Cập nhật và kiểm tra', '',
    'JSON của từng khóa là nguồn duy nhất để sửa nội dung. Danh mục này được tạo từ `technical-catalog.json`; không sửa các bản Markdown sinh tự động.', '',
    '```sh', 'node scripts/render-technical-materials.mjs', 'node scripts/render-technical-materials.mjs --check', 'node --test tests/materials.test.mjs', '```', '',
    'Chế độ `--check` chỉ đọc, phát hiện cấu trúc sai hoặc Markdown chưa đồng bộ. Tất cả khóa được kiểm tra trước khi ghi bất kỳ bản Markdown nào. Xem [hướng dẫn CMS](README.md) để ánh xạ nội dung; JSON chứa đáp án không được đưa nguyên vào frontend người học.', '',
    '## Cơ sở định hướng', '', ...catalog.sources.map(s=>`- [${s.title}](${s.url}): ${s.note}`), '',
  ].join('\n')+'\n';
}
