import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
for (const rel of [
  'package.json',
  'capacitor.config.json',
  'src/mobile-bootstrap.mjs',
  'dist/index.html',
  'dist/mobile/mobile-bootstrap.mjs'
]) {
  try {
    await access(path.join(root, rel));
  } catch {
    failures.push(`missing ${rel}`);
  }
}

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const cap = JSON.parse(await readFile(path.join(root, 'capacitor.config.json'), 'utf8'));
if (pkg.dependencies['@capacitor/core'] !== pkg.devDependencies['@capacitor/cli']) {
  failures.push('Capacitor core and CLI versions differ');
}
if (pkg.devDependencies['@capacitor/android'] !== pkg.devDependencies['@capacitor/ios']) {
  failures.push('Android and iOS Capacitor versions differ');
}
if (!pkg.devDependencies.esbuild) {
  failures.push('esbuild must be pinned for the mobile web bundle');
}
if (cap.webDir !== 'dist') {
  failures.push('webDir must be dist');
}

try {
  const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
  if (!html.includes('FAMILY_LAB_MOBILE_BOOTSTRAP')) {
    failures.push('mobile bootstrap marker missing from dist/index.html');
  }
  const bundle = await readFile(path.join(root, 'dist/mobile/mobile-bootstrap.mjs'), 'utf8');
  if (/from ["']@capacitor\//.test(bundle)) {
    failures.push('mobile bundle still contains unresolved Capacitor package imports');
  }
} catch {
  // Missing files are already reported above.
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Mobile scaffold validation passed.');
