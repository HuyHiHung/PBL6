-- PBL6: identity. Local and Cloud share this migration history.
CREATE TABLE identity.profiles (
user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
display_name text CHECK(display_name IS NULL OR length(btrim(display_name)) BETWEEN 2 AND 50),
email_cached text NOT NULL CHECK(btrim(email_cached)<>''), role text NOT NULL DEFAULT 'learner' CHECK(role IN ('learner','editor','admin')),
status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','locked','disabled')), lock_reason text, sessions_revoked_before timestamptz,
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE identity.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE identity.editor_permissions (
user_id uuid REFERENCES identity.profiles(user_id) ON DELETE RESTRICT NOT NULL,
permission_code text NOT NULL CHECK(permission_code IN ('content.write','content.publish','learners.manage','reports.view')),
granted_by uuid REFERENCES identity.profiles(user_id) ON DELETE RESTRICT NOT NULL, granted_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,permission_code)
);
ALTER TABLE identity.editor_permissions ENABLE ROW LEVEL SECURITY;
CREATE TABLE identity.revoked_sessions (
session_id uuid PRIMARY KEY, user_id uuid REFERENCES identity.profiles(user_id) ON DELETE RESTRICT NOT NULL, revoked_at timestamptz NOT NULL DEFAULT now(), reason text NOT NULL CHECK(btrim(reason)<>'')
);
ALTER TABLE identity.revoked_sessions ENABLE ROW LEVEL SECURITY;
CREATE TABLE identity.audit_events (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid REFERENCES identity.profiles(user_id) ON DELETE RESTRICT, action text NOT NULL, target_user_id uuid REFERENCES identity.profiles(user_id) ON DELETE RESTRICT, changes jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(changes)='object'),
created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE identity.audit_events ENABLE ROW LEVEL SECURITY;

