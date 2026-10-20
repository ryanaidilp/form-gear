// Verifies a downloaded release: signature of engines.json against the committed public key,
// then the zip's size and SHA-256 and every file inside it against the manifest.
// Usage: node scripts/engine/verify.mjs <dir with engines.json, engines.json.sig, fg2-*.zip>
import { createHash, createPublicKey, verify } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const dir = resolve(process.argv[2] ?? join(root, 'release-out'));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const fail = (m) => { console.error('FAIL:', m); process.exit(1); };

const manifestBytes = readFileSync(join(dir, 'engines.json'));
const pub = createPublicKey(readFileSync(join(root, 'engine/engine-signing.pub.pem')));
const sig = Buffer.from(readFileSync(join(dir, 'engines.json.sig'), 'utf8').trim(), 'base64');
if (!verify(null, manifestBytes, pub, sig)) fail('manifest signature does not match the public key');

for (const e of JSON.parse(manifestBytes).engines) {
  const zip = readFileSync(join(dir, e.url.split('/').pop()));
  if (zip.length !== e.size) fail(`${e.key} size ${zip.length} != ${e.size}`);
  if (sha(zip) !== e.sha256) fail(`${e.key} zip sha256 mismatch`);
  const tmp = mkdtempSync(join(tmpdir(), 'fg2-verify-'));
  execFileSync('unzip', ['-q', join(dir, e.url.split('/').pop()), '-d', tmp]);
  for (const [name, h] of Object.entries(e.files)) {
    if (sha(readFileSync(join(tmp, name))) !== h) fail(`${e.key} file ${name} sha256 mismatch`);
  }
  rmSync(tmp, { recursive: true });
  console.log(`OK ${e.key} ${e.version}: signature, zip and ${Object.keys(e.files).length} files verified`);
}
