import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { localStatus, database, readLocal, apiRequest } from "./local-lib.mjs";
const status = localStatus(),
  sql = database(status.DB_URL),
  account = readLocal("bootstrap.json").admin;
const uid = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const transcript =
  "Good morning. My name is Anna. I am a student. I study English every day. My classroom is next to the library.";
try {
  if (!account?.id) throw new Error("Run db:bootstrap first");
  const bytes = readFileSync("content/dictation/introductions.mp3"),
    checksum = createHash("sha256").update(bytes).digest("hex"),
    objectKey = `dictation/${checksum}.mp3`;
  const [exists] =
    await sql`SELECT id FROM content.media_assets WHERE bucket='learning-media' AND object_key=${objectKey}`;
  if (!exists) {
    await apiRequest(status, "/storage/v1/object/learning-media/" + objectKey, {
      method: "POST",
      bytes,
      headers: { "Content-Type": "audio/mpeg", "x-upsert": "false" },
    });
    await sql`INSERT INTO content.media_assets(id,bucket,object_key,mime_type,size_bytes,checksum,uploaded_by,source) VALUES(${uid(1)},'learning-media',${objectKey},'audio/mpeg',${bytes.length},${checksum},${account.id},'Original PBL6 script; Windows Zira synthesized speech') ON CONFLICT DO NOTHING`;
  }
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
    const [already] =
      await tx`SELECT id FROM content.dictations WHERE id=${uid(2)}`;
    if (already) return;
    await tx`INSERT INTO content.dictations(id,lesson_id) VALUES(${uid(2)},'10000000-0000-4000-8000-000000000010')`;
    await tx`INSERT INTO content.dictation_revisions(id,dictation_id,revision_no,title,instructions,audio_asset_id,transcript,published_at,created_by) VALUES(${uid(3)},${uid(2)},1,'Introductions — Nghe và chép lại','Nghe lời giới thiệu của Anna, sau đó chép lại bằng tiếng Anh.',${exists?.id ?? uid(1)},${transcript},clock_timestamp(),${account.id})`;
    await tx`UPDATE content.dictations SET status='published',published_revision_id=${uid(3)} WHERE id=${uid(2)}`;
  });
  console.log(
    "Dictation demo ready: one published exercise with original spoken audio.",
  );
} finally {
  await sql.end();
}
