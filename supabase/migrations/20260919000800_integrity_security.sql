-- Database enforcement. All helpers are private; runtime connections do not own objects.
-- Serialize low-volume CMS writes to prevent publication/child-edit write skew.
CREATE FUNCTION content.lock_writes() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN PERFORM pg_advisory_xact_lock(19092026,1); RETURN NULL; END $$;
CREATE FUNCTION identity.lock_writes() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN PERFORM pg_advisory_xact_lock(19092026,2); RETURN NULL; END $$;

CREATE FUNCTION identity.profile_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'disable_profile_instead_of_delete' USING ERRCODE='23514'; END IF;
 IF NEW.user_id<>OLD.user_id THEN RAISE EXCEPTION 'immutable_user_id' USING ERRCODE='23514'; END IF;
 IF OLD.sessions_revoked_before IS NOT NULL AND (NEW.sessions_revoked_before IS NULL OR NEW.sessions_revoked_before<OLD.sessions_revoked_before) THEN
  RAISE EXCEPTION 'revocation_cutoff_cannot_move_back' USING ERRCODE='23514';
 END IF;
 IF OLD.role='admin' AND OLD.status='active' AND (NEW.role<>'admin' OR NEW.status<>'active')
 AND NOT EXISTS(SELECT 1 FROM identity.profiles WHERE role='admin' AND status='active' AND user_id<>OLD.user_id) THEN
  RAISE EXCEPTION 'last_active_admin' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER profile_guard BEFORE UPDATE OR DELETE ON identity.profiles FOR EACH ROW EXECUTE FUNCTION identity.profile_guard();
CREATE FUNCTION identity.validate_permissions() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM identity.editor_permissions p JOIN identity.profiles u ON u.user_id=p.user_id WHERE u.role<>'editor') THEN
  RAISE EXCEPTION 'editor_role_required' USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER permissions_valid AFTER INSERT OR UPDATE OR DELETE ON identity.editor_permissions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION identity.validate_permissions();
CREATE CONSTRAINT TRIGGER profile_permissions_valid AFTER UPDATE ON identity.profiles DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION identity.validate_permissions();
CREATE FUNCTION identity.session_state(p_session_id uuid,p_user_id uuid)
RETURNS TABLE(created_at timestamptz,not_after timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT s.created_at,s.not_after FROM auth.sessions s WHERE s.id=p_session_id AND s.user_id=p_user_id
 AND (s.not_after IS NULL OR s.not_after>now());
$$;

CREATE FUNCTION content.root_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE oldj jsonb:=to_jsonb(OLD); newj jsonb:=to_jsonb(NEW); k text;
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.first_published_at IS NOT NULL THEN RAISE EXCEPTION 'published_root_cannot_delete' USING ERRCODE='23514'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.id<>OLD.id THEN RAISE EXCEPTION 'immutable_id' USING ERRCODE='23514'; END IF;
  IF OLD.first_published_at IS NOT NULL THEN
   IF NEW.first_published_at IS DISTINCT FROM OLD.first_published_at THEN RAISE EXCEPTION 'immutable_first_publication' USING ERRCODE='23514'; END IF;
   FOREACH k IN ARRAY ARRAY['course_id','topic_id','lesson_id','kind'] LOOP
    IF oldj->k IS DISTINCT FROM newj->k THEN RAISE EXCEPTION 'published_parent_immutable' USING ERRCODE='23514'; END IF;
   END LOOP;
  END IF;
 END IF;
 IF NEW.status='published' AND NEW.first_published_at IS NULL THEN NEW.first_published_at:=clock_timestamp(); END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION content.revision_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE k text;
BEGIN
 IF OLD.published_at IS NOT NULL THEN RAISE EXCEPTION 'published_revision_immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 FOREACH k IN ARRAY ARRAY['id','lesson_id','question_id','assessment_id','revision_no','created_by'] LOOP
  IF to_jsonb(OLD)->k IS DISTINCT FROM to_jsonb(NEW)->k THEN RAISE EXCEPTION 'revision_identity_immutable' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE FUNCTION content.revision_child_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE j jsonb; parent_id uuid; published timestamptz;
BEGIN
 IF TG_OP='UPDATE' AND to_jsonb(OLD)->TG_ARGV[1] IS DISTINCT FROM to_jsonb(NEW)->TG_ARGV[1] THEN
  RAISE EXCEPTION 'revision_child_cannot_move' USING ERRCODE='23514';
 END IF;
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 parent_id:=(j->>TG_ARGV[1])::uuid;
 EXECUTE format('SELECT published_at FROM content.%I WHERE id=$1 FOR UPDATE',TG_ARGV[0]) INTO published USING parent_id;
 IF published IS NOT NULL THEN RAISE EXCEPTION 'published_revision_children_immutable' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE FUNCTION content.media_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF ROW(NEW.id,NEW.bucket,NEW.object_key,NEW.checksum,NEW.size_bytes,NEW.mime_type,NEW.uploaded_by)
 IS DISTINCT FROM ROW(OLD.id,OLD.bucket,OLD.object_key,OLD.checksum,OLD.size_bytes,OLD.mime_type,OLD.uploaded_by) THEN
  RAISE EXCEPTION 'media_object_immutable' USING ERRCODE='23514';
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER media_guard BEFORE UPDATE ON content.media_assets FOR EACH ROW EXECUTE FUNCTION content.media_guard();

CREATE FUNCTION content.validate_question(p_id uuid) RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE q content.question_revisions; k content.question_answer_keys; n integer;
BEGIN
 SELECT * INTO q FROM content.question_revisions WHERE id=p_id;
 IF NOT FOUND OR q.published_at IS NULL THEN RETURN; END IF;
 SELECT * INTO k FROM content.question_answer_keys WHERE question_revision_id=p_id;
 IF NOT FOUND OR btrim(k.explanation)='' OR btrim(q.prompt)='' THEN RAISE EXCEPTION 'question_missing_answer_or_text' USING ERRCODE='23514'; END IF;
 SELECT count(*) INTO n FROM content.question_options WHERE question_revision_id=p_id;
 IF q.type='single_choice' THEN
  IF n NOT BETWEEN 2 AND 4 OR k.correct_option_key IS NULL OR k.accepted_answers IS NOT NULL THEN RAISE EXCEPTION 'invalid_single_choice' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM content.question_options WHERE question_revision_id=p_id GROUP BY lower(regexp_replace(btrim(text),'\s+',' ','g')) HAVING count(*)>1) THEN RAISE EXCEPTION 'duplicate_option_text' USING ERRCODE='23514'; END IF;
 ELSE
  IF n<>0 OR k.correct_option_key IS NOT NULL OR k.accepted_answers IS NULL OR cardinality(k.accepted_answers)=0
  OR EXISTS(SELECT 1 FROM unnest(k.accepted_answers) a WHERE a IS NULL OR btrim(a)='') THEN RAISE EXCEPTION 'invalid_fill_blank' USING ERRCODE='23514'; END IF;
 END IF;
 IF q.audio_asset_id IS NOT NULL AND (NOT EXISTS(SELECT 1 FROM content.media_assets WHERE id=q.audio_asset_id AND status='ready') OR coalesce(btrim(k.transcript),'')='') THEN
  RAISE EXCEPTION 'question_audio_or_transcript_missing' USING ERRCODE='23514';
 END IF;
