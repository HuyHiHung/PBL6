-- PBL6: assessments. Local and Cloud share this migration history.
CREATE TABLE content.assessments (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('quiz','topic_test')), lesson_id uuid REFERENCES content.lessons(id) ON DELETE RESTRICT, topic_id uuid REFERENCES content.topics(id) ON DELETE RESTRICT, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')), first_published_at timestamptz, published_revision_id uuid,
CHECK((kind='quiz' AND lesson_id IS NOT NULL AND topic_id IS NULL) OR (kind='topic_test' AND topic_id IS NOT NULL AND lesson_id IS NULL)), CHECK(status<>'published' OR published_revision_id IS NOT NULL),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.assessments ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX assessments_one_quiz ON content.assessments(lesson_id) WHERE kind='quiz';
CREATE UNIQUE INDEX assessments_one_test ON content.assessments(topic_id) WHERE kind='topic_test';
CREATE TABLE content.assessment_revisions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_id uuid REFERENCES content.assessments(id) ON DELETE RESTRICT NOT NULL, revision_no integer NOT NULL CHECK(revision_no>0), title text NOT NULL, passing_percent smallint NOT NULL DEFAULT 70 CHECK(passing_percent BETWEEN 1 AND 100), grading_policy_version integer NOT NULL DEFAULT 1 CHECK(grading_policy_version>0), published_at timestamptz, created_by uuid NOT NULL, UNIQUE(assessment_id,revision_no), UNIQUE(assessment_id,id),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.assessment_revisions ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX assessment_revisions_one_draft ON content.assessment_revisions(assessment_id) WHERE published_at IS NULL;
ALTER TABLE content.assessments ADD CONSTRAINT assessments_revision_parent_fk FOREIGN KEY(id,published_revision_id) REFERENCES content.assessment_revisions(assessment_id,id) ON DELETE RESTRICT;
CREATE TABLE content.assessment_revision_questions (
assessment_revision_id uuid REFERENCES content.assessment_revisions(id) ON DELETE RESTRICT NOT NULL, question_id uuid REFERENCES content.questions(id) ON DELETE RESTRICT NOT NULL, question_revision_id uuid NOT NULL, position integer NOT NULL CHECK(position>0), PRIMARY KEY(assessment_revision_id,question_id), UNIQUE(assessment_revision_id,position), FOREIGN KEY(question_id,question_revision_id) REFERENCES content.question_revisions(question_id,id) ON DELETE RESTRICT,
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE content.assessment_revision_questions ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.audit_events (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid, action text NOT NULL, entity_type text NOT NULL, entity_id uuid NOT NULL, changes jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(changes)='object'),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE content.audit_events ENABLE ROW LEVEL SECURITY;

