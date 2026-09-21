import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
export const typingWords = JSON.parse(
  readFileSync(
    new URL("../content/typing/words.json", import.meta.url),
    "utf8",
  ),
);
/** Called only by local-only bootstrap/tests, with fresh IDs or the named demo ID. */
export async function createTypingLesson(
  sql,
  author,
  lesson = randomUUID(),
  title = "Vườn từ vựng — Everyday English",
) {
  const [old] =
    await sql`SELECT l.id,l.topic_id,t.course_id FROM content.lessons l JOIN content.topics t ON t.id=l.topic_id WHERE l.id=${lesson}`;
  if (old)
    return { lesson: old.id, topic: old.topic_id, course: old.course_id };
  return sql.begin(async (tx) => {
    const course = randomUUID(),
      topic = randomUUID(),
      revision = randomUUID(),
      quiz = randomUUID(),
      quizRevision = randomUUID();
    await tx`INSERT INTO content.courses(id,title,description,level,position) VALUES(${course},${title},'Bộ từ luyện gõ do dự án tự biên soạn, dành cho môi trường local.','A1–B1',100)`;
    await tx`INSERT INTO content.topics(id,course_id,title,position) VALUES(${topic},${course},'Words for a little progress',1)`;
    await tx`INSERT INTO content.lessons(id,topic_id,position,is_preview) VALUES(${lesson},${topic},1,true)`;
    const ids = typingWords.map(() => randomUUID());
    const blocks = [
      {
        id: "intro",
        type: "text",
        body: "Read the words and examples. Then open Mini game to practise typing. Longer phrases include spaces, apostrophes and hyphens.",
      },
      { id: "words", type: "vocabulary", vocabulary_ids: ids },
    ];
    await tx`INSERT INTO content.lesson_revisions(id,lesson_id,revision_no,title,objectives,blocks,created_by) VALUES(${revision},${lesson},1,${title},'Nhận diện và gõ chính xác 30 từ và cụm từ tiếng Anh.',${tx.json(blocks)},${author})`;
    for (const [n, word] of typingWords.entries()) {
      await tx`INSERT INTO content.vocabulary_entries(id,word,meaning,example,source) VALUES(${ids[n]},${word.word},${word.meaning},${word.example},'Sprout original local typing demo')`;
      await tx`INSERT INTO content.lesson_revision_vocabulary(lesson_revision_id,vocabulary_id,position,snapshot) VALUES(${revision},${ids[n]},${n + 1},${tx.json({ ...word, phonetic: null, audio_asset_id: null })})`;
    }
    await tx`INSERT INTO content.assessments(id,kind,lesson_id) VALUES(${quiz},'quiz',${lesson})`;
    await tx`INSERT INTO content.assessment_revisions(id,assessment_id,revision_no,title,created_by) VALUES(${quizRevision},${quiz},1,'Everyday words — kiểm tra từ vựng',${author})`;
    for (let n = 0; n < 5; n++) {
      const q = randomUUID(),
        qr = randomUUID(),
        word = typingWords[n];
      await tx`INSERT INTO content.questions(id,lesson_id) VALUES(${q},${lesson})`;
      await tx`INSERT INTO content.question_revisions(id,question_id,revision_no,type,prompt,created_by) VALUES(${qr},${q},1,'fill_blank',${"Viết từ tiếng Anh có nghĩa: " + word.meaning},${author})`;
      await tx`INSERT INTO content.question_answer_keys(question_revision_id,accepted_answers,explanation) VALUES(${qr},${[word.word]},${word.example})`;
      await tx`UPDATE content.question_revisions SET published_at=now() WHERE id=${qr}`;
      await tx`INSERT INTO content.assessment_revision_questions(assessment_revision_id,question_id,question_revision_id,position) VALUES(${quizRevision},${q},${qr},${n + 1})`;
    }
    await tx`UPDATE content.lesson_revisions SET published_at=now() WHERE id=${revision}`;
    await tx`UPDATE content.assessment_revisions SET published_at=now() WHERE id=${quizRevision}`;
    await tx`UPDATE content.assessments SET status='published',published_revision_id=${quizRevision} WHERE id=${quiz}`;
    await tx`UPDATE content.lessons SET status='published',published_revision_id=${revision} WHERE id=${lesson}`;
    await tx`UPDATE content.topics SET status='published' WHERE id=${topic}`;
    await tx`UPDATE content.courses SET status='published' WHERE id=${course}`;
    return { lesson, topic, course };
  });
}
