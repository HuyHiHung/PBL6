import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { localStatus, database } from "./local-lib.mjs";
const status = localStatus(),
  admin = database(status.DB_URL),
  name = "pbl6_verify_" + randomUUID().replaceAll("-", "");
let target;
try {
  await admin.unsafe(`CREATE DATABASE "${name}"`);
  const url = new URL(status.DB_URL);
  url.pathname = "/" + name;
  target = database(url.toString());
  await target`CREATE SCHEMA extensions`;
  // Copy only Supabase's Auth schema, never user data, as the platform baseline.
  const baseline = execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_pbl6",
      "pg_dump",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "--schema=auth",
      "--schema-only",
      "--no-owner",
      "--no-privileges",
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_pbl6",
      "psql",
      "-U",
      "postgres",
      "-d",
      name,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input: baseline,
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  const files = readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files)
    await target.unsafe(readFileSync("supabase/migrations/" + file, "utf8"));
  await target.unsafe(readFileSync("supabase/seed.sql", "utf8"));
  const [r] =
    await target`SELECT count(*)::int AS tables FROM pg_tables WHERE schemaname IN ('identity','content','learning')`;
  if (r.tables !== 40) throw new Error("Expected 40 business tables");
  console.log(
    `PASS: ${files.length} migrations and seed applied to an empty isolated database with real Auth schema baseline; 40 business tables. Existing local database untouched.`,
  );
} finally {
  if (target) await target.end();
  if (!/^pbl6_verify_[a-f0-9]{32}$/.test(name))
    throw new Error("Invalid temporary database name");
  await admin.unsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await admin.end();
}
