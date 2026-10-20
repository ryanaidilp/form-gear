// Packages the built dist/ as an engine-channel release: fg2-<version>.zip,
// engines.json (unsigned feed manifest, see Fasih docs/design/engine-channel.md
// section 6) and SHA256SUMS. Signing is a separate step (sign.mjs).
// Usage: node scripts/engine/package.mjs [outDir]   (run `npm run build` first)
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const out = resolve(process.argv[2] ?? join(root, 'release-out'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const repo = process.env.GITHUB_REPOSITORY ?? 'ryanaidilp/form-gear';
const version = pkg.version;
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const git = (...a) => execFileSync('git', a, { cwd: root }).toString().trim();

const stage = join(out, 'stage');
rmSync(out, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

copyFileSync(join(root, 'engine/index.html'), join(stage, 'index.html'));
copyFileSync(join(root, 'dist/form-gear.umd.js'), join(stage, 'form-gear.umd.js'));
copyFileSync(join(root, 'dist/form-gear.css'), join(stage, 'style.css'));
// Fixed build time when SOURCE_DATE_EPOCH is set, so a rebuild can be compared.
const now = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000) : new Date();
const build = now.toISOString().replace(/\D/g, '').slice(0, 14);
writeFileSync(
  join(stage, 'version.json'),
  JSON.stringify({ key: 'fg2', version, build, commit: git('rev-parse', 'HEAD') }) + '\n',
);

const names = ['index.html', 'form-gear.umd.js', 'style.css', 'version.json'];
const files = Object.fromEntries(names.map((n) => [n, sha(readFileSync(join(stage, n)))]));

const zipName = `fg2-${version}.zip`;
// -X: no extra file attributes, -D: no directory entries, fixed order.
execFileSync('zip', ['-X', '-D', '-q', join(out, zipName), ...names], { cwd: stage });
const zip = readFileSync(join(out, zipName));

// Supports: control types come from the ComponentType enum, bridge actions from the shell.
// ponytail: componentKeys, expressionHelpers and templateKeys are not derived yet; `partial`
// tells the app's template scan not to treat the missing lists as "nothing supported".
const enumSrc = readFileSync(join(root, 'src/core/constants.ts'), 'utf8');
const enumBody = enumSrc.slice(enumSrc.indexOf('export enum ComponentType'));
const controlTypes = [
  ...new Set([...enumBody.slice(0, enumBody.indexOf('}')).matchAll(/=\s*(\d+)/g)].map((m) => Number(m[1]))),
].sort((a, b) => a - b);
const shell = readFileSync(join(stage, 'index.html'), 'utf8');
const bridgeActions = [...new Set([...shell.matchAll(/callHandler\(\s*'action'\s*,\s*'([A-Z_]+)'/g)].map((m) => m[1]))].sort();

const manifest = {
  schema: 1,
  issuedAt: now.toISOString().replace(/\.\d+Z$/, 'Z'),
  engines: [
    {
      key: 'fg2',
      name: 'Form Gear 2',
      version,
      minApp: '2.19.0',
      minSdk: '0.18.0',
      url: `https://github.com/${repo}/releases/download/v${version}/${zipName}`,
      sha256: sha(zip),
      size: zip.length,
      files,
      changelog: `https://github.com/${repo}/blob/v${version}/CHANGELOG.md`,
      supports: { partial: true, controlTypes, bridgeActions },
      rollout: { channel: 'stable' },
    },
  ],
  revoked: [],
};
writeFileSync(join(out, 'engines.json'), JSON.stringify(manifest, null, 2) + '\n');
rmSync(stage, { recursive: true });

const sums = ['engines.json', zipName].map((n) => `${sha(readFileSync(join(out, n)))}  ${n}`);
writeFileSync(join(out, 'SHA256SUMS'), sums.join('\n') + '\n');
console.log(`packaged ${zipName} (${statSync(join(out, zipName)).size} bytes) in ${out}`);
