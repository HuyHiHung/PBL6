import { createHash } from 'node:crypto';
import { localStatus,database,writeLocal,readLocal } from './local-lib.mjs';
const sql=database(localStatus().DB_URL);
const checkpoint=process.argv[3]??'upgrade';
if(!['upgrade','bootstrap'].includes(checkpoint)) throw new Error('Expected upgrade or bootstrap checkpoint');
try {
  const tables=await sql`SELECT schemaname,tablename FROM pg_tables WHERE schemaname IN ('identity','content','learning') ORDER BY schemaname,tablename`;
  const snapshot={};
  for(const {schemaname,tablename} of tables) {
    const rows=await sql.unsafe(`SELECT to_jsonb(t)::text AS value FROM "${schemaname}"."${tablename}" t ORDER BY to_jsonb(t)::text`);
    snapshot[`${schemaname}.${tablename}`]={rows:rows.length,hash:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};
  }
  snapshot.authUserIds=(await sql`SELECT id FROM auth.users ORDER BY id`).map(r=>r.id);
  if(process.argv[2]==='capture') {
    writeLocal(`${checkpoint}-before.json`,snapshot);console.log(`Captured ${checkpoint}: 33-table data fingerprints and Auth user IDs.`);
  } else if(process.argv[2]==='verify') {
    const before=readLocal(`${checkpoint}-before.json`);
    if(JSON.stringify(before)!==JSON.stringify(snapshot)) throw new Error(`Data changed; inspect .local/${checkpoint}-before.json`);
    console.log(`PASS (${checkpoint}): all 33 tables and Auth user IDs unchanged.`);
  } else throw new Error('Expected capture or verify');
} finally {await sql.end();}
