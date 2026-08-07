#!/usr/bin/env node
/**
 * Family Lab — Infisical → GitHub / Cloudflare Pages secret sync.
 *
 * Source of truth: Infisical project 90b0e7ef-3f72-4ddb-b888-055e90e13dfa
 * Targets:
 *   - GitHub repository secrets for arhsmoque/arh-family-lab
 *   - Cloudflare Pages project secrets for project arh-family-lab
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
const INFISICAL_API = "https://app.infisical.com/api/v3/secrets/raw";
const UNIVERSAL_AUTH_URL = "https://app.infisical.com/api/v1/auth/universal-auth/login";
const REPO = "arhsmoque/arh-family-lab";
const CF_PAGES_PROJECT = "arh-family-lab";
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";

const DRY_RUN = process.argv.includes("--dry-run");

function log(...args) {
  console.log("[sync-secrets]", ...args);
}

function fail(...args) {
  console.error("[sync-secrets] ERROR", ...args);
  process.exitCode = 1;
}

async function getInfisicalAccessToken() {
  if (process.env.INFISICAL_TOKEN) {
    return process.env.INFISICAL_TOKEN;
  }
  const clientId = process.env.INFISICAL_CLIENT_ID;
  const clientSecret = process.env.INFISICAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return undefined;
  }
  const res = await fetch(UNIVERSAL_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) {
    throw new Error(`Infisical Universal Auth login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.accessToken;
}

async function fetchInfisicalSecrets(token, folderPath) {
  const params = new URLSearchParams({
    workspaceId: PROJECT_ID,
    environment: "dev",
    secretPath: folderPath,
  });
  const res = await fetch(`${INFISICAL_API}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Infisical API error for ${folderPath}: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return Array.isArray(data.secrets) ? data.secrets : [];
}

function getSecret(secrets, key) {
  const found = secrets.find((s) => s.secretKey === key);
  return found ? found.secretValue : undefined;
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

function setGitHubSecret(key, value) {
  if (DRY_RUN) {
    log("[dry-run] would set GitHub secret", key);
    return;
  }
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

async function main() {
  log(DRY_RUN ? "starting (dry-run)" : "starting");

  // ---------------------------------------------------------------------------
  // 1. Authenticate to Infisical
  // ---------------------------------------------------------------------------
  const token = await getInfisicalAccessToken();
  if (!token) {
    fail(
      "No Infisical credentials. Set one of:\n" +
        "  - INFISICAL_TOKEN (service token or access token)\n" +
        "  - INFISICAL_CLIENT_ID + INFISICAL_CLIENT_SECRET (machine identity)"
    );
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Read Infisical
  // ---------------------------------------------------------------------------
  const rootSecrets = await fetchInfisicalSecrets(token, "/");
  const sharedSecrets = await fetchInfisicalSecrets(token, "/arh-family-lab");
  const familyHubSecrets = await fetchInfisicalSecrets(token, "/arh-family-lab/family-hub");
  const kidsTerminalSecrets = await fetchInfisicalSecrets(token, "/arh-family-lab/kids-terminal");
  const studioSecrets = await fetchInfisicalSecrets(token, "/arh-family-lab/studio");

  const githubPat = getSecret(rootSecrets, "GITHUB_PAT");

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
  // 3. Validate
  // ---------------------------------------------------------------------------
  const missing = [];
  if (!githubPat) missing.push("GITHUB_PAT at /");
  if (!firebaseApiKey) missing.push("FIREBASE_API_KEY");
  if (!firebaseUrl) missing.push("FIREBASE_URL");
  if (!rootFamilyHub) missing.push("FIREBASE_ROOT at /arh-family-lab/family-hub");
  if (!rootKidsTerminal) missing.push("FIREBASE_ROOT at /arh-family-lab/kids-terminal");
  if (!CF_ACCOUNT_ID) missing.push("CLOUDFLARE_ACCOUNT_ID env var");

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
  // 4. GitHub secrets
  // ---------------------------------------------------------------------------
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
  // 5. Cloudflare Pages secrets (no GH_PAT — Pages runtime does not need it)
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

main().catch((err) => {
  console.error("[sync-secrets] FATAL", err.message);
  process.exit(1);
});