END $$;
CREATE FUNCTION content.validate_lesson(p_id uuid) RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE r content.lesson_revisions; b jsonb; v jsonb;
BEGIN
 SELECT * INTO r FROM content.lesson_revisions WHERE id=p_id;
 IF NOT FOUND OR r.published_at IS NULL THEN RETURN; END IF;
 IF btrim(r.title)='' OR btrim(r.objectives)='' OR jsonb_array_length(r.blocks)=0 THEN RAISE EXCEPTION 'lesson_missing_content' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(r.blocks) x GROUP BY x->>'id' HAVING count(*)>1) THEN RAISE EXCEPTION 'duplicate_block_id' USING ERRCODE='23514'; END IF;
 FOR b IN SELECT * FROM jsonb_array_elements(r.blocks) LOOP
  IF coalesce(b->>'id','')='' OR coalesce(b->>'type','') NOT IN ('text','grammar','reading','vocabulary','audio') THEN RAISE EXCEPTION 'invalid_block' USING ERRCODE='23514'; END IF;
  IF b->>'type' IN ('text','grammar','reading') AND coalesce(btrim(b->>'body'),'')='' THEN RAISE EXCEPTION 'empty_block' USING ERRCODE='23514'; END IF;
  IF b->>'type'='audio' AND (coalesce(btrim(b->>'transcript'),'')='' OR NOT EXISTS(SELECT 1 FROM content.lesson_revision_assets a JOIN content.media_assets m ON m.id=a.asset_id WHERE a.lesson_revision_id=p_id AND a.asset_id=(b->>'asset_id')::uuid AND m.status='ready')) THEN RAISE EXCEPTION 'lesson_audio_missing' USING ERRCODE='23514'; END IF;
  IF b->>'type'='vocabulary' THEN
   IF coalesce(jsonb_typeof(b->'vocabulary_ids'),'')<>'array' OR jsonb_array_length(b->'vocabulary_ids')=0 THEN RAISE EXCEPTION 'empty_vocabulary_block' USING ERRCODE='23514'; END IF;
   FOR v IN SELECT * FROM jsonb_array_elements(b->'vocabulary_ids') LOOP
    IF NOT EXISTS(SELECT 1 FROM content.lesson_revision_vocabulary WHERE lesson_revision_id=p_id AND vocabulary_id=(v#>>'{}')::uuid) THEN RAISE EXCEPTION 'missing_vocabulary_snapshot' USING ERRCODE='23514'; END IF;
   END LOOP;
  END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM content.lesson_revision_vocabulary v WHERE v.lesson_revision_id=p_id AND
  (coalesce(btrim(v.snapshot->>'word'),'')='' OR coalesce(btrim(v.snapshot->>'meaning'),'')='' OR
  (v.snapshot->>'audio_asset_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM content.lesson_revision_assets a WHERE a.lesson_revision_id=p_id AND a.asset_id=(v.snapshot->>'audio_asset_id')::uuid)))) THEN RAISE EXCEPTION 'invalid_vocabulary_snapshot' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM content.lesson_revision_assets a JOIN content.media_assets m ON m.id=a.asset_id WHERE a.lesson_revision_id=p_id AND m.status<>'ready') THEN RAISE EXCEPTION 'asset_unavailable' USING ERRCODE='23514'; END IF;
END $$;
CREATE FUNCTION content.validate_assessment(p_id uuid) RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE r content.assessment_revisions; a content.assessments; n integer; x record;
BEGIN
 SELECT * INTO r FROM content.assessment_revisions WHERE id=p_id;
 IF NOT FOUND OR r.published_at IS NULL THEN RETURN; END IF;
 SELECT * INTO a FROM content.assessments WHERE id=r.assessment_id;
 SELECT count(*) INTO n FROM content.assessment_revision_questions WHERE assessment_revision_id=p_id;
 IF btrim(r.title)='' OR r.passing_percent<>70 OR r.grading_policy_version<>1 OR (a.kind='quiz' AND n NOT BETWEEN 5 AND 10) OR (a.kind='topic_test' AND n NOT BETWEEN 10 AND 20) THEN RAISE EXCEPTION 'invalid_assessment_structure' USING ERRCODE='23514'; END IF;
 FOR x IN SELECT q.id,q.lesson_id,q.status,l.topic_id,l.status AS lesson_status,qr.published_at,aq.question_revision_id FROM content.assessment_revision_questions aq JOIN content.questions q ON q.id=aq.question_id JOIN content.lessons l ON l.id=q.lesson_id JOIN content.question_revisions qr ON qr.id=aq.question_revision_id WHERE aq.assessment_revision_id=p_id LOOP
  IF x.published_at IS NULL OR x.status<>'active' OR (a.kind='quiz' AND x.lesson_id<>a.lesson_id) OR (a.kind='topic_test' AND (x.topic_id<>a.topic_id OR x.lesson_status<>'published')) THEN RAISE EXCEPTION 'invalid_assessment_question' USING ERRCODE='23514'; END IF;
  PERFORM content.validate_question(x.question_revision_id);
 END LOOP;
END $$;

CREATE FUNCTION content.publication_check() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE pub timestamptz;
BEGIN
 IF TG_TABLE_NAME='question_revisions' THEN
  PERFORM content.validate_question(NEW.id);
  UPDATE content.questions SET first_published_at=NEW.published_at WHERE id=NEW.question_id AND first_published_at IS NULL AND NEW.published_at IS NOT NULL;
 ELSIF TG_TABLE_NAME='lesson_revisions' THEN PERFORM content.validate_lesson(NEW.id);
 ELSIF TG_TABLE_NAME='assessment_revisions' THEN PERFORM content.validate_assessment(NEW.id);
 END IF;
 -- Only check pointers/availability for current publications; old revisions remain historical.
 IF EXISTS(SELECT 1 FROM content.lessons l LEFT JOIN content.lesson_revisions r ON r.id=l.published_revision_id WHERE l.published_revision_id IS NOT NULL AND r.published_at IS NULL)
 OR EXISTS(SELECT 1 FROM content.assessments a LEFT JOIN content.assessment_revisions r ON r.id=a.published_revision_id WHERE a.published_revision_id IS NOT NULL AND r.published_at IS NULL) THEN RAISE EXCEPTION 'pointer_requires_published_revision' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM content.lessons l WHERE l.status='published' AND NOT EXISTS(SELECT 1 FROM content.assessments a WHERE a.lesson_id=l.id AND a.kind='quiz' AND a.status='published')) THEN RAISE EXCEPTION 'published_lesson_requires_quiz' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM content.topics t WHERE t.status='published' AND NOT EXISTS(SELECT 1 FROM content.lessons l WHERE l.topic_id=t.id AND l.status='published'))
 OR EXISTS(SELECT 1 FROM content.courses c WHERE c.status='published' AND NOT EXISTS(SELECT 1 FROM content.topics t WHERE t.course_id=c.id AND t.status='published')) THEN RAISE EXCEPTION 'published_parent_requires_content' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM content.assessments a JOIN content.assessment_revision_questions aq ON aq.assessment_revision_id=a.published_revision_id JOIN content.assessments b ON b.kind<>a.kind AND b.status='published' JOIN content.assessment_revision_questions bq ON bq.assessment_revision_id=b.published_revision_id AND bq.question_id=aq.question_id WHERE a.status='published') THEN RAISE EXCEPTION 'quiz_test_question_overlap' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;

CREATE FUNCTION content.bump_catalog() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE j jsonb; oldj jsonb; newj jsonb; cid uuid; oldcid uuid;
BEGIN
 oldj:=to_jsonb(OLD); newj:=to_jsonb(NEW);
 IF TG_OP='UPDATE' AND oldj->'status' IS NOT DISTINCT FROM newj->'status' AND oldj->'position' IS NOT DISTINCT FROM newj->'position' AND oldj->'topic_id' IS NOT DISTINCT FROM newj->'topic_id' AND oldj->'course_id' IS NOT DISTINCT FROM newj->'course_id' THEN RETURN NULL; END IF;
 j:=CASE WHEN TG_OP='DELETE' THEN oldj ELSE newj END;
 IF TG_TABLE_NAME='courses' THEN cid:=(j->>'id')::uuid;
 ELSIF TG_TABLE_NAME='topics' THEN cid:=(j->>'course_id')::uuid; oldcid:=(oldj->>'course_id')::uuid;
 ELSIF TG_TABLE_NAME='lessons' THEN SELECT course_id INTO cid FROM content.topics WHERE id=(j->>'topic_id')::uuid; SELECT course_id INTO oldcid FROM content.topics WHERE id=(oldj->>'topic_id')::uuid;
 END IF;
 UPDATE content.courses SET catalog_version=catalog_version+1 WHERE id=cid OR id=oldcid;
 RETURN NULL;
END $$;

DO $$ DECLARE s text; t text; x record; BEGIN
 FOR x IN SELECT table_schema,table_name FROM information_schema.tables WHERE table_schema IN ('identity','content','learning') AND table_type='BASE TABLE' LOOP
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=x.table_schema AND table_name=x.table_name AND column_name='row_version') THEN
   EXECUTE format('CREATE TRIGGER z_touch BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION %I.touch_row()',x.table_schema,x.table_name,x.table_schema);
  END IF;
  IF x.table_schema IN ('identity','content') THEN
   EXECUTE format('CREATE TRIGGER a_lock BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH STATEMENT EXECUTE FUNCTION %I.lock_writes()',x.table_schema,x.table_name,x.table_schema);
  END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['courses','topics','lessons','questions','assessments'] LOOP
  EXECUTE format('CREATE TRIGGER root_guard BEFORE INSERT OR UPDATE OR DELETE ON content.%I FOR EACH ROW EXECUTE FUNCTION content.root_guard()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['lesson_revisions','question_revisions','assessment_revisions'] LOOP
  EXECUTE format('CREATE TRIGGER revision_guard BEFORE UPDATE OR DELETE ON content.%I FOR EACH ROW EXECUTE FUNCTION content.revision_guard()',t);
  EXECUTE format('CREATE CONSTRAINT TRIGGER publication_check AFTER INSERT OR UPDATE ON content.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION content.publication_check()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['courses','topics','lessons','assessments'] LOOP
  EXECUTE format('CREATE CONSTRAINT TRIGGER publication_check AFTER INSERT OR UPDATE OR DELETE ON content.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION content.publication_check()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['courses','topics','lessons'] LOOP
  EXECUTE format('CREATE TRIGGER catalog_change AFTER INSERT OR UPDATE OR DELETE ON content.%I FOR EACH ROW EXECUTE FUNCTION content.bump_catalog()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['lesson_revision_vocabulary','lesson_revision_assets'] LOOP
  EXECUTE format('CREATE TRIGGER child_guard BEFORE INSERT OR UPDATE OR DELETE ON content.%I FOR EACH ROW EXECUTE FUNCTION content.revision_child_guard(''lesson_revisions'',''lesson_revision_id'')',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['question_options','question_answer_keys'] LOOP
  EXECUTE format('CREATE TRIGGER child_guard BEFORE INSERT OR UPDATE OR DELETE ON content.%I FOR EACH ROW EXECUTE FUNCTION content.revision_child_guard(''question_revisions'',''question_revision_id'')',t);
 END LOOP;
END $$;
CREATE TRIGGER child_guard BEFORE INSERT OR UPDATE OR DELETE ON content.assessment_revision_questions FOR EACH ROW EXECUTE FUNCTION content.revision_child_guard('assessment_revisions','assessment_revision_id');

-- Transaction stamps only guard construction of frozen item lists; never exposed by DTOs.
ALTER TABLE learning.attempts ADD COLUMN creation_xid xid8 NOT NULL DEFAULT pg_current_xact_id();
ALTER TABLE learning.flashcard_sessions ADD COLUMN creation_xid xid8 NOT NULL DEFAULT pg_current_xact_id();

CREATE FUNCTION learning.attempt_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'attempt_history_cannot_delete' USING ERRCODE='23514'; END IF;
 IF OLD.status<>'in_progress' THEN RAISE EXCEPTION 'attempt_terminal' USING ERRCODE='23514'; END IF;
 IF (to_jsonb(NEW)-ARRAY['status','correct_count','passed','submitted_at','cancelled_at','cancel_reason','updated_at','row_version']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','correct_count','passed','submitted_at','cancelled_at','cancel_reason','updated_at','row_version']) THEN RAISE EXCEPTION 'attempt_snapshot_immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attempt_guard BEFORE UPDATE OR DELETE ON learning.attempts FOR EACH ROW EXECUTE FUNCTION learning.attempt_guard();
CREATE FUNCTION learning.item_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE aid uuid; a learning.attempts;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'attempt_snapshot_immutable' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='attempt_items' THEN aid:=NEW.attempt_id;
 ELSE SELECT attempt_id INTO aid FROM learning.attempt_items WHERE id=NEW.attempt_item_id; END IF;
 SELECT * INTO a FROM learning.attempts WHERE id=aid FOR UPDATE;
 IF a.status<>'in_progress' OR a.creation_xid<>pg_current_xact_id() THEN RAISE EXCEPTION 'attempt_items_frozen' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER item_guard BEFORE INSERT OR UPDATE OR DELETE ON learning.attempt_items FOR EACH ROW EXECUTE FUNCTION learning.item_guard();
CREATE TRIGGER key_guard BEFORE INSERT OR UPDATE OR DELETE ON learning.attempt_item_keys FOR EACH ROW EXECUTE FUNCTION learning.item_guard();
CREATE FUNCTION learning.answer_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE aid uuid; a learning.attempts; j jsonb;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'answer_history_cannot_delete' USING ERRCODE='23514'; END IF;
 SELECT attempt_id,public_snapshot INTO aid,j FROM learning.attempt_items WHERE id=NEW.attempt_item_id;
 SELECT * INTO a FROM learning.attempts WHERE id=aid FOR UPDATE;
 IF a.status<>'in_progress' THEN RAISE EXCEPTION 'attempt_terminal' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.checked_at IS NOT NULL OR NEW.attempt_item_id<>OLD.attempt_item_id) THEN RAISE EXCEPTION 'answer_locked' USING ERRCODE='23514'; END IF;
 IF NEW.answer<>'{}'::jsonb THEN
  IF j->>'type'='single_choice' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(j->'options') o WHERE o->>'option_key'=NEW.answer->>'option_key') THEN RAISE EXCEPTION 'unknown_option' USING ERRCODE='23514'; END IF;
  IF j->>'type'='fill_blank' AND coalesce(jsonb_typeof(NEW.answer->'text'),'')<>'string' THEN RAISE EXCEPTION 'text_answer_required' USING ERRCODE='23514'; END IF;
 END IF;
 UPDATE learning.attempts SET row_version=row_version WHERE id=aid;
 RETURN NEW;
END $$;
CREATE TRIGGER answer_guard BEFORE INSERT OR UPDATE OR DELETE ON learning.attempt_answers FOR EACH ROW EXECUTE FUNCTION learning.answer_guard();

CREATE FUNCTION learning.validate_attempt() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE aid uuid; a learning.attempts; n integer; k integer; checked integer; correct integer;
BEGIN
 IF TG_TABLE_NAME='attempts' THEN aid:=NEW.id;
 ELSIF TG_TABLE_NAME='attempt_items' THEN aid:=NEW.attempt_id;
 ELSE SELECT attempt_id INTO aid FROM learning.attempt_items WHERE id=NEW.attempt_item_id; END IF;
 SELECT * INTO a FROM learning.attempts WHERE id=aid;
 SELECT count(*),count(ak.attempt_item_id) INTO n,k FROM learning.attempt_items i LEFT JOIN learning.attempt_item_keys ak ON ak.attempt_item_id=i.id WHERE i.attempt_id=aid;
 IF n<>a.total_count OR k<>n THEN RAISE EXCEPTION 'attempt_snapshot_incomplete' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM learning.attempt_items i JOIN learning.attempt_item_keys ak ON ak.attempt_item_id=i.id WHERE i.attempt_id=aid AND
  ((a.kind='mistake_review')<>(i.mistake_generation IS NOT NULL) OR coalesce(i.public_snapshot->>'type','') NOT IN ('single_choice','fill_blank') OR i.public_snapshot ?| ARRAY['correct_option_key','accepted_answers','explanation','transcript'] OR
  ak.answer_snapshot->>'type' IS DISTINCT FROM i.public_snapshot->>'type' OR
  (i.public_snapshot->>'type'='single_choice' AND (coalesce(ak.answer_snapshot->>'correct_option_key','')='' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(i.public_snapshot->'options') o WHERE o->>'option_key'=ak.answer_snapshot->>'correct_option_key'))) OR
  (i.public_snapshot->>'type'='fill_blank' AND (coalesce(jsonb_typeof(ak.answer_snapshot->'accepted_answers'),'')<>'array' OR ak.answer_snapshot->'accepted_answers'='[]'::jsonb)))) THEN RAISE EXCEPTION 'invalid_attempt_snapshot' USING ERRCODE='23514'; END IF;
 SELECT count(*) FILTER(WHERE ans.checked_at IS NOT NULL),count(*) FILTER(WHERE ans.is_correct) INTO checked,correct FROM learning.attempt_items i JOIN learning.attempt_answers ans ON ans.attempt_item_id=i.id WHERE i.attempt_id=aid;
 IF a.status='submitted' AND (checked<>n OR correct<>a.correct_count) THEN RAISE EXCEPTION 'result_does_not_match_answers' USING ERRCODE='23514'; END IF;
 IF a.kind='topic_test' AND a.status='in_progress' AND checked>0 THEN RAISE EXCEPTION 'test_cannot_check_before_submit' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['attempts','attempt_items','attempt_item_keys','attempt_answers'] LOOP
 EXECUTE format('CREATE CONSTRAINT TRIGGER attempt_valid AFTER INSERT OR UPDATE ON learning.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.validate_attempt()',t);
END LOOP; END $$;

CREATE FUNCTION learning.progress_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'progress_history_cannot_delete' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (ROW(NEW.user_id,NEW.lesson_id,NEW.first_opened_at) IS DISTINCT FROM ROW(OLD.user_id,OLD.lesson_id,OLD.first_opened_at) OR (OLD.completed_at IS NOT NULL AND ROW(NEW.completed_at,NEW.completion_attempt_id) IS DISTINCT FROM ROW(OLD.completed_at,OLD.completion_attempt_id))) THEN RAISE EXCEPTION 'completion_immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER progress_guard BEFORE UPDATE OR DELETE ON learning.lesson_progress FOR EACH ROW EXECUTE FUNCTION learning.progress_guard();
CREATE FUNCTION learning.validate_sources() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_TABLE_NAME='lesson_progress' THEN
  IF NEW.completion_attempt_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM learning.attempts a WHERE a.id=NEW.completion_attempt_id AND a.user_id=NEW.user_id AND a.lesson_id=NEW.lesson_id AND a.kind='quiz' AND a.status='submitted' AND a.passed) THEN RAISE EXCEPTION 'invalid_completion_attempt' USING ERRCODE='23514'; END IF;
 ELSE
  IF NOT EXISTS(SELECT 1 FROM learning.attempt_items i JOIN learning.attempts a ON a.id=i.attempt_id JOIN learning.attempt_answers ans ON ans.attempt_item_id=i.id WHERE i.id=NEW.source_attempt_item_id AND i.question_id=NEW.question_id AND a.user_id=NEW.user_id AND a.kind IN ('quiz','topic_test') AND a.status='submitted' AND ans.is_correct=false) THEN RAISE EXCEPTION 'invalid_wrong_question_source' USING ERRCODE='23514'; END IF;
 END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER source_valid AFTER INSERT OR UPDATE ON learning.lesson_progress DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.validate_sources();
CREATE CONSTRAINT TRIGGER source_valid AFTER INSERT OR UPDATE ON learning.wrong_questions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.validate_sources();

CREATE FUNCTION learning.flashcard_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'soft_delete_flashcard' USING ERRCODE='23514'; END IF;
 IF ROW(NEW.id,NEW.user_id,NEW.source_vocabulary_id,NEW.source_lesson_id,NEW.source_topic_id,NEW.source_course_id) IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.source_vocabulary_id,OLD.source_lesson_id,OLD.source_topic_id,OLD.source_course_id) THEN RAISE EXCEPTION 'card_source_immutable' USING ERRCODE='23514'; END IF;
 IF ROW(NEW.word,NEW.meaning) IS DISTINCT FROM ROW(OLD.word,OLD.meaning) OR (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
  NEW.reset_generation:=OLD.reset_generation+1; NEW.stage:=0; NEW.due_at:=clock_timestamp(); NEW.last_reviewed_at:=NULL;
 ELSIF NEW.reset_generation<>OLD.reset_generation THEN RAISE EXCEPTION 'reset_requires_content_change_or_restore' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER card_guard BEFORE UPDATE OR DELETE ON learning.flashcards FOR EACH ROW EXECUTE FUNCTION learning.flashcard_guard();
CREATE FUNCTION learning.session_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' OR OLD.status<>'in_progress' THEN RAISE EXCEPTION 'session_history_immutable' USING ERRCODE='23514'; END IF;
 IF to_jsonb(NEW)-ARRAY['status','finished_at','row_version','updated_at'] IS DISTINCT FROM to_jsonb(OLD)-ARRAY['status','finished_at','row_version','updated_at'] THEN RAISE EXCEPTION 'session_identity_immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER session_guard BEFORE UPDATE OR DELETE ON learning.flashcard_sessions FOR EACH ROW EXECUTE FUNCTION learning.session_guard();
CREATE FUNCTION learning.session_item_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE s learning.flashcard_sessions;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'session_item_immutable' USING ERRCODE='23514'; END IF;
 SELECT * INTO s FROM learning.flashcard_sessions WHERE id=NEW.session_id FOR UPDATE;
 IF s.status<>'in_progress' THEN RAISE EXCEPTION 'session_terminal' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND s.creation_xid<>pg_current_xact_id() THEN RAISE EXCEPTION 'session_items_frozen' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.status<>'pending' OR to_jsonb(NEW)-ARRAY['status','rating','reviewed_at','stage_before','stage_after','due_before','due_after','skip_reason'] IS DISTINCT FROM to_jsonb(OLD)-ARRAY['status','rating','reviewed_at','stage_before','stage_after','due_before','due_after','skip_reason']) THEN RAISE EXCEPTION 'session_item_immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER session_item_guard BEFORE INSERT OR UPDATE OR DELETE ON learning.flashcard_session_items FOR EACH ROW EXECUTE FUNCTION learning.session_item_guard();
