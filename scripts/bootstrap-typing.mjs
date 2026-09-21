import { localStatus, database, readLocal } from "./local-lib.mjs";
import { createTypingLesson } from "./typing-fixture.mjs";
const status = localStatus(),
  sql = database(status.DB_URL),
  account = readLocal("bootstrap.json").admin;
if (!account?.id) throw new Error("Run db:bootstrap first.");
try {
  await createTypingLesson(
    sql,
    account.id,
    "30000000-0000-4000-8000-000000000010",
  );
  console.log(
    "Typing demo ready: 30 original words, 3 waves, phrases/apostrophes/hyphens; existing data preserved.",
  );
} finally {
  await sql.end();
}
