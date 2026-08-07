#!/usr/bin/env node
/**
 * Prepare the static deploy bundle under dist/.
 *
 * Usage:
 *   node scripts/prepare-deploy-bundle.mjs
 *
 * This centralises the copy logic that was duplicated across
 * .github/workflows/pages.yml and .github/workflows/deploy-cloudflare-pages.yml.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

const filesToCopy = [
  "index.html",
  "clinical.html",
  "AGENTS.md",
  "README.md",
  "SECRETS.md",
];
const dirsToCopy = ["shared", "apps", "previews", "clinical"];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and recreate dist
rmrf(dist);
fs.mkdirSync(dist, { recursive: true });

for (const file of filesToCopy) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist, file));
  }
}

for (const dir of dirsToCopy) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(dist, dir));
  }
}

// Remove large clinical download bundles from the deploy artifact.
function removeClinicalDownloads(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "downloads") {
        rmrf(p);
      } else {
        removeClinicalDownloads(p);
      }
    }
  }
}
removeClinicalDownloads(path.join(dist, "clinical"));

// Tell GitHub Pages not to run Jekyll.
fs.writeFileSync(path.join(dist, ".nojekyll"), "");

console.log("[prepare-deploy-bundle] dist/ ready");