CREATE FUNCTION learning.validate_session() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE sid uuid; s learning.flashcard_sessions; n integer; pending integer;
BEGIN
 sid:=CASE WHEN TG_TABLE_NAME='flashcard_sessions' THEN NEW.id ELSE NEW.session_id END;
 SELECT * INTO s FROM learning.flashcard_sessions WHERE id=sid;
 SELECT count(*),count(*) FILTER(WHERE status='pending') INTO n,pending FROM learning.flashcard_session_items WHERE session_id=sid;
 IF n NOT BETWEEN 1 AND 20 OR (s.status='completed' AND pending<>0) THEN RAISE EXCEPTION 'invalid_flashcard_session' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER session_valid AFTER INSERT OR UPDATE ON learning.flashcard_sessions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.validate_session();
CREATE CONSTRAINT TRIGGER session_valid AFTER INSERT OR UPDATE ON learning.flashcard_session_items DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.validate_session();

CREATE FUNCTION learning.dedup_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' OR OLD.result_reference IS NOT NULL THEN RAISE EXCEPTION 'dedup_result_immutable' USING ERRCODE='23514'; END IF;
 IF to_jsonb(NEW)-'result_reference' IS DISTINCT FROM to_jsonb(OLD)-'result_reference' THEN RAISE EXCEPTION 'dedup_request_immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER dedup_guard BEFORE UPDATE OR DELETE ON learning.request_dedup FOR EACH ROW EXECUTE FUNCTION learning.dedup_guard();
