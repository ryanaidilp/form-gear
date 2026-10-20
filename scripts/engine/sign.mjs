// Signs engines.json with the Ed25519 private key in ~/.fasih-engine-signing/ed25519.pem and
// writes engines.json.sig (base64, 64 bytes). First run creates the key pair: the private key
// stays in that folder (mode 600), the public key goes to engine/engine-signing.pub.{pem,b64}
// (commit these two). In CI set ENGINE_SIGNING_KEY (PEM text) instead of the file.
// Usage: node scripts/engine/sign.mjs [outDir]
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const out = resolve(process.argv[2] ?? join(root, 'release-out'));
const dir = join(homedir(), '.fasih-engine-signing');
const keyFile = join(dir, 'ed25519.pem');

let pem = process.env.ENGINE_SIGNING_KEY;
if (!pem && !existsSync(keyFile)) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const { privateKey } = generateKeyPairSync('ed25519');
  writeFileSync(keyFile, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  chmodSync(keyFile, 0o600);
  console.log(`created a new signing key in ${dir} (back it up; losing it means a key rotation)`);
}
pem ??= readFileSync(keyFile, 'utf8');
const priv = createPrivateKey(pem);
const pub = createPublicKey(priv);
const spki = pub.export({ type: 'spki', format: 'der' });
writeFileSync(join(root, 'engine/engine-signing.pub.pem'), pub.export({ type: 'spki', format: 'pem' }));
writeFileSync(join(root, 'engine/engine-signing.pub.b64'), spki.subarray(spki.length - 32).toString('base64') + '\n');

const sig = sign(null, readFileSync(join(out, 'engines.json')), priv);
writeFileSync(join(out, 'engines.json.sig'), sig.toString('base64') + '\n');
console.log(`signed engines.json (${sig.length}-byte signature)`);
