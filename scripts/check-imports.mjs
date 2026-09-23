#!/usr/bin/env node
/**
 * Static import checker (no dependencies). For every .js/.jsx file under the given directory it verifies that
 * relative imports resolve to a real file and that each named import is actually exported by the target.
 * Usage: node ../scripts/check-imports.mjs src
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'src');
const EXTS = ['.js', '.jsx', '.json'];
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(full); }
    else if (/\.(js|jsx)$/.test(e.name)) files.push(full);
  }
})(root);

function resolveTarget(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  const candidates = [base, ...EXTS.map((x) => base + x), ...EXTS.map((x) => path.join(base, 'index' + x))];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}

const exportCache = new Map();
function getExports(file) {
  if (exportCache.has(file)) return exportCache.get(file);
  const src = fs.readFileSync(file, 'utf8');
  const names = new Set();
  let star = false;
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => names.add(s.split(/\s+as\s+/).pop().trim()));
  }
  if (/export\s+default\s/.test(src)) names.add('default');
  if (/export\s+\*\s+from/.test(src)) star = true;
  const info = { names, star };
  exportCache.set(file, info);
  return info;
}

let problems = 0;
const report = (file, msg) => { problems += 1; console.error(`✖ ${path.relative(process.cwd(), file)}: ${msg}`); };

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /(?:import|export)\s+([\s\S]*?)\s*from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g;
  for (const m of src.matchAll(re)) {
    const spec = m[2] || m[3];
    if (!spec || !spec.startsWith('.')) continue;
    const target = resolveTarget(file, spec);
    if (!target) { report(file, `cannot resolve "${spec}"`); continue; }
    if (target.endsWith('.json') || !m[1]) continue;
    const clause = m[1].trim();
    if (/^\*/.test(clause)) continue;
    const { names, star } = getExports(target);
    const def = clause.match(/^([A-Za-z0-9_$]+)\s*(?:,|$)/);
    if (def && !names.has('default')) report(file, `"${spec}" has no default export`);
    const named = clause.match(/\{([\s\S]*)\}/);
    if (named && !star) {
      for (const part of named[1].split(',').map((s) => s.trim()).filter(Boolean)) {
        const original = part.split(/\s+as\s+/)[0].trim();
        if (!names.has(original)) report(file, `"${spec}" does not export "${original}"`);
      }
    }
  }
}

console.log(problems ? `\n${problems} problem(s) found in ${files.length} files.` : `✔ ${files.length} files checked — all relative imports resolve.`);
process.exit(problems ? 1 : 0);
