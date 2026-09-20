-- Transaction primitives for the Learning service. Caller must verify Auth, current
-- account permissions and Content availability before calling these private functions.
CREATE FUNCTION learning.normalize_answer(value text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT lower(regexp_replace(btrim(normalize(value,NFC)),'\s+',' ','g'));
$$;
CREATE FUNCTION learning.grade_answer(answer jsonb,key jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
BEGIN
 IF answer='{}'::jsonb THEN RETURN false; END IF;
 IF key->>'type'='single_choice' THEN RETURN coalesce(answer->>'option_key'=key->>'correct_option_key',false); END IF;
 RETURN EXISTS(SELECT 1 FROM jsonb_array_elements_text(key->'accepted_answers') a WHERE learning.normalize_answer(a)=learning.normalize_answer(answer->>'text'));
END $$;
CREATE FUNCTION learning.claim_request(p_user uuid,p_operation text,p_key uuid,p_payload jsonb) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE h text:=encode(sha256(convert_to(p_payload::text,'UTF8')),'hex'); r learning.request_dedup;
BEGIN
 INSERT INTO learning.request_dedup(user_id,operation,idempotency_key,request_hash) VALUES(p_user,p_operation,p_key,h) ON CONFLICT DO NOTHING;
 SELECT * INTO r FROM learning.request_dedup WHERE user_id=p_user AND operation=p_operation AND idempotency_key=p_key FOR UPDATE;
 IF r.request_hash<>h THEN RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE='23514'; END IF;
 RETURN r.result_reference;
END $$;
CREATE FUNCTION learning.finish_request(p_user uuid,p_operation text,p_key uuid,p_result jsonb) RETURNS void LANGUAGE sql SET search_path='' AS $$
 UPDATE learning.request_dedup SET result_reference=p_result WHERE user_id=p_user AND operation=p_operation AND idempotency_key=p_key;
$$;

CREATE FUNCTION learning.submit_attempt(p_user uuid,p_attempt uuid,p_key uuid,p_expected_version bigint) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE a learning.attempts; result jsonb; n integer; r record; ts timestamptz:=clock_timestamp();
BEGIN
 IF NOT EXISTS(SELECT 1 FROM learning.attempts WHERE id=p_attempt AND user_id=p_user) THEN RAISE EXCEPTION 'attempt_not_found' USING ERRCODE='42501'; END IF;
 result:=learning.claim_request(p_user,'attempt.submit',p_key,jsonb_build_object('attempt',p_attempt,'expectedVersion',p_expected_version));
 IF result IS NOT NULL THEN RETURN result; END IF;
 SELECT * INTO a FROM learning.attempts WHERE id=p_attempt AND user_id=p_user FOR UPDATE;
 IF a.status='submitted' THEN
  result:=jsonb_build_object('attempt_id',a.id,'status',a.status,'correct_count',a.correct_count,'total_count',a.total_count,'passed',a.passed);
  PERFORM learning.finish_request(p_user,'attempt.submit',p_key,result); RETURN result;
 END IF;
 IF a.status<>'in_progress' OR a.kind='mistake_review' THEN RAISE EXCEPTION 'attempt_not_submittable' USING ERRCODE='23514'; END IF;
 IF a.row_version<>p_expected_version THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='40001'; END IF;
 INSERT INTO learning.attempt_answers(attempt_item_id,answer,answered_at)
 SELECT id,'{}',ts FROM learning.attempt_items WHERE attempt_id=a.id ON CONFLICT DO NOTHING;
 UPDATE learning.attempt_answers ans SET is_correct=learning.grade_answer(ans.answer,k.answer_snapshot), checked_at=ts
 FROM learning.attempt_items i JOIN learning.attempt_item_keys k ON k.attempt_item_id=i.id
 WHERE ans.attempt_item_id=i.id AND i.attempt_id=a.id AND ans.checked_at IS NULL;
 SELECT count(*) INTO n FROM learning.attempt_answers ans JOIN learning.attempt_items i ON i.id=ans.attempt_item_id WHERE i.attempt_id=a.id AND ans.is_correct;
 UPDATE learning.attempts SET status='submitted',correct_count=n,passed=(100*n>=passing_percent*total_count),submitted_at=ts WHERE id=a.id;
 IF a.kind='quiz' AND 100*n>=a.passing_percent*a.total_count THEN
  INSERT INTO learning.lesson_progress(user_id,lesson_id,first_opened_at,last_opened_at,completed_at,completion_attempt_id)
  VALUES(p_user,a.lesson_id,ts,ts,ts,a.id)
  ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed_at=EXCLUDED.completed_at,completion_attempt_id=EXCLUDED.completion_attempt_id
  WHERE learning.lesson_progress.completed_at IS NULL;
 END IF;
 FOR r IN SELECT i.* FROM learning.attempt_items i JOIN learning.attempt_answers ans ON ans.attempt_item_id=i.id WHERE i.attempt_id=a.id AND NOT ans.is_correct ORDER BY i.question_id LOOP
  INSERT INTO learning.wrong_questions(user_id,question_id,source_attempt_item_id,generation,status,last_failed_at)
  VALUES(p_user,r.question_id,r.id,1,'pending',ts)
  ON CONFLICT(user_id,question_id) DO UPDATE SET source_attempt_item_id=EXCLUDED.source_attempt_item_id,generation=learning.wrong_questions.generation+1,status='pending',last_failed_at=ts,resolved_at=NULL,suppressed_reason=NULL;
 END LOOP;
 result:=jsonb_build_object('attempt_id',a.id,'status','submitted','correct_count',n,'total_count',a.total_count,'passed',100*n>=a.passing_percent*a.total_count);
 PERFORM learning.finish_request(p_user,'attempt.submit',p_key,result); RETURN result;
END $$;

CREATE FUNCTION learning.check_answer(p_user uuid,p_item uuid,p_answer jsonb,p_key uuid,p_answer_version bigint,p_attempt_version bigint) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE a learning.attempts; i learning.attempt_items; ans learning.attempt_answers; k learning.attempt_item_keys;
 result jsonb; ts timestamptz:=clock_timestamp(); correct boolean; changed integer:=0; count_checked integer; count_correct integer;
BEGIN
 SELECT * INTO i FROM learning.attempt_items WHERE id=p_item;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM learning.attempts WHERE id=i.attempt_id AND user_id=p_user) THEN RAISE EXCEPTION 'item_not_found' USING ERRCODE='42501'; END IF;
 result:=learning.claim_request(p_user,'answer.check',p_key,jsonb_build_object('item',p_item,'answer',p_answer,'answerVersion',p_answer_version,'attemptVersion',p_attempt_version));
 IF result IS NOT NULL THEN RETURN result; END IF;
 SELECT * INTO a FROM learning.attempts WHERE id=i.attempt_id FOR UPDATE;
 IF a.status<>'in_progress' OR a.kind='topic_test' THEN RAISE EXCEPTION 'answer_not_checkable' USING ERRCODE='23514'; END IF;
 IF a.row_version<>p_attempt_version THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='40001'; END IF;
 SELECT * INTO ans FROM learning.attempt_answers WHERE attempt_item_id=p_item FOR UPDATE;
 IF coalesce(ans.row_version,0)<>p_answer_version THEN RAISE EXCEPTION 'version_conflict' USING ERRCODE='40001'; END IF;
 IF ans.checked_at IS NOT NULL THEN RAISE EXCEPTION 'answer_locked' USING ERRCODE='23514'; END IF;
 SELECT * INTO k FROM learning.attempt_item_keys WHERE attempt_item_id=p_item;
 correct:=learning.grade_answer(p_answer,k.answer_snapshot);
 INSERT INTO learning.attempt_answers(attempt_item_id,answer,is_correct,answered_at,checked_at) VALUES(p_item,p_answer,correct,ts,ts)
 ON CONFLICT(attempt_item_id) DO UPDATE SET answer=EXCLUDED.answer,is_correct=EXCLUDED.is_correct,answered_at=ts,checked_at=ts;
 IF a.kind='mistake_review' THEN
  IF correct THEN
   UPDATE learning.wrong_questions SET status='resolved',resolved_at=ts WHERE user_id=p_user AND question_id=i.question_id AND generation=i.mistake_generation AND status='pending';
   GET DIAGNOSTICS changed=ROW_COUNT;
  END IF;
  SELECT count(*) FILTER(WHERE x.checked_at IS NOT NULL),count(*) FILTER(WHERE x.is_correct) INTO count_checked,count_correct FROM learning.attempt_items y JOIN learning.attempt_answers x ON x.attempt_item_id=y.id WHERE y.attempt_id=a.id;
  IF count_checked=a.total_count THEN UPDATE learning.attempts SET status='submitted',submitted_at=ts,correct_count=count_correct WHERE id=a.id; END IF;
 END IF;
 SELECT * INTO a FROM learning.attempts WHERE id=a.id;
 SELECT * INTO ans FROM learning.attempt_answers WHERE attempt_item_id=p_item;
 result:=jsonb_build_object('item_id',p_item,'is_correct',correct,'answer_version',ans.row_version,'attempt_version',a.row_version,'mistake_resolved',changed=1);
 PERFORM learning.finish_request(p_user,'answer.check',p_key,result); RETURN result;
END $$;

CREATE FUNCTION learning.rate_flashcard(p_user uuid,p_item uuid,p_rating text,p_key uuid) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE i learning.flashcard_session_items; s learning.flashcard_sessions; card learning.flashcards; result jsonb; stage_next integer; days integer; ts timestamptz:=clock_timestamp(); next_due timestamptz;
BEGIN
 IF p_rating IS NULL OR p_rating NOT IN ('remember','again') THEN RAISE EXCEPTION 'invalid_rating' USING ERRCODE='23514'; END IF;
 SELECT * INTO i FROM learning.flashcard_session_items WHERE id=p_item AND user_id=p_user;
 IF NOT FOUND THEN RAISE EXCEPTION 'item_not_found' USING ERRCODE='42501'; END IF;
 result:=learning.claim_request(p_user,'flashcard.rate',p_key,jsonb_build_object('item',p_item,'rating',p_rating));
 IF result IS NOT NULL THEN RETURN result; END IF;
 SELECT * INTO s FROM learning.flashcard_sessions WHERE id=i.session_id AND user_id=p_user FOR UPDATE;
 SELECT * INTO i FROM learning.flashcard_session_items WHERE id=p_item FOR UPDATE;
 IF s.status<>'in_progress' OR i.status<>'pending' THEN RAISE EXCEPTION 'item_already_finished' USING ERRCODE='23514'; END IF;
 SELECT * INTO card FROM learning.flashcards WHERE id=i.flashcard_id AND user_id=p_user FOR UPDATE;
 IF card.deleted_at IS NOT NULL OR card.reset_generation<>i.reset_generation THEN
  UPDATE learning.flashcard_session_items SET status='skipped',skip_reason=CASE WHEN card.deleted_at IS NOT NULL THEN 'card_deleted' ELSE 'card_reset' END WHERE id=p_item;
  result:=jsonb_build_object('item_id',p_item,'status','skipped');
 ELSE
  stage_next:=CASE WHEN p_rating='again' THEN 0 ELSE least(card.stage+1,4) END;
  days:=CASE stage_next WHEN 0 THEN 1 WHEN 1 THEN 1 WHEN 2 THEN 3 WHEN 3 THEN 7 ELSE 14 END;
  next_due:=ts+make_interval(hours=>days*24);
  UPDATE learning.flashcards SET stage=stage_next,due_at=next_due,last_reviewed_at=ts WHERE id=card.id;
  UPDATE learning.flashcard_session_items SET status='reviewed',rating=p_rating,reviewed_at=ts,stage_before=card.stage,stage_after=stage_next,due_before=card.due_at,due_after=next_due WHERE id=p_item;
  result:=jsonb_build_object('item_id',p_item,'status','reviewed','stage',stage_next,'due_at',next_due);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM learning.flashcard_session_items WHERE session_id=s.id AND status='pending') THEN UPDATE learning.flashcard_sessions SET status='completed',finished_at=ts WHERE id=s.id; END IF;
 PERFORM learning.finish_request(p_user,'flashcard.rate',p_key,result); RETURN result;
