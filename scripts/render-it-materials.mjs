// Compatibility entry point: validates the catalog and renders only the IT review copy.
import { runTechnicalMaterials } from './render-technical-materials.mjs';
try {
  if(process.argv.slice(2).some(a=>a!=='--check')) throw new Error('Usage: node scripts/render-it-materials.mjs [--check]');
  runTechnicalMaterials({check:process.argv.includes('--check'),onlyIT:true});
} catch(error) { console.error(error.message); process.exitCode=1; }
