-- PBL6: schemas. Local and Cloud share this migration history.

CREATE SCHEMA identity;
REVOKE ALL ON SCHEMA identity FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='app_identity_runtime') THEN
  CREATE ROLE app_identity_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA identity REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA identity REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
CREATE FUNCTION identity.touch_row() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN NEW.created_at:=OLD.created_at; NEW.updated_at:=clock_timestamp(); NEW.row_version:=OLD.row_version+1; RETURN NEW; END $$;
CREATE FUNCTION identity.deny_change() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END $$;


CREATE SCHEMA content;
REVOKE ALL ON SCHEMA content FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='app_content_runtime') THEN
  CREATE ROLE app_content_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA content REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA content REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
CREATE FUNCTION content.touch_row() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN NEW.created_at:=OLD.created_at; NEW.updated_at:=clock_timestamp(); NEW.row_version:=OLD.row_version+1; RETURN NEW; END $$;
CREATE FUNCTION content.deny_change() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END $$;


CREATE SCHEMA learning;
REVOKE ALL ON SCHEMA learning FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='app_learning_runtime') THEN
  CREATE ROLE app_learning_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA learning REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA learning REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
CREATE FUNCTION learning.touch_row() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN NEW.created_at:=OLD.created_at; NEW.updated_at:=clock_timestamp(); NEW.row_version:=OLD.row_version+1; RETURN NEW; END $$;
CREATE FUNCTION learning.deny_change() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'immutable_history' USING ERRCODE='23514'; END $$;

