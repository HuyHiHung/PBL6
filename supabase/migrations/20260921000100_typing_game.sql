CREATE TABLE learning.typing_game_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 source jsonb NOT NULL CHECK(jsonb_typeof(source)='object'), source_title_snapshot text NOT NULL,
 config_snapshot jsonb NOT NULL CHECK(jsonb_typeof(config_snapshot)='object'),
 manifest_hash text NOT NULL CHECK(manifest_hash ~ '^[a-f0-9]{64}$'),
 status text NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','abandoned','expired')),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '30 minutes', finished_at timestamptz,
 result jsonb CHECK(jsonb_typeof(result)='object'), score integer GENERATED ALWAYS AS ((result->>'score')::integer) STORED,
 submission_hash text, event_log jsonb CHECK(jsonb_typeof(event_log)='array'), final_tick integer CHECK(final_tick BETWEEN 0 AND 30000),
 creation_xid xid8 NOT NULL DEFAULT pg_current_xact_id(),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0),
 UNIQUE(user_id,id), CHECK(expires_at>created_at),
 CHECK((status='in_progress' AND finished_at IS NULL AND result IS NULL AND submission_hash IS NULL AND event_log IS NULL AND final_tick IS NULL)
 OR (status='completed' AND finished_at IS NOT NULL AND result IS NOT NULL AND submission_hash IS NOT NULL AND event_log IS NOT NULL AND final_tick IS NOT NULL)
 OR (status IN ('abandoned','expired') AND finished_at IS NOT NULL AND result IS NULL AND submission_hash IS NULL AND event_log IS NULL AND final_tick IS NULL))
);
CREATE TABLE learning.typing_game_items (
 id uuid PRIMARY KEY, user_id uuid NOT NULL, session_id uuid NOT NULL,
 position integer NOT NULL CHECK(position BETWEEN 1 AND 30), normalized_answer text NOT NULL,
 item_snapshot jsonb NOT NULL CHECK(jsonb_typeof(item_snapshot)='object'),
 FOREIGN KEY(user_id,session_id) REFERENCES learning.typing_game_sessions(user_id,id) ON DELETE RESTRICT,
 UNIQUE(session_id,position), UNIQUE(session_id,normalized_answer),
 CHECK(item_snapshot->>'id'=id::text AND item_snapshot->>'answer'=normalized_answer AND (item_snapshot->>'position')::integer=position)
);
CREATE UNIQUE INDEX typing_one_active ON learning.typing_game_sessions(user_id) WHERE status='in_progress';
CREATE INDEX typing_history ON learning.typing_game_sessions(user_id,created_at DESC,id);
CREATE INDEX typing_expiry ON learning.typing_game_sessions(user_id,status,expires_at);
CREATE FUNCTION learning.typing_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
 IF TG_TABLE_NAME='typing_game_items' THEN
  IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS(SELECT 1 FROM learning.typing_game_sessions WHERE id=NEW.session_id AND user_id=NEW.user_id AND status='in_progress' AND creation_xid=pg_current_xact_id()) THEN RAISE EXCEPTION 'snapshot_closed' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END IF;
  IF OLD.status<>'in_progress' OR ROW(NEW.id,NEW.user_id,NEW.source,NEW.source_title_snapshot,NEW.config_snapshot,NEW.manifest_hash,NEW.expires_at,NEW.creation_xid,NEW.created_at) IS DISTINCT FROM ROW(OLD.id,OLD.user_id,OLD.source,OLD.source_title_snapshot,OLD.config_snapshot,OLD.manifest_hash,OLD.expires_at,OLD.creation_xid,OLD.created_at) THEN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE FUNCTION learning.typing_snapshot_complete() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE n integer; last_position integer; BEGIN
 SELECT count(*),max(position) INTO n,last_position FROM learning.typing_game_items WHERE session_id=NEW.id;
 IF n NOT BETWEEN 1 AND 30 OR last_position<>n OR (NEW.source->>'kind'<>'retry_missed' AND n<5) THEN RAISE EXCEPTION 'snapshot_incomplete' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER typing_session_guard BEFORE UPDATE OR DELETE ON learning.typing_game_sessions FOR EACH ROW EXECUTE FUNCTION learning.typing_guard();
CREATE TRIGGER typing_items_guard BEFORE INSERT OR UPDATE OR DELETE ON learning.typing_game_items FOR EACH ROW EXECUTE FUNCTION learning.typing_guard();
CREATE CONSTRAINT TRIGGER typing_complete AFTER INSERT ON learning.typing_game_sessions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION learning.typing_snapshot_complete();
CREATE TRIGGER z_touch BEFORE UPDATE ON learning.typing_game_sessions FOR EACH ROW EXECUTE FUNCTION learning.touch_row();
ALTER TABLE learning.typing_game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning.typing_game_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON learning.typing_game_sessions,learning.typing_game_items FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON learning.typing_game_sessions TO app_learning_runtime;
GRANT SELECT,INSERT ON learning.typing_game_items TO app_learning_runtime;
CREATE POLICY service_access ON learning.typing_game_sessions TO app_learning_runtime USING(true) WITH CHECK(true);
CREATE POLICY service_access ON learning.typing_game_items TO app_learning_runtime USING(true) WITH CHECK(true);
REVOKE ALL ON FUNCTION learning.typing_guard(),learning.typing_snapshot_complete() FROM PUBLIC,anon,authenticated;
