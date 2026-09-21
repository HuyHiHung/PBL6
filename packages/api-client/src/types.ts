// Public API DTOs only. Never export Content's private assessment snapshots.
export type Version = number | string;
export type Page<T> = { items: T[]; page?: number; total?: number };
export type Profile = {
  user_id: string;
  display_name: string | null;
  email: string;
  row_version: Version;
  role: string;
};
export type LessonSummary = {
  id: string;
  title: string;
  is_preview: boolean;
  status?: string;
};
export type Topic = {
  id: string;
  title: string;
  assessment_id: string | null;
  lessons: LessonSummary[];
  percent?: number | null;
  test_passed?: boolean;
};
export type Course = {
  id: string;
  title: string;
  description?: string;
  level?: string;
  catalog_version: Version;
  topics: Topic[];
};
export type Catalog = { courses: Course[] };
export type Progress = {
  course: Pick<Course, "id" | "title" | "catalog_version"> | null;
  topics: Topic[];
  next_lesson_id: string | null;
  next_assessment_id?: string | null;
  percent?: number | null;
  catalog_changed: boolean;
  completed: boolean;
};
export type Today = {
  new_cards: number;
  due_cards: number;
  wrong_questions: number;
  flashcard_session_id: string | null;
  progress: Progress;
};
export type Vocabulary = {
  vocabulary_id: string;
  snapshot: {
    word: string;
    meaning: string;
    example: string;
    phonetic?: string;
    audio_url?: string | null;
  };
};
export type Block = {
  id: string;
  type: "text" | "reading" | "grammar" | "audio" | "vocabulary";
  body?: string;
  title?: string;
  audio_url?: string | null;
  transcript?: string;
};
export type Lesson = {
  id: string;
  title: string;
  revision_id: string;
  objectives: string;
  assessment_id: string | null;
  blocks: Block[];
  vocabulary: Vocabulary[];
};
export type Answer = { option_key: string } | { text: string };
export type AttemptItem = {
  id: string;
  position: number;
  lesson_id: string;
  type: "single_choice" | "fill_blank";
  prompt: string;
  passage: string | null;
  audio_url: string | null;
  options: { option_key: string; text: string }[];
  answer: Answer | null;
  answer_version: number;
  checked: boolean;
  is_correct?: boolean;
  answer_key?: { correct_option_key?: string; accepted_answers?: string[] };
  explanation?: string;
  transcript?: string | null;
};
export type Attempt = {
  id: string;
  title: string;
  kind: "quiz" | "topic_test" | "mistake_review";
  status: string;
  row_version: number;
  score: number | null;
  correct_count: number | null;
  total_count: number;
  passed: boolean | null;
  cancel_reason: string | null;
  items: AttemptItem[];
};
export type History = {
  id: string;
  title_snapshot: string;
  status: string;
  kind?: string;
  started_at?: string;
  created_at?: string;
  correct_count?: number;
  total_count?: number;
  score?: number | null;
};
export type Card = {
  id: string;
  word: string;
  meaning: string;
  example: string;
  phonetic?: string;
  row_version: Version;
  due_at: string;
  stage: number;
};
export type CardSession = {
  id: string;
  status: string;
  row_version: Version;
  items: {
    id: string;
    status: string;
    card_snapshot: {
      word: string;
      meaning: string;
      example: string;
      phonetic?: string;
    };
    skip_reason: string | null;
  }[];
};
export type Note = {
  id: string;
  lesson_id: string;
  content: string;
  title_snapshot: string;
  row_version: Version;
  updated_at: string;
  current_title?: string | null;
  available?: boolean;
  revision_changed?: boolean;
};
export type NoteDetail = {
  note: Note | null;
  available: boolean;
  current_title: string | null;
  revision_changed: boolean;
};
export type Dictation = {
  id: string;
  title: string;
  instructions: string;
  lesson_id: string;
  lesson_title: string;
};
export type DictationAttempt = {
  id: string;
  title: string;
  instructions: string;
  audio_url: string | null;
  answer: string;
  status: string;
  row_version: number;
  transcript?: string;
  cancel_reason: string | null;
  result?: {
    score: number;
    correct: number;
    substitutions: number;
    missing: number;
    extra: number;
    alignment: {
      type: string;
      expected: string | null;
      actual: string | null;
    }[];
  };
};
export type SearchHit = {
  id: string;
  type: string;
  title: string;
  meaning: string | null;
  course_id: string;
  topic_id: string | null;
  lesson_id: string | null;
};
export type Favorite = { lesson_id: string; title: string; available: boolean };
export type Mistake = {
  question_id: string;
  lesson_id: string;
  prompt: string;
  explanation: string;
};
export type { TypingSource, TypingSnapshot, TypingStart, TypingFinish, TypingSession, TypingSourceList } from "./typing.js";
