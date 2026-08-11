/**
 * Shared runtime config loader.
 *
 * Each app declares a base config object and an optional window global
 * override (gitignored, generated at deploy time). This module merges them
 * and validates required keys.
 *
 * Usage:
 *   import { loadConfig } from '../../shared/runtime/config.js';
 *   const config = loadConfig('FAMILY_HUB_CONFIG', {
 *     required: ['firebase.url', 'firebase.apiKey'],
 *     defaults: { theme: 'warm', lang: 'en' }
 *   });
 */

export function loadConfig(baseGlobalName, options = {}) {
  const base = typeof window !== "undefined" && window[baseGlobalName]
    ? window[baseGlobalName]
    : {};

  const localGlobalName = `${baseGlobalName}_LOCAL`;
  const local = typeof window !== "undefined" && window[localGlobalName]
    ? window[localGlobalName]
    : {};

  const merged = deepMerge(base, local);

  if (options.defaults) {
    return deepMerge(options.defaults, merged);
  }

  if (options.required) {
    const missing = options.required.filter(path => {
      const value = getPath(merged, path);
      return value === undefined || value === null || value === "";
    });
    if (missing.length > 0) {
      throw new Error(`Missing required config: ${missing.join(", ")}`);
    }
  }

  return merged;
}

function deepMerge(target, source) {
  const result = { ...target };
  if (!source || typeof source !== "object") return result;
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}
