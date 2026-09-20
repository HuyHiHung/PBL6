import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateCatalog, validatePack, renderPack, renderCatalog } from './materials-lib.mjs';

export const demoDirectory = fileURLToPath(new URL('../content/demo/', import.meta.url));
export function loadTechnicalMaterials(directory = demoDirectory) {
  const catalog = JSON.parse(readFileSync(path.join(directory,'technical-catalog.json'),'utf8'));
  validateCatalog(catalog);
  const keys = new Set();
  const results = catalog.courses.map(profile => {
    const pack = JSON.parse(readFileSync(path.join(directory,`${profile.slug}.json`),'utf8'));
    return {profile,pack,stats:validatePack(pack,profile,keys)};
  });
  return {catalog,results};
}
export function outputMaterials(outputs, {check=false} = {}) {
  const mismatches = [];
  for (const {file,content} of outputs) {
    let current;
    try { current=readFileSync(file,'utf8'); } catch (error) { if(error.code!=='ENOENT') throw error; }
    if(current!==content) mismatches.push({file,content});
  }
  if(check && mismatches.length) throw new Error(`Markdown is missing or stale: ${mismatches.map(m=>path.basename(m.file)).join(', ')}. Run node scripts/render-technical-materials.mjs`);
  if(!check) for(const {file,content} of mismatches) writeFileSync(file,content);
}
export function runTechnicalMaterials({check=false, onlyIT=false} = {}) {
  const {catalog,results} = loadTechnicalMaterials();
  const selected = onlyIT ? results.filter(r=>r.profile.slug==='english-it') : results;
  const outputs = selected.map(r=>({file:path.join(demoDirectory,`${r.profile.slug}.md`),content:renderPack(r.pack,r.stats)}));
  if(!onlyIT) outputs.push({file:path.join(demoDirectory,'technical-demo.md'),content:renderCatalog(catalog,results)});
  outputMaterials(outputs,{check});
  for(const {profile:p,stats:s} of selected) console.log(`${p.slug}: ${s.topics} topics, ${s.lessons} lessons, ${s.vocabulary_entries} entries, ${s.questions} questions, ${s.minutes} min`);
  console.log(check ? 'Validation and Markdown consistency checks passed (read-only).' : 'Validation passed; Markdown generated. No CMS/database changes.');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    if(process.argv.slice(2).some(a=>a!=='--check')) throw new Error('Usage: node scripts/render-technical-materials.mjs [--check]');
    runTechnicalMaterials({check:process.argv.includes('--check')});
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
