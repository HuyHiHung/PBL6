import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { outputMaterials, demoDirectory } from './render-technical-materials.mjs';
import { validateToeic, renderToeic } from './toeic-materials-lib.mjs';

export const toeicBands = ['500-700', '700-990'];

export function loadToeicMaterials(band = '500-700', keys = new Set()) {
  if (!toeicBands.includes(band)) throw new Error('Unsupported TOEIC study band');
  const slug = `toeic-${band}`;
  const pack = JSON.parse(readFileSync(path.join(demoDirectory, `${slug}.json`), 'utf8'));
  if (`${pack.band?.min}-${pack.band?.max}` !== band) throw new Error('TOEIC file/band mismatch');
  return { slug, pack, stats: validateToeic(pack, keys) };
}

export function loadToeicCatalog() {
  const keys = new Set();
  return toeicBands.map(band => loadToeicMaterials(band, keys));
}

export function runToeicMaterials({ check = false } = {}) {
  // Validate both packs and cross-pack keys before writing any generated output.
  const results = loadToeicCatalog();
  const outputs = results.flatMap(({ slug, pack }) => [
    { file: path.join(demoDirectory, `${slug}.md`), content: renderToeic(pack) },
    { file: path.join(demoDirectory, `${slug}-review.md`), content: renderToeic(pack, { reviewer: true }) },
  ]);
  // Preserve links shared before the split without maintaining a third content pack.
  for (const suffix of ['', '-review']) outputs.push({
    file: path.join(demoDirectory, `toeic-foundation${suffix}.md`),
    content: `# Học liệu TOEIC đã tách thành hai bộ\n\nBản Foundation trước đây được chuyển thành bộ 500–700, giữ định danh các câu hỏi cũ. Bộ 700–990 có nội dung riêng.\n\n- [TOEIC Listening & Reading — 500–700](toeic-500-700${suffix}.md)\n- [TOEIC Listening & Reading — 700–990](toeic-700-990${suffix}.md)\n- [Lộ trình và trạng thái tài nguyên](toeic-curriculum.md)\n`,
  });
  outputMaterials(outputs, { check });
  console.log(JSON.stringify({ packs: results.map(({slug,stats}) => ({slug,...stats})), mode: check ? 'checked-read-only' : 'markdown-generated', database_accessed: false }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node scripts/render-toeic-materials.mjs [--check]');
    runToeicMaterials({ check: process.argv.includes('--check') });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
