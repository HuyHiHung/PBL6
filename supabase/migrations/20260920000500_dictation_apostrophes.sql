-- Keep database publication tokenization consistent with grading policy 1.
CREATE OR REPLACE FUNCTION content.dictation_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
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
   SELECT count(*) INTO n FROM regexp_matches(lower(translate(normalize(NEW.transcript,NFC),'‘’','''''')), '[[:alnum:]]+(''[[:alnum:]]+)*','g');
   IF n NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'invalid_transcript_length' USING ERRCODE='23514'; END IF;
   IF NOT EXISTS(SELECT 1 FROM content.media_assets WHERE id=NEW.audio_asset_id AND status='ready') THEN RAISE EXCEPTION 'audio_not_ready' USING ERRCODE='23514'; END IF;
  END IF;
 END IF; RETURN NEW;
END $$;
