-- PBL6: content_revisions. Local and Cloud share this migration history.
CREATE TABLE content.lesson_revisions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id uuid REFERENCES content.lessons(id) ON DELETE RESTRICT NOT NULL, revision_no integer NOT NULL CHECK(revision_no>0), title text NOT NULL, objectives text NOT NULL DEFAULT '', blocks jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(blocks)='array'), published_at timestamptz, created_by uuid NOT NULL, UNIQUE(lesson_id,revision_no), UNIQUE(lesson_id,id),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.lesson_revisions ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX lesson_revisions_one_draft ON content.lesson_revisions(lesson_id) WHERE published_at IS NULL;
ALTER TABLE content.lessons ADD CONSTRAINT lessons_revision_parent_fk FOREIGN KEY(id,published_revision_id) REFERENCES content.lesson_revisions(lesson_id,id) ON DELETE RESTRICT;
CREATE TABLE content.lesson_revision_vocabulary (
lesson_revision_id uuid REFERENCES content.lesson_revisions(id) ON DELETE RESTRICT NOT NULL, vocabulary_id uuid REFERENCES content.vocabulary_entries(id) ON DELETE RESTRICT NOT NULL, position integer NOT NULL CHECK(position>0), snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'), PRIMARY KEY(lesson_revision_id,vocabulary_id), UNIQUE(lesson_revision_id,position),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE content.lesson_revision_vocabulary ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.lesson_revision_assets (
lesson_revision_id uuid REFERENCES content.lesson_revisions(id) ON DELETE RESTRICT NOT NULL, asset_id uuid REFERENCES content.media_assets(id) ON DELETE RESTRICT NOT NULL, PRIMARY KEY(lesson_revision_id,asset_id),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE content.lesson_revision_assets ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.questions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id uuid REFERENCES content.lessons(id) ON DELETE RESTRICT NOT NULL, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','hidden','invalid')), first_published_at timestamptz,
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.questions ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.question_revisions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_id uuid REFERENCES content.questions(id) ON DELETE RESTRICT NOT NULL, revision_no integer NOT NULL CHECK(revision_no>0), type text NOT NULL CHECK(type IN ('single_choice','fill_blank')), prompt text NOT NULL, passage text, audio_asset_id uuid REFERENCES content.media_assets(id) ON DELETE RESTRICT, published_at timestamptz, created_by uuid NOT NULL, UNIQUE(question_id,revision_no), UNIQUE(question_id,id),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.question_revisions ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX question_revisions_one_draft ON content.question_revisions(question_id) WHERE published_at IS NULL;
CREATE TABLE content.question_options (
question_revision_id uuid REFERENCES content.question_revisions(id) ON DELETE RESTRICT NOT NULL, option_key text NOT NULL CHECK(btrim(option_key)<>''), text text NOT NULL CHECK(btrim(text)<>''), position integer NOT NULL CHECK(position>0), PRIMARY KEY(question_revision_id,option_key), UNIQUE(question_revision_id,position),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE content.question_options ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.question_answer_keys (
question_revision_id uuid REFERENCES content.question_revisions(id) ON DELETE RESTRICT PRIMARY KEY, correct_option_key text, accepted_answers text[], explanation text NOT NULL, transcript text,
FOREIGN KEY(question_revision_id,correct_option_key) REFERENCES content.question_options(question_revision_id,option_key) ON DELETE RESTRICT,
CHECK((correct_option_key IS NOT NULL AND accepted_answers IS NULL) OR (correct_option_key IS NULL AND cardinality(accepted_answers)>0 AND accepted_answers IS NOT NULL)),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.question_answer_keys ENABLE ROW LEVEL SECURITY;

