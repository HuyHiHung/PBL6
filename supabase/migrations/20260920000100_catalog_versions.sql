-- Make the row_version returned by a course mutation match its committed value.
-- Child hierarchy changes still bump the course through content.bump_catalog().
DROP TRIGGER catalog_change ON content.courses;
CREATE OR REPLACE FUNCTION content.root_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
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
  IF TG_TABLE_NAME='courses' THEN
   IF ROW(NEW.status,NEW.position) IS DISTINCT FROM ROW(OLD.status,OLD.position) THEN NEW.catalog_version:=OLD.catalog_version+1;
   ELSIF NEW.catalog_version<OLD.catalog_version THEN RAISE EXCEPTION 'catalog_version_cannot_decrease' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 IF NEW.status='published' AND NEW.first_published_at IS NULL THEN NEW.first_published_at:=clock_timestamp(); END IF;
 RETURN NEW;
END $$;
