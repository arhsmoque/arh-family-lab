/**
 * Minimal plugin host for Family Lab apps.
 *
 * Each app ships a manifest.json that declares which shared runtime plugins
 * it needs. The host loads them (they are ES modules) and calls the app's
 * mount function.
 *
 * App contract:
 *   - index.html loads this script as a module.
 *   - The app folder contains manifest.json with { "name", "plugins", "mount" }.
 *   - The app exports a mount() function from its entry module.
 */

const PLUGIN_PATHS = {
  config: "./config.js",
  auth: "./auth.js",
  db: "./db.js",
  ui: "./ui.js",
};

async function loadPlugins(manifest) {
  const plugins = {};
  for (const name of manifest.plugins || []) {
    if (!PLUGIN_PATHS[name]) {
      throw new Error(`Unknown plugin: ${name}`);
    }
    const module = await import(PLUGIN_PATHS[name]);
    plugins[name] = module;
  }
  return plugins;
}

async function main() {
  // Find the app folder from the current path, e.g. /apps/family-hub/
  const appPath = window.location.pathname.replace(/\/$/, "").split("/").pop();
  const manifestUrl = "./manifest.json";

  let manifest;
  try {
    const r = await fetch(manifestUrl);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    manifest = await r.json();
  } catch (err) {
    console.warn("[plugin-host] No manifest found; running without plugins.", err.message);
    return;
  }

  const plugins = await loadPlugins(manifest);
  const entry = manifest.entry || "./app.js";
  const appModule = await import(entry);

  if (typeof appModule.mount !== "function") {
    throw new Error(`App ${manifest.name} does not export a mount() function`);
  }

  appModule.mount({ manifest, plugins });
}

main().catch(err => {
  console.error("[plugin-host] failed to boot app:", err);
  document.body.innerHTML = `
    <div style="padding:2rem;font-family:sans-serif;text-align:center">
      <h2>Failed to load app</h2>
      <p>${err.message}</p>
      <button onclick="location.reload()">Reload</button>
    </div>
  `;
});
