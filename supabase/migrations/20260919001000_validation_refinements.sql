-- Additive upgrade: preserve all existing account, content and learning data.
CREATE OR REPLACE FUNCTION learning.normalize_answer(value text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT lower(btrim(regexp_replace(normalize(value,NFC),'[[:space:]  ]+',' ','g')));
$$;

-- Require nonempty hierarchy on publication, not when hiding its last child later.
-- An empty visible catalog is rendered as "Chưa có nội dung" by the application.
CREATE OR REPLACE FUNCTION content.publication_check() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE j jsonb:=to_jsonb(NEW); oldj jsonb:=to_jsonb(OLD); publishing boolean;
BEGIN
 IF TG_TABLE_NAME='question_revisions' THEN
  PERFORM content.validate_question(NEW.id);
  UPDATE content.questions SET first_published_at=NEW.published_at WHERE id=NEW.question_id AND first_published_at IS NULL AND NEW.published_at IS NOT NULL;
 ELSIF TG_TABLE_NAME='lesson_revisions' THEN
  PERFORM content.validate_lesson(NEW.id);
  IF NEW.published_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM content.assessments WHERE lesson_id=NEW.lesson_id AND status='published') THEN RAISE EXCEPTION 'published_lesson_requires_quiz' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='assessment_revisions' THEN PERFORM content.validate_assessment(NEW.id);
 END IF;
 IF EXISTS(SELECT 1 FROM content.lessons l LEFT JOIN content.lesson_revisions r ON r.id=l.published_revision_id WHERE l.published_revision_id IS NOT NULL AND r.published_at IS NULL)
 OR EXISTS(SELECT 1 FROM content.assessments a LEFT JOIN content.assessment_revisions r ON r.id=a.published_revision_id WHERE a.published_revision_id IS NOT NULL AND r.published_at IS NULL) THEN RAISE EXCEPTION 'pointer_requires_published_revision' USING ERRCODE='23514'; END IF;
 publishing:=TG_OP<>'DELETE' AND j->>'status'='published' AND (TG_OP='INSERT' OR oldj->>'status' IS DISTINCT FROM 'published');
 IF publishing THEN
  IF TG_TABLE_NAME='courses' AND NOT EXISTS(SELECT 1 FROM content.topics WHERE course_id=(j->>'id')::uuid AND status='published') THEN RAISE EXCEPTION 'published_parent_requires_content' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME='topics' AND NOT EXISTS(SELECT 1 FROM content.lessons WHERE topic_id=(j->>'id')::uuid AND status='published') THEN RAISE EXCEPTION 'published_parent_requires_content' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME='lessons' AND NOT EXISTS(SELECT 1 FROM content.assessments WHERE lesson_id=(j->>'id')::uuid AND status='published') THEN RAISE EXCEPTION 'published_lesson_requires_quiz' USING ERRCODE='23514'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM content.assessments a JOIN content.assessment_revision_questions aq ON aq.assessment_revision_id=a.published_revision_id JOIN content.assessments b ON b.kind<>a.kind AND b.status='published' JOIN content.assessment_revision_questions bq ON bq.assessment_revision_id=b.published_revision_id AND bq.question_id=aq.question_id WHERE a.status='published') THEN RAISE EXCEPTION 'quiz_test_question_overlap' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;

CREATE FUNCTION learning.wrong_question_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF ROW(NEW.user_id,NEW.question_id) IS DISTINCT FROM ROW(OLD.user_id,OLD.question_id) THEN RAISE EXCEPTION 'wrong_question_identity_immutable' USING ERRCODE='23514'; END IF;
 IF NEW.source_attempt_item_id<>OLD.source_attempt_item_id THEN
  IF NEW.generation<>OLD.generation+1 OR NEW.status<>'pending' OR NEW.last_failed_at<OLD.last_failed_at THEN RAISE EXCEPTION 'new_failure_requires_next_generation' USING ERRCODE='23514'; END IF;
 ELSIF ROW(NEW.generation,NEW.last_failed_at) IS DISTINCT FROM ROW(OLD.generation,OLD.last_failed_at) THEN RAISE EXCEPTION 'failure_generation_immutable_without_new_source' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER wrong_question_guard BEFORE UPDATE ON learning.wrong_questions FOR EACH ROW EXECUTE FUNCTION learning.wrong_question_guard();
REVOKE ALL ON FUNCTION learning.wrong_question_guard() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION learning.wrong_question_guard() TO app_learning_runtime;
