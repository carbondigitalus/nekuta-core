// Guards against an unnoticed bundle-size regression. Unlike Pinia's own size-check (a separate
// package building a single minified Rollup bundle), this repo has no bundler anywhere — `tsc`
// emits one .js file per source module (no barrel-bundling), so `dist/index.js` alone is just a
// few re-export lines and means nothing on its own. This instead concatenates every emitted .js
// file and gzips the result once, as a stand-in for "roughly what a consumer's own bundler would
// need to include" — looser and less precise than Pinia's minified-bundle number, but honest about
// what this build can actually measure. See the plan's "Build tooling & size check" section.
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const packageRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const packageJson = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf-8'));
const distDir = path.join(packageRoot, 'dist');

const budgetBytes = packageJson.sizeLimit?.gzipBytes;
if (!budgetBytes) {
    console.error('check-size: no "sizeLimit.gzipBytes" field found in package.json — nothing to check against.');
    process.exit(1);
}

function collectJsFiles(dir) {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return [];
    }

    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return collectJsFiles(fullPath);
        }
        return entry.name.endsWith('.js') ? [fullPath] : [];
    });
}

const files = collectJsFiles(distDir).sort();

if (files.length === 0) {
    console.error(`check-size: no .js files found under ${distDir} — run "npm run build" first.`);
    process.exit(1);
}

const combined = Buffer.concat(files.map((file) => readFileSync(file)));
const rawSize = files.reduce((total, file) => total + statSync(file).size, 0);
const gzipSize = gzipSync(combined).byteLength;

console.log(
    `check-size: ${files.length} file(s), ${rawSize} raw bytes, ${gzipSize} bytes gzipped (unminified ESM output; budget: ${budgetBytes} bytes).`
);

if (gzipSize > budgetBytes) {
    console.error(`check-size: exceeds the ${budgetBytes}-byte budget by ${gzipSize - budgetBytes} bytes.`);
    process.exit(1);
}
