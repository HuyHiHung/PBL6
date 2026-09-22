import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compileToeicImportPlan } from './toeic-import-plan.mjs';
import { assertImportActor, inspectImport, insertDrafts, executeImport } from './materials-import-db.mjs';

export async function main(args=process.argv.slice(2)) {
  const mode=args[0]??'--dry-run';
  assert(['--dry-run','--verify-db','--apply'].includes(mode),'Choose --dry-run, --verify-db or --apply');
  if(mode==='--apply') assert(args.length===3 && args[1]==='--expect-hash','Apply requires --expect-hash SHA256');
  else assert(args.length<=1,'Unexpected arguments');
  assert.equal(path.resolve(process.cwd()),fileURLToPath(new URL('../',import.meta.url)).replace(/[\\/]$/,''),'Run from repository root');
  const plan=compileToeicImportPlan();
  if(mode==='--apply') assert.equal(args[2],plan.plan_sha256,'Import plan hash mismatch');
  const {localStatus,database,readLocal,writeLocal}=await import('./local-lib.mjs');
  writeLocal('toeic-import-plan.json',plan);
  if(mode==='--dry-run') { console.log(JSON.stringify({mode,counts:plan.counts,plan_sha256:plan.plan_sha256,database_accessed:false},null,2)); return; }
  let status;
  try { status=localStatus(); } catch { throw new Error('Cannot access PBL6 Supabase local; check Docker and local services.'); }
  const actor=readLocal('bootstrap.json').admin?.id;
  assert(actor,'Local bootstrap admin is missing');
  const sql=database(status.DB_URL);
  try {
    let outcome;
    if(mode==='--verify-db') {
      const rollback=new Error('EXPECTED_TOEIC_DRAFT_ROLLBACK');
      try {
        await sql.begin(async tx=>{
          await tx`SET LOCAL lock_timeout='10s'`;
          await tx`SET LOCAL statement_timeout='60s'`;
          await tx`SELECT pg_advisory_xact_lock(19092026,1)`;
          await assertImportActor(tx,actor);
          const state=await inspectImport(tx,plan);
          await insertDrafts(tx,plan,actor,state);
          await tx`SET CONSTRAINTS ALL IMMEDIATE`;
          assert((await inspectImport(tx,plan)).every(s=>s.action==='skip-identical'));
          outcome={mode:'draft-verified-and-rolled-back',state};
          throw rollback;
        });
      } catch(error) { if(error!==rollback) throw error; }
    } else outcome=await executeImport(sql,plan,actor);
    const result={...outcome,counts:plan.counts,plan_sha256:plan.plan_sha256,checked_at:new Date().toISOString()};
    if(mode==='--apply') writeLocal('toeic-import-result.json',result);
    console.log(JSON.stringify(result,null,2));
  } finally { await sql.end(); }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{ console.error(error.code?`${error.code}: ${error.message}`:error.message); process.exitCode=1; });
