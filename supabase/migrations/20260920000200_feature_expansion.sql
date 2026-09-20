CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE FUNCTION content.search_normalize(value text) RETURNS text LANGUAGE sql STABLE SET search_path='' AS $$ SELECT lower(extensions.unaccent(normalize(value,NFC))); $$;
REVOKE ALL ON FUNCTION content.search_normalize(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION content.search_normalize(text) TO app_content_runtime;

CREATE TABLE content.dictations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lesson_id uuid NOT NULL REFERENCES content.lessons(id) ON DELETE RESTRICT,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')), position integer NOT NULL DEFAULT 1 CHECK(position>0), published_revision_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
CREATE TABLE content.dictation_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dictation_id uuid NOT NULL REFERENCES content.dictations(id) ON DELETE RESTRICT,
 revision_no integer NOT NULL CHECK(revision_no>0), title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 300), instructions text NOT NULL DEFAULT '' CHECK(length(instructions)<=5000),
 audio_asset_id uuid NOT NULL REFERENCES content.media_assets(id) ON DELETE RESTRICT, transcript text NOT NULL CHECK(length(btrim(transcript)) BETWEEN 1 AND 10000),
 published_at timestamptz,created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0),
 UNIQUE(dictation_id,revision_no),UNIQUE(dictation_id,id)
);
ALTER TABLE content.dictations ADD FOREIGN KEY(id,published_revision_id) REFERENCES content.dictation_revisions(dictation_id,id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED;
CREATE UNIQUE INDEX dictation_one_draft ON content.dictation_revisions(dictation_id) WHERE published_at IS NULL;
CREATE INDEX dictation_lesson_status ON content.dictations(lesson_id,status,position,id);
CREATE INDEX dictation_audio ON content.dictation_revisions(audio_asset_id);

CREATE TABLE learning.lesson_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,lesson_id uuid NOT NULL,content text NOT NULL CHECK(length(btrim(content)) BETWEEN 1 AND 5000),
 title_snapshot text NOT NULL,lesson_revision_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0),UNIQUE(user_id,lesson_id)
);
CREATE INDEX notes_user_updated ON learning.lesson_notes(user_id,updated_at DESC,id);
CREATE TABLE learning.dictation_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,dictation_id uuid NOT NULL,dictation_revision_id uuid NOT NULL,lesson_id uuid NOT NULL,course_id uuid NOT NULL,topic_id uuid NOT NULL,
 title_snapshot text NOT NULL,instructions_snapshot text NOT NULL,audio_asset_id uuid NOT NULL,answer text NOT NULL DEFAULT '' CHECK(length(answer)<=10000),
 status text NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','submitted','cancelled')),
 grading_policy_version integer NOT NULL DEFAULT 1 CHECK(grading_policy_version=1),result jsonb,submitted_at timestamptz,cancelled_at timestamptz,cancel_reason text,
 creation_xid xid8 NOT NULL DEFAULT pg_current_xact_id(),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0),
 CHECK((status='in_progress' AND result IS NULL AND submitted_at IS NULL AND cancelled_at IS NULL AND cancel_reason IS NULL) OR
 (status='submitted' AND result IS NOT NULL AND submitted_at IS NOT NULL AND cancelled_at IS NULL AND cancel_reason IS NULL) OR
 (status='cancelled' AND result IS NULL AND submitted_at IS NULL AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL))
);
CREATE TABLE learning.dictation_attempt_keys (
 attempt_id uuid PRIMARY KEY REFERENCES learning.dictation_attempts(id) ON DELETE RESTRICT,transcript_snapshot text NOT NULL CHECK(length(btrim(transcript_snapshot)) BETWEEN 1 AND 10000)
);
CREATE UNIQUE INDEX dictation_one_active ON learning.dictation_attempts(user_id,dictation_id) WHERE status='in_progress';
CREATE INDEX dictation_history ON learning.dictation_attempts(user_id,created_at DESC,id);

