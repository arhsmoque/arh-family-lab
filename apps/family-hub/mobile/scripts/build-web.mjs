import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(here, '..');
const sourceRoot = path.resolve(mobileRoot, '..');
const dist = path.join(mobileRoot, 'dist');

const required = [
  'index.html', 'app.css', 'app.js', 'family.config.js',
  'manifest.webmanifest', 'service-worker.js', 'core'
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const item of required) {
  await cp(path.join(sourceRoot, item), path.join(dist, item), { recursive: true });
}

// Mobile builds must never contain a developer-local configuration file.
await rm(path.join(dist, 'family.config.local.js'), { force: true });

const indexPath = path.join(dist, 'index.html');
let html = await readFile(indexPath, 'utf8');
const marker = '<!-- FAMILY_LAB_MOBILE_BOOTSTRAP -->';
const injection = `${marker}
<script type="module" src="./mobile/mobile-bootstrap.mjs"></script>`;
if (!html.includes(marker)) {
  html = html.includes('</body>') ? html.replace('</body>', `${injection}
</body>`) : `${html}
${injection}
`;
}
await writeFile(indexPath, html, 'utf8');

await mkdir(path.join(dist, 'mobile'), { recursive: true });
await build({
  entryPoints: [path.join(mobileRoot, 'src/mobile-bootstrap.mjs')],
  outfile: path.join(dist, 'mobile/mobile-bootstrap.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  sourcemap: true,
  logLevel: 'info'
});

console.log(`Built Family Hub mobile web assets at ${dist}`);
