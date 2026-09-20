-- Runtime normalization needs only this extension function, not business-schema access.
GRANT USAGE ON SCHEMA extensions TO app_content_runtime;
GRANT EXECUTE ON FUNCTION extensions.unaccent(text) TO app_content_runtime;