CREATE FUNCTION content.dictation_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE n integer;
BEGIN
 IF TG_TABLE_NAME='dictations' THEN
  IF TG_OP='UPDATE' AND ROW(NEW.id,NEW.lesson_id) IS DISTINCT FROM ROW(OLD.id,OLD.lesson_id) THEN RAISE EXCEPTION 'dictation_cannot_move' USING ERRCODE='23514'; END IF;
  IF NEW.status='published' AND NEW.published_revision_id IS NULL THEN RAISE EXCEPTION 'published_revision_required' USING ERRCODE='23514'; END IF;
  IF NEW.published_revision_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM content.dictation_revisions WHERE id=NEW.published_revision_id AND dictation_id=NEW.id AND published_at IS NOT NULL) THEN RAISE EXCEPTION 'published_revision_required' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='DELETE' THEN
   IF OLD.published_at IS NOT NULL THEN RAISE EXCEPTION 'published_revision_immutable' USING ERRCODE='23514'; END IF; RETURN OLD;
  END IF;
  IF TG_OP='UPDATE' AND (OLD.published_at IS NOT NULL OR ROW(NEW.id,NEW.dictation_id,NEW.revision_no) IS DISTINCT FROM ROW(OLD.id,OLD.dictation_id,OLD.revision_no)) THEN RAISE EXCEPTION 'published_revision_immutable' USING ERRCODE='23514'; END IF;
  IF NEW.published_at IS NOT NULL THEN
   SELECT count(*) INTO n FROM regexp_matches(lower(replace(normalize(NEW.transcript,NFC),'’','''')), '[[:alnum:]]+(''[[:alnum:]]+)*','g');
   IF n NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'invalid_transcript_length' USING ERRCODE='23514'; END IF;
   IF NOT EXISTS(SELECT 1 FROM content.media_assets WHERE id=NEW.audio_asset_id AND status='ready') THEN RAISE EXCEPTION 'audio_not_ready' USING ERRCODE='23514'; END IF;
  END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER dictation_guard BEFORE INSERT OR UPDATE ON content.dictations FOR EACH ROW EXECUTE FUNCTION content.dictation_guard();
CREATE TRIGGER dictation_revision_guard BEFORE INSERT OR UPDATE OR DELETE ON content.dictation_revisions FOR EACH ROW EXECUTE FUNCTION content.dictation_guard();

CREATE FUNCTION learning.dictation_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_TABLE_NAME='dictation_attempt_keys' THEN
  IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM learning.dictation_attempts WHERE id=NEW.attempt_id AND status='in_progress' AND creation_xid=pg_current_xact_id()) THEN RAISE EXCEPTION 'snapshot_closed' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND (OLD.status<>'in_progress' OR ROW(NEW.id,NEW.user_id,NEW.dictation_id,NEW.dictation_revision_id,NEW.lesson_id,NEW.course_id,NEW.topic_id,NEW.title_snapshot,NEW.instructions_snapshot,NEW.audio_asset_id,NEW.grading_policy_version,NEW.creation_xid) IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.dictation_id,OLD.dictation_revision_id,OLD.lesson_id,OLD.course_id,OLD.topic_id,OLD.title_snapshot,OLD.instructions_snapshot,OLD.audio_asset_id,OLD.grading_policy_version,OLD.creation_xid)) THEN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER dictation_attempt_guard BEFORE UPDATE OR DELETE ON learning.dictation_attempts FOR EACH ROW EXECUTE FUNCTION learning.dictation_guard();
CREATE TRIGGER dictation_key_guard BEFORE INSERT OR UPDATE OR DELETE ON learning.dictation_attempt_keys FOR EACH ROW EXECUTE FUNCTION learning.dictation_guard();
CREATE FUNCTION learning.dictation_snapshot_complete() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM learning.dictation_attempt_keys WHERE attempt_id=NEW.id) THEN RAISE EXCEPTION 'snapshot_incomplete' USING ERRCODE='23514'; END IF;RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER dictation_snapshot_complete AFTER INSERT ON learning.dictation_attempts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.dictation_snapshot_complete();

DO $$ DECLARE s text;t text;role_name text; BEGIN
 FOREACH s IN ARRAY ARRAY['content','learning'] LOOP
  role_name:='app_'||s||'_runtime';
  FOREACH t IN ARRAY CASE WHEN s='content' THEN ARRAY['dictations','dictation_revisions'] ELSE ARRAY['lesson_notes','dictation_attempts','dictation_attempt_keys'] END LOOP
   EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',s,t);
   EXECUTE format('REVOKE ALL ON %I.%I FROM PUBLIC,anon,authenticated',s,t);
   EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I.%I TO %I',s,t,role_name);
   EXECUTE format('CREATE POLICY service_access ON %I.%I TO %I USING(true) WITH CHECK(true)',s,t,role_name);
   IF t<>'dictation_attempt_keys' THEN EXECUTE format('CREATE TRIGGER z_touch BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION %I.touch_row()',s,t,s); END IF;
   IF s='content' THEN EXECUTE format('CREATE TRIGGER a_lock BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH STATEMENT EXECUTE FUNCTION content.lock_writes()',s,t); END IF;
  END LOOP;
 END LOOP;
END $$;
REVOKE DELETE ON content.dictations,learning.dictation_attempts FROM app_content_runtime,app_learning_runtime;
REVOKE UPDATE,DELETE ON learning.dictation_attempt_keys FROM app_learning_runtime;
REVOKE ALL ON FUNCTION content.dictation_guard(),learning.dictation_guard(),learning.dictation_snapshot_complete() FROM PUBLIC,anon,authenticated;
