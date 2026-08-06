#!/usr/bin/env node
/**
 * Family Lab — Infisical → GitHub / Cloudflare Pages secret sync.
 *
 * Source of truth: Infisical project 90b0e7ef-3f72-4ddb-b888-055e90e13dfa
 * Targets:
 *   - GitHub repository secrets for arhsmoque/arh-family-lab
 *   - Cloudflare Pages secrets for project arh-family-lab
 *
 * Run manually after rotating a secret, or as a workflow_dispatch job.
 * Never logs secret values — only key names and status.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ID = "90b0e7ef-3f72-4ddb-b888-055e90e13dfa";
const REPO = "arhsmoque/arh-family-lab";
const CF_PAGES_PROJECT = "arh-family-lab";
const CF_ACCOUNT_ID = "dc3bfa957bdf216b7cc45214455aaa72";

const DRY_RUN = process.argv.includes("--dry-run");

// In Git Bash, absolute Unix paths are converted to Windows paths unless
// MSYS_NO_PATHCONV=1 is set. Infisical expects literal paths like /arh-family-lab.
const INFISICAL_ENV = { ...process.env, MSYS_NO_PATHCONV: "1" };

function log(...args) {
  console.log("[sync-secrets]", ...args);
}

function fail(...args) {
  console.error("[sync-secrets] ERROR", ...args);
  process.exitCode = 1;
}

function run(cmd, args, env = process.env, input) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    env,
    input,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) {
    throw new Error(`${cmd} failed: ${result.error.message}`);
  }
  return result;
}

function infisicalSecrets(folderPath) {
  const result = run(
    "infisical",
    [
      "secrets",
      `--projectId=${PROJECT_ID}`,
      "--env=dev",
      `--path=${folderPath}`,
      "--output=json",
      "--silent",
    ],
    INFISICAL_ENV
  );

  if (result.status !== 0) {
    // An empty folder can return a non-zero status or "null".
    const stderr = (result.stderr || "").trim();
    if (stderr && !stderr.toLowerCase().includes("no secrets")) {
      throw new Error(`infisical secrets ${folderPath} exited ${result.status}: ${stderr}`);
    }
  }

  const stdout = (result.stdout || "").trim();
  if (!stdout || stdout === "null") return [];
  try {
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    throw new Error(`infisical secrets ${folderPath} returned invalid JSON: ${err.message}`);
  }
}

function getSecret(secrets, key) {
  const found = secrets.find((s) => s.secretKey === key);
  return found ? found.secretValue : undefined;
}

function setGitHubSecret(key, value) {
  if (DRY_RUN) {
    log("[dry-run] would set GitHub secret", key);
    return;
  }
  // `gh secret set KEY --body value` is the simplest cross-platform form.
  const result = run("gh", ["secret", "set", key, "--repo", REPO, "--body", value]);
  if (result.status !== 0) {
    throw new Error(`gh secret set ${key} failed: ${(result.stderr || "").trim()}`);
  }
  log("set GitHub secret", key);
}

function setCloudflareSecrets(pairs) {
  if (pairs.length === 0) return;
  const payload = Object.fromEntries(pairs);
  if (DRY_RUN) {
    log("[dry-run] would set Cloudflare Pages secrets:", pairs.map((p) => p[0]).join(", "));
    return;
  }
  const tmpFile = path.join(os.tmpdir(), `cf-secrets-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, JSON.stringify(payload, null, 2));
  try {
    const result = run(
      "wrangler",
      ["pages", "secret", "bulk", tmpFile, "--project-name", CF_PAGES_PROJECT],
      { ...process.env, CLOUDFLARE_ACCOUNT_ID: CF_ACCOUNT_ID }
    );
    if (result.status !== 0) {
      throw new Error(`wrangler pages secret bulk failed: ${(result.stderr || "").trim()}`);
    }
    log("set Cloudflare Pages secrets:", pairs.map((p) => p[0]).join(", "));
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

function main() {
  log(DRY_RUN ? "starting (dry-run)" : "starting");

  // ---------------------------------------------------------------------------
  // 1. Read Infisical
  // ---------------------------------------------------------------------------
  const rootSecrets = infisicalSecrets("/");
  const sharedSecrets = infisicalSecrets("/arh-family-lab");
  const familyHubSecrets = infisicalSecrets("/arh-family-lab/family-hub");
  const kidsTerminalSecrets = infisicalSecrets("/arh-family-lab/kids-terminal");
  const studioSecrets = infisicalSecrets("/arh-family-lab/studio");

  const githubPat = getSecret(rootSecrets, "GITHUB_PAT");

  // Firebase API key and URL are logically shared across apps (same Firebase
  // project / database). They are stored in each app folder in Infisical, so we
  // read them from family-hub and validate that kids-terminal matches.
  const firebaseApiKey =
    getSecret(sharedSecrets, "FIREBASE_API_KEY") || getSecret(familyHubSecrets, "FIREBASE_API_KEY");
  const firebaseUrl =
    getSecret(sharedSecrets, "FIREBASE_URL") || getSecret(familyHubSecrets, "FIREBASE_URL");

  const apiKeyFamilyHub = getSecret(familyHubSecrets, "FIREBASE_API_KEY");
  const apiKeyKidsTerminal = getSecret(kidsTerminalSecrets, "FIREBASE_API_KEY");
  const urlFamilyHub = getSecret(familyHubSecrets, "FIREBASE_URL");
  const urlKidsTerminal = getSecret(kidsTerminalSecrets, "FIREBASE_URL");

  const rootFamilyHub = getSecret(familyHubSecrets, "FIREBASE_ROOT");
  const rootKidsTerminal = getSecret(kidsTerminalSecrets, "FIREBASE_ROOT");
  const rootStudio = getSecret(studioSecrets, "FIREBASE_ROOT") || "studio";

  // ---------------------------------------------------------------------------
  // 2. Validate
  // ---------------------------------------------------------------------------
  const missing = [];
  if (!githubPat) missing.push("GITHUB_PAT at /");
  if (!firebaseApiKey) missing.push("FIREBASE_API_KEY");
  if (!firebaseUrl) missing.push("FIREBASE_URL");
  if (!rootFamilyHub) missing.push("FIREBASE_ROOT at /arh-family-lab/family-hub");
  if (!rootKidsTerminal) missing.push("FIREBASE_ROOT at /arh-family-lab/kids-terminal");

  if (missing.length > 0) {
    fail("missing source secrets:", missing.join("; "));
    return;
  }

  if (apiKeyFamilyHub !== apiKeyKidsTerminal) {
    fail(
      "FIREBASE_API_KEY differs between family-hub and kids-terminal. " +
        "Use per-app keys or make them identical in Infisical."
    );
    return;
  }
  if (urlFamilyHub !== urlKidsTerminal) {
    fail(
      "FIREBASE_URL differs between family-hub and kids-terminal. " +
        "Use per-app keys or make them identical in Infisical."
    );
    return;
  }

  if (!getSecret(studioSecrets, "FIREBASE_ROOT")) {
    log("WARN: /arh-family-lab/studio has no FIREBASE_ROOT; using fallback 'studio'");
    log("      Add it to Infisical to remove this fallback.");
  }

  // ---------------------------------------------------------------------------
  // 3. GitHub secrets
  // ---------------------------------------------------------------------------
  // GitHub forbids secret names that start with GITHUB_, so the Infisical key
  // GITHUB_PAT is mapped to GH_PAT in the GitHub repository.
  const githubPairs = [
    ["FIREBASE_API_KEY", firebaseApiKey],
    ["FIREBASE_URL", firebaseUrl],
    ["FIREBASE_ROOT_FAMILY_HUB", rootFamilyHub],
    ["FIREBASE_ROOT_KIDS_TERMINAL", rootKidsTerminal],
    ["FIREBASE_ROOT_STUDIO", rootStudio],
    ["GH_PAT", githubPat],
  ];

  for (const [key, value] of githubPairs) {
    try {
      setGitHubSecret(key, value);
    } catch (err) {
      fail(`GitHub ${key}:`, err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Cloudflare Pages secrets (no GH_PAT — Pages runtime does not need it)
  // ---------------------------------------------------------------------------
  const cfPairs = [
    ["FIREBASE_API_KEY", firebaseApiKey],
    ["FIREBASE_URL", firebaseUrl],
    ["FIREBASE_ROOT_FAMILY_HUB", rootFamilyHub],
    ["FIREBASE_ROOT_KIDS_TERMINAL", rootKidsTerminal],
    ["FIREBASE_ROOT_STUDIO", rootStudio],
  ];

  try {
    setCloudflareSecrets(cfPairs);
  } catch (err) {
    fail("Cloudflare:", err.message);
  }

  log(DRY_RUN ? "dry-run complete" : "complete");
}

main();
