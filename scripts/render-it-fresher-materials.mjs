import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack, renderPack } from './materials-lib.mjs';
import { loadTechnicalMaterials, outputMaterials, demoDirectory } from './render-technical-materials.mjs';

export function loadFresherMaterials() {
  const { results } = loadTechnicalMaterials();
  const keys = new Set();
  for (const { pack, profile } of results) validatePack(pack, profile, keys);
  const pack = JSON.parse(readFileSync(path.join(demoDirectory, 'english-it-fresher.json'), 'utf8'));
  const profile = JSON.parse(readFileSync(path.join(demoDirectory, 'english-it-fresher.profile.json'), 'utf8'));
  // Reuse the CMS source schema and check keys against the already imported packs.
  const stats = validatePack(pack, profile, keys);
  return { pack, profile, stats };
}

export function runFresherMaterials({ check = false } = {}) {
  const { pack, stats } = loadFresherMaterials();
  outputMaterials([{ file: path.join(demoDirectory, 'english-it-fresher.md'), content: renderPack(pack, stats) }], { check });
  console.log(JSON.stringify({ slug: 'english-it-fresher', ...stats, mode: check ? 'checked-read-only' : 'markdown-generated', database_accessed: false }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node scripts/render-it-fresher-materials.mjs [--check]');
    runFresherMaterials({ check: process.argv.includes('--check') });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
