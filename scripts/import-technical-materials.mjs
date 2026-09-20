import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadTechnicalMaterials, demoDirectory } from './render-technical-materials.mjs';
import { compileImportPlan, digest } from './materials-import-plan.mjs';
import { executeImport } from './materials-import-db.mjs';

export function verifyAudit(results,report) {
  assert.equal(report.status,'ready_for_draft_import','Content audit is not ready for draft import');
  for(const {profile,pack} of results) assert.equal(report.sources?.[profile.slug]?.sha256,digest(pack),`AUDIT_STALE: ${profile.slug}; review changed content and update the audit snapshot first`);
}

export async function main(args=process.argv.slice(2)) {
  let mode='--dry-run', modeChosen=false, expected;
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if(['--dry-run','--verify-db','--apply'].includes(arg)) {
      assert(!modeChosen,'Choose exactly one mode'); mode=arg; modeChosen=true;
    } else if(arg==='--expect-hash') {
      assert(!expected && /^[a-f0-9]{64}$/.test(args[i+1]??''),'Expected a SHA-256 after --expect-hash'); expected=args[++i];
    } else throw new Error('Usage: node scripts/import-technical-materials.mjs [--dry-run | --verify-db | --apply --expect-hash SHA256]');
  }
  assert(mode==='--apply' || !expected,'--expect-hash is only used with --apply');
  const {results}=loadTechnicalMaterials();
  const audit=JSON.parse(readFileSync(path.join(demoDirectory,'technical-audit.json'),'utf8'));
  verifyAudit(results,audit);
  const plan=compileImportPlan(results);
  assert.equal(plan.plan_sha256,audit.plan_sha256,'IMPORT_PLAN_CHANGED: review the mapping and refresh the audit before import');
  if(mode==='--apply') assert.equal(expected,plan.plan_sha256,'--apply requires --expect-hash matching the reviewed dry-run plan');
  const root=fileURLToPath(new URL('../',import.meta.url));
  // Local helpers intentionally use repo-relative paths. Never discover a different stack.
  assert.equal(path.resolve(process.cwd()),path.resolve(root),'Run this command from the PBL6 repository root');
  if(mode==='--dry-run') {
    mkdirSync(path.join(root,'.local'),{recursive:true});
    writeFileSync(path.join(root,'.local','technical-import-plan.json'),JSON.stringify(plan,null,2)+'\n');
    console.log(JSON.stringify({mode:'offline-dry-run',plan_sha256:plan.plan_sha256,counts:plan.counts,receipt_count:plan.packages.length,artifact:'.local/technical-import-plan.json',database_accessed:false},null,2));
    return;
  }
  const {localStatus,database,readLocal}=await import('./local-lib.mjs');
  let status;
  try { status=localStatus(); } catch { throw new Error('Cannot access PBL6 Supabase local. Check npm run db:status and Docker permissions.'); }
  const actor=readLocal('bootstrap.json').admin?.id;
  assert(actor,'Local bootstrap admin is missing; run db:bootstrap first');
  const sql=database(status.DB_URL);
  try {
    const outcome=await executeImport(sql,plan,actor,{verifyOnly:mode==='--verify-db'});
    console.log(JSON.stringify({...outcome,plan_sha256:plan.plan_sha256},null,2));
  } finally { await sql.end(); }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(error=>{
    // PostgreSQL error.detail may contain a complete row; log only the message/code.
    console.error(error.code ? `${error.code}: ${error.message}` : error.message);
    process.exitCode=1;
  });
}
