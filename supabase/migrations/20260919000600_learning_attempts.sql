-- PBL6: learning_attempts. Local and Cloud share this migration history.
CREATE TABLE learning.enrollments (
user_id uuid NOT NULL, course_id uuid NOT NULL, is_active boolean NOT NULL DEFAULT false, last_seen_catalog_version bigint NOT NULL DEFAULT 0 CHECK(last_seen_catalog_version>=0), enrolled_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,course_id),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE learning.enrollments ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX enrollments_one_active ON learning.enrollments(user_id) WHERE is_active;
CREATE TABLE learning.lesson_favorites (
user_id uuid NOT NULL, lesson_id uuid NOT NULL, PRIMARY KEY(user_id,lesson_id),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE learning.lesson_favorites ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.lesson_daily_views (
user_id uuid NOT NULL, lesson_id uuid NOT NULL, activity_date date NOT NULL, PRIMARY KEY(user_id,lesson_id,activity_date),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE learning.lesson_daily_views ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.attempts (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, kind text NOT NULL CHECK(kind IN ('quiz','topic_test','mistake_review')), assessment_id uuid, assessment_revision_id uuid, course_id uuid, topic_id uuid, lesson_id uuid, title_snapshot text NOT NULL,
status text NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','submitted','cancelled')), passing_percent smallint CHECK(passing_percent BETWEEN 1 AND 100), grading_policy_version integer NOT NULL DEFAULT 1 CHECK(grading_policy_version>0), total_count integer NOT NULL CHECK(total_count>0), correct_count integer CHECK(correct_count>=0 AND correct_count<=total_count), passed boolean,
started_at timestamptz NOT NULL DEFAULT now(), submitted_at timestamptz, cancelled_at timestamptz, cancel_reason text,
CHECK((kind='quiz' AND assessment_id IS NOT NULL AND assessment_revision_id IS NOT NULL AND course_id IS NOT NULL AND topic_id IS NOT NULL AND lesson_id IS NOT NULL AND passing_percent IS NOT NULL AND total_count BETWEEN 5 AND 10)
OR (kind='topic_test' AND assessment_id IS NOT NULL AND assessment_revision_id IS NOT NULL AND course_id IS NOT NULL AND topic_id IS NOT NULL AND lesson_id IS NULL AND passing_percent IS NOT NULL AND total_count BETWEEN 10 AND 20)
OR (kind='mistake_review' AND assessment_id IS NULL AND assessment_revision_id IS NULL AND course_id IS NULL AND topic_id IS NULL AND lesson_id IS NULL AND passing_percent IS NULL AND passed IS NULL AND total_count BETWEEN 1 AND 10)),
CHECK((status='in_progress' AND submitted_at IS NULL AND cancelled_at IS NULL AND cancel_reason IS NULL AND correct_count IS NULL AND passed IS NULL)
OR (status='submitted' AND submitted_at IS NOT NULL AND correct_count IS NOT NULL AND cancelled_at IS NULL AND cancel_reason IS NULL AND (kind='mistake_review' OR (passed IS NOT NULL AND passed=(100*correct_count>=passing_percent*total_count))))
OR (status='cancelled' AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL AND submitted_at IS NULL AND correct_count IS NULL AND passed IS NULL)),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE learning.attempts ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX attempts_one_assessment ON learning.attempts(user_id,assessment_id) WHERE status='in_progress' AND kind IN ('quiz','topic_test');
CREATE UNIQUE INDEX attempts_one_review ON learning.attempts(user_id) WHERE status='in_progress' AND kind='mistake_review';
CREATE TABLE learning.attempt_items (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id uuid REFERENCES learning.attempts(id) ON DELETE RESTRICT NOT NULL, question_id uuid NOT NULL, question_revision_id uuid NOT NULL, lesson_id uuid NOT NULL, position integer NOT NULL CHECK(position>0), public_snapshot jsonb NOT NULL CHECK(jsonb_typeof(public_snapshot)='object' AND public_snapshot->>'type' IN ('single_choice','fill_blank')), mistake_generation bigint CHECK(mistake_generation>0), UNIQUE(attempt_id,position), UNIQUE(attempt_id,question_id),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE learning.attempt_items ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.attempt_item_keys (
attempt_item_id uuid REFERENCES learning.attempt_items(id) ON DELETE RESTRICT PRIMARY KEY, answer_snapshot jsonb NOT NULL CHECK(jsonb_typeof(answer_snapshot)='object'), explanation_snapshot text NOT NULL, transcript_snapshot text,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE learning.attempt_item_keys ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.attempt_answers (
attempt_item_id uuid REFERENCES learning.attempt_items(id) ON DELETE RESTRICT PRIMARY KEY, answer jsonb NOT NULL CHECK(jsonb_typeof(answer)='object'), is_correct boolean, answered_at timestamptz NOT NULL DEFAULT now(), checked_at timestamptz, CHECK((is_correct IS NULL)=(checked_at IS NULL)),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE learning.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE TABLE learning.lesson_progress (
user_id uuid NOT NULL, lesson_id uuid NOT NULL, first_opened_at timestamptz NOT NULL DEFAULT now(), last_opened_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, completion_attempt_id uuid REFERENCES learning.attempts(id) ON DELETE RESTRICT, PRIMARY KEY(user_id,lesson_id), CHECK(last_opened_at>=first_opened_at), CHECK((completed_at IS NULL)=(completion_attempt_id IS NULL)),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE learning.lesson_progress ENABLE ROW LEVEL SECURITY;

