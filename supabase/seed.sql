-- Local development data only. No Auth users, credentials, DDL, or fake learning history.
INSERT INTO content.courses(id,title,description,objectives,level,position)
VALUES('10000000-0000-4000-8000-000000000001','English Foundations (local demo)',
 'Local database demonstration; not the reviewed release curriculum.','Practice a short introduction.','A1',1)
ON CONFLICT(id) DO NOTHING;
INSERT INTO content.topics(id,course_id,title,objectives,position)
VALUES('10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Greetings','Introduce yourself.',1)
ON CONFLICT(id) DO NOTHING;
INSERT INTO content.vocabulary_entries(id,word,meaning,example)
VALUES('10000000-0000-4000-8000-000000000003','hello','xin chào','Hello, my name is Linh.')
ON CONFLICT(id) DO NOTHING;
