-- PBL6: content_catalog. Local and Cloud share this migration history.
CREATE TABLE content.courses (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL CHECK(btrim(title)<>''), description text NOT NULL DEFAULT '', objectives text NOT NULL DEFAULT '', level text NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')), first_published_at timestamptz, position integer NOT NULL CHECK(position>0), catalog_version bigint NOT NULL DEFAULT 1 CHECK(catalog_version>0),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.courses ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.topics (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid REFERENCES content.courses(id) ON DELETE RESTRICT NOT NULL, title text NOT NULL CHECK(btrim(title)<>''), description text NOT NULL DEFAULT '', objectives text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')), first_published_at timestamptz, position integer NOT NULL CHECK(position>0),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.topics ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.lessons (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), topic_id uuid REFERENCES content.topics(id) ON DELETE RESTRICT NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')), first_published_at timestamptz, position integer NOT NULL CHECK(position>0), is_preview boolean NOT NULL DEFAULT false, published_revision_id uuid, CHECK(status<>'published' OR published_revision_id IS NOT NULL),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.lessons ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.media_assets (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket text NOT NULL, object_key text NOT NULL, mime_type text NOT NULL CHECK(mime_type IN ('audio/mpeg','audio/mp4','audio/x-m4a')), size_bytes bigint NOT NULL CHECK(size_bytes BETWEEN 1 AND 10485760), checksum text NOT NULL CHECK(checksum ~ '^[a-f0-9]{64}$'), source text, status text NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','unavailable')), uploaded_by uuid NOT NULL, UNIQUE(bucket,object_key),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.media_assets ENABLE ROW LEVEL SECURITY;
CREATE TABLE content.vocabulary_entries (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), word text NOT NULL CHECK(btrim(word)<>''), meaning text NOT NULL CHECK(btrim(meaning)<>''), example text NOT NULL DEFAULT '', phonetic text, audio_asset_id uuid REFERENCES content.media_assets(id) ON DELETE RESTRICT, source text, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','hidden')),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), row_version bigint NOT NULL DEFAULT 1 CHECK(row_version>0)
);
ALTER TABLE content.vocabulary_entries ENABLE ROW LEVEL SECURITY;