END $$;

-- Use IF branches for dynamic trigger row types, so unavailable fields are not resolved.
CREATE OR REPLACE FUNCTION learning.validate_session() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE sid uuid; s learning.flashcard_sessions; n integer; pending integer;
BEGIN
 IF TG_TABLE_NAME='flashcard_sessions' THEN sid:=NEW.id; ELSE sid:=NEW.session_id; END IF;
 SELECT * INTO s FROM learning.flashcard_sessions WHERE id=sid;
 SELECT count(*),count(*) FILTER(WHERE status='pending') INTO n,pending FROM learning.flashcard_session_items WHERE session_id=sid;
 IF n NOT BETWEEN 1 AND 20 OR (s.status='completed' AND pending<>0) THEN RAISE EXCEPTION 'invalid_flashcard_session' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE FUNCTION learning.check_grade() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE k jsonb;
BEGIN
 IF NEW.checked_at IS NOT NULL THEN
  SELECT answer_snapshot INTO k FROM learning.attempt_item_keys WHERE attempt_item_id=NEW.attempt_item_id;
  NEW.is_correct:=learning.grade_answer(NEW.answer,k);
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER b_grade BEFORE INSERT OR UPDATE ON learning.attempt_answers FOR EACH ROW EXECUTE FUNCTION learning.check_grade();

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA learning FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA learning TO app_learning_runtime;