CREATE FUNCTION learning.validate_dedup() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM learning.request_dedup WHERE user_id=NEW.user_id AND operation=NEW.operation AND idempotency_key=NEW.idempotency_key AND result_reference IS NULL) THEN RAISE EXCEPTION 'dedup_result_required' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER dedup_valid AFTER INSERT OR UPDATE ON learning.request_dedup DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.validate_dedup();

-- Grants/policies are scoped to service roles, never to browser JWT roles.
DO $$ DECLARE x record; s text; t text; role_name text; BEGIN
 FOREACH s IN ARRAY ARRAY['identity','content','learning'] LOOP
  role_name:='app_'||s||'_runtime';
  EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA %I FROM PUBLIC,anon,authenticated,service_role',s);
  EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA %I FROM PUBLIC,anon,authenticated,service_role',s);
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I',s,role_name);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA %I TO %I',s,role_name);
  EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA %I TO %I',s,role_name);
  FOR x IN SELECT tablename FROM pg_tables WHERE schemaname=s LOOP
   EXECUTE format('CREATE POLICY service_access ON %I.%I TO %I USING(true) WITH CHECK(true)',s,x.tablename,role_name);
  END LOOP;
 END LOOP;
 FOREACH s IN ARRAY ARRAY['identity','content'] LOOP
  EXECUTE format('CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON %I.audit_events FOR EACH ROW EXECUTE FUNCTION %I.deny_change()',s,s);
  EXECUTE format('REVOKE UPDATE,DELETE ON %I.audit_events FROM %I',s,'app_'||s||'_runtime');
 END LOOP;
