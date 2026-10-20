# Releasing the engine (Fasih engine channel)

A release of this repo is a GitHub Release that carries an engine package for the Fasih app.
The design is in the Fasih repo: `docs/design/engine-channel.md` and `docs/adr/0003-engine-channel-for-the-rewrite.md`.

## What a release contains

| Asset | What it is |
|---|---|
| `fg2-<version>.zip` | The engine: `index.html` (host shell, from `engine/index.html`), `form-gear.umd.js`, `style.css`, `version.json` |
| `engines.json` | The feed manifest: version, URL, size and SHA-256 of the zip, SHA-256 of each file, `supports`, `minApp`, `minSdk` |
| `engines.json.sig` | Detached Ed25519 signature of `engines.json` (base64) |
| `SHA256SUMS` | SHA-256 of `engines.json` and the zip, for a quick manual check |

The app trusts the public key in `engine/engine-signing.pub.b64` (raw 32 bytes) or `engine/engine-signing.pub.pem`.
The private key lives only in `~/.fasih-engine-signing/ed25519.pem` (mode 600). Never commit it. Back it up:
if it is lost, the app needs a key rotation.

## Steps

1. Change `version` in `package.json` and add an entry to `CHANGELOG.md`.
2. Make sure that `npm run type-check`, `npm run test:run` and `npm run build` pass.
3. Package, sign and verify:

   ```bash
   npm run engine:package   # writes release-out/
   npm run engine:sign
   npm run engine:verify
   ```

4. Commit the version change and tag it: `git tag v<version> && git push origin main v<version>`.
5. Publish:

   ```bash
   gh release create v<version> release-out/* --title "v<version>" --notes-file <notes>
   ```

6. Download the assets back into a new folder and run `node scripts/engine/verify.mjs <folder>`.

## CI

`.github/workflows/engine-release.yml` runs on a `v*` tag: type check, tests, build, package. It keeps the unsigned
package as a workflow artifact. If you add the repository secret `ENGINE_SIGNING_KEY` (the PEM text of the private
key), it also signs the package and uploads the assets to the GitHub Release of the tag. Without the secret, sign and
publish locally as above.

## Rules

- Do not reuse a tag. Do not edit the assets of a published version: publish a new version instead.
- To withdraw a bad version, add it to `revoked` in the next `engines.json` and release again.
- `supports.partial` is `true` until the engine build also writes `componentKeys`, `expressionHelpers` and
  `templateKeys`. The app must not read the missing lists as "nothing supported".
