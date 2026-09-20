-- PBL6: learning_review. Local and Cloud share this migration history.
CREATE TABLE learning.wrong_questions (
user_id uuid NOT NULL, question_id uuid NOT NULL, source_attempt_item_id uuid REFERENCES learning.attempt_items(id) ON DELETE RESTRICT NOT NULL, generation bigint NOT NULL DEFAULT 1 CHECK(generation>0), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','resolved','suppressed')), last_failed_at timestamptz NOT NULL, resolved_at timestamptz, suppressed_reason text, PRIMARY KEY(user_id,question_id), CHECK((status='pending' AND resolved_at IS NULL AND suppressed_reason IS NULL) OR (status='resolved' AND resolved_at IS NOT NULL AND suppressed_reason IS NULL) OR (status='suppressed' AND resolved_at IS NULL AND suppressed_reason IS NOT NULL)),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE learning.wrong_questions ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.flashcards (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, source_vocabulary_id uuid, source_lesson_id uuid, source_topic_id uuid, source_course_id uuid, word text NOT NULL CHECK(btrim(word)<>''), meaning text NOT NULL CHECK(btrim(meaning)<>''), example text NOT NULL DEFAULT '', phonetic text, audio_asset_id uuid, stage smallint NOT NULL DEFAULT 0 CHECK(stage BETWEEN 0 AND 4), due_at timestamptz NOT NULL DEFAULT now(), last_reviewed_at timestamptz, reset_generation bigint NOT NULL DEFAULT 1 CHECK(reset_generation>0), deleted_at timestamptz, UNIQUE(user_id,source_vocabulary_id), UNIQUE(user_id,id), CHECK((source_vocabulary_id IS NULL AND source_lesson_id IS NULL AND source_topic_id IS NULL AND source_course_id IS NULL) OR (source_vocabulary_id IS NOT NULL AND source_lesson_id IS NOT NULL AND source_topic_id IS NOT NULL AND source_course_id IS NOT NULL)),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE learning.flashcards ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.flashcard_sessions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, status text NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','cancelled')), started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz, UNIQUE(user_id,id), CHECK((status='in_progress')=(finished_at IS NULL)),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE learning.flashcard_sessions ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX flashcard_sessions_one_active ON learning.flashcard_sessions(user_id) WHERE status='in_progress';
CREATE TABLE learning.flashcard_session_items (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL, flashcard_id uuid NOT NULL, user_id uuid NOT NULL, position integer NOT NULL CHECK(position>0), reset_generation bigint NOT NULL CHECK(reset_generation>0), card_snapshot jsonb NOT NULL CHECK(jsonb_typeof(card_snapshot)='object'), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewed','skipped')), rating text CHECK(rating IN ('remember','again')), reviewed_at timestamptz, stage_before smallint CHECK(stage_before BETWEEN 0 AND 4), stage_after smallint CHECK(stage_after BETWEEN 0 AND 4), due_before timestamptz, due_after timestamptz, skip_reason text,
FOREIGN KEY(user_id,session_id) REFERENCES learning.flashcard_sessions(user_id,id) ON DELETE RESTRICT,
FOREIGN KEY(user_id,flashcard_id) REFERENCES learning.flashcards(user_id,id) ON DELETE RESTRICT,
UNIQUE(session_id,flashcard_id), UNIQUE(session_id,position),
CHECK((status='pending' AND rating IS NULL AND reviewed_at IS NULL AND stage_before IS NULL AND stage_after IS NULL AND due_before IS NULL AND due_after IS NULL AND skip_reason IS NULL)
OR (status='reviewed' AND rating IS NOT NULL AND reviewed_at IS NOT NULL AND stage_before IS NOT NULL AND stage_after IS NOT NULL AND due_before IS NOT NULL AND due_after IS NOT NULL AND skip_reason IS NULL)
OR (status='skipped' AND skip_reason IS NOT NULL AND rating IS NULL AND reviewed_at IS NULL AND stage_before IS NULL AND stage_after IS NULL AND due_before IS NULL AND due_after IS NULL)),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE learning.flashcard_session_items ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.request_dedup (
user_id uuid NOT NULL, operation text NOT NULL, idempotency_key uuid NOT NULL, request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'), result_reference jsonb CHECK(jsonb_typeof(result_reference)='object'), PRIMARY KEY(user_id,operation,idempotency_key),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE learning.request_dedup ENABLE ROW LEVEL SECURITY;