END $$;
REVOKE UPDATE,DELETE ON learning.attempt_items,learning.attempt_item_keys FROM app_learning_runtime;
REVOKE DELETE ON identity.profiles,identity.revoked_sessions FROM app_identity_runtime;
REVOKE DELETE ON learning.attempts,learning.attempt_answers,learning.lesson_progress,learning.wrong_questions,learning.flashcards,learning.flashcard_sessions,learning.flashcard_session_items,learning.request_dedup FROM app_learning_runtime;
CREATE TRIGGER revoked_immutable BEFORE UPDATE OR DELETE ON identity.revoked_sessions FOR EACH ROW EXECUTE FUNCTION identity.deny_change();
REVOKE UPDATE ON identity.revoked_sessions FROM app_identity_runtime;

CREATE INDEX profiles_role_status ON identity.profiles(role,status,user_id);
CREATE INDEX profiles_email ON identity.profiles(lower(email_cached));
CREATE INDEX permissions_granter ON identity.editor_permissions(granted_by);
CREATE INDEX revoked_user_time ON identity.revoked_sessions(user_id,revoked_at DESC);
CREATE INDEX identity_audit_target ON identity.audit_events(target_user_id,created_at DESC);
CREATE INDEX identity_audit_actor ON identity.audit_events(actor_user_id,created_at DESC);
CREATE INDEX courses_catalog ON content.courses(status,position,id);
CREATE INDEX topics_catalog ON content.topics(course_id,status,position,id);
CREATE INDEX lessons_catalog ON content.lessons(topic_id,status,position,id);
CREATE INDEX questions_lesson ON content.questions(lesson_id,status,id);
CREATE INDEX vocabulary_audio ON content.vocabulary_entries(audio_asset_id) WHERE audio_asset_id IS NOT NULL;
CREATE INDEX questions_audio ON content.question_revisions(audio_asset_id) WHERE audio_asset_id IS NOT NULL;
CREATE INDEX vocabulary_usage ON content.lesson_revision_vocabulary(vocabulary_id,lesson_revision_id);
CREATE INDEX media_usage ON content.lesson_revision_assets(asset_id,lesson_revision_id);
CREATE INDEX assessment_question_usage ON content.assessment_revision_questions(question_id,question_revision_id);
CREATE INDEX assessment_revision_usage ON content.assessment_revision_questions(question_revision_id);
CREATE INDEX content_audit_entity ON content.audit_events(entity_type,entity_id,created_at DESC);
CREATE INDEX progress_recent ON learning.lesson_progress(user_id,last_opened_at DESC,lesson_id);
CREATE INDEX progress_attempt ON learning.lesson_progress(completion_attempt_id) WHERE completion_attempt_id IS NOT NULL;
CREATE INDEX favorites_recent ON learning.lesson_favorites(user_id,created_at DESC,lesson_id);
CREATE INDEX daily_views_date ON learning.lesson_daily_views(activity_date,lesson_id,user_id);
CREATE INDEX attempts_history ON learning.attempts(user_id,started_at DESC,id);
CREATE INDEX attempts_topic ON learning.attempts(user_id,topic_id,kind,submitted_at DESC) WHERE status='submitted';
CREATE INDEX attempts_reporting ON learning.attempts(submitted_at,kind,user_id) WHERE status='submitted' AND kind IN ('quiz','topic_test');
CREATE INDEX wrong_pending ON learning.wrong_questions(user_id,last_failed_at,question_id) WHERE status='pending';
CREATE INDEX wrong_source ON learning.wrong_questions(source_attempt_item_id);
CREATE INDEX cards_due ON learning.flashcards(user_id,due_at,id) WHERE deleted_at IS NULL AND last_reviewed_at IS NOT NULL;
CREATE INDEX cards_new ON learning.flashcards(user_id,created_at,id) WHERE deleted_at IS NULL AND last_reviewed_at IS NULL;
CREATE INDEX cards_topic ON learning.flashcards(user_id,source_topic_id) WHERE deleted_at IS NULL;
CREATE INDEX cards_audio ON learning.flashcards(audio_asset_id) WHERE audio_asset_id IS NOT NULL;
CREATE INDEX card_review_history ON learning.flashcard_session_items(user_id,flashcard_id,reviewed_at DESC);
CREATE INDEX card_review_activity ON learning.flashcard_session_items(reviewed_at,user_id) WHERE status='reviewed';
