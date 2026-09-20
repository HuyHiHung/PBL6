-- Prevent an old version from matching a deleted and recreated note (ABA).
CREATE SEQUENCE learning.note_versions;
SELECT setval('learning.note_versions',greatest(coalesce((SELECT max(row_version) FROM learning.lesson_notes),0)+1,1),false);
ALTER TABLE learning.lesson_notes ALTER COLUMN row_version SET DEFAULT nextval('learning.note_versions');
GRANT USAGE ON SEQUENCE learning.note_versions TO app_learning_runtime;
CREATE FUNCTION learning.touch_note() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF ROW(NEW.id,NEW.user_id,NEW.lesson_id) IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.lesson_id) THEN RAISE EXCEPTION 'note_owner_immutable' USING ERRCODE='23514'; END IF;
 NEW.created_at:=OLD.created_at;NEW.updated_at:=clock_timestamp();NEW.row_version:=nextval('learning.note_versions');RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION learning.touch_note() FROM PUBLIC,anon,authenticated;
DROP TRIGGER z_touch ON learning.lesson_notes;
CREATE TRIGGER z_touch BEFORE UPDATE ON learning.lesson_notes FOR EACH ROW EXECUTE FUNCTION learning.touch_note();
