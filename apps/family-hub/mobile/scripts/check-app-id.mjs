import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url), 'utf8'));
const id = config.appId;
const invalid = !id || id.includes('placeholder') || id.startsWith('com.example.');
if (invalid) {
  console.error(`Refusing native generation: set a final application ID in capacitor.config.json (current: ${id}).`);
  process.exit(2);
}
if (!/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9_-]*){2,}$/.test(id)) {
  console.error(`Application ID does not look like a reverse-domain identifier: ${id}`);
  process.exit(2);
}
console.log(`Application ID accepted: ${id}`);
