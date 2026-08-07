/**
 * Kids Terminal bridge to the shared runtime.
 *
 * The legacy firebase-rest.js exposed window.Auth, window.Db and window.emailToKey.
 * This bridge re-implements the same surface using shared/runtime/auth.js and
 * db.js so the rest of the app keeps working unchanged.
 *
 * Unlike Family Hub and Studio, Kids Terminal receives its Firebase credentials
 * from the server at runtime via `/api/config` (stored in `State.config`).  The
 * bridge therefore instantiates auth/db lazily, at first call.
 */

import { FirebaseAuth } from "../../shared/runtime/auth.js";
import { FirebaseDB } from "../../shared/runtime/db.js";

const SESSION_KEY = "agy-terminal-session-v1";
const FALLBACK_DB_URL = "https://arh-firebase-db-default-rtdb.asia-southeast1.firebasedatabase.app";
const FALLBACK_DB_ROOT = "kids-terminal";

function currentState() {
  // `State` is created by the classic app.js script.  It is a global lexical
  // binding, not a `window` property, so we access it by identifier rather
  // than through `window.State`.
  if (typeof State !== "undefined") return State;
  return null;
}

function currentConfig() {
  return currentState()?.config || {};
}

function apiKey() {
  const cfg = currentConfig();
  return cfg.auth?.apiKey || "";
}

function configuredAuth() {
  const key = apiKey();
  if (!key || key.startsWith("REPLACE_")) {
    throw new Error("Firebase Web API Key is not configured yet. Please configure it in Settings.");
  }
  return new FirebaseAuth({ apiKey: key, sessionKey: SESSION_KEY });
}

function configuredDb() {
  const cfg = currentConfig();
  const url = cfg.firebase?.url || FALLBACK_DB_URL;
  const root = cfg.firebase?.root || FALLBACK_DB_ROOT;
  return new FirebaseDB({ baseUrl: url, root });
}

window.Auth = {
  async signUp(email, password) {
    // Preserve the server-side registration notification hook.
    try {
      await fetch(`/api/notify-registration?email=${encodeURIComponent(email)}`);
    } catch (e) {
      console.warn("Failed to notify registration attempt:", e.message);
    }
    return configuredAuth().signUp(email, password);
  },

  signIn(email, password) {
    return configuredAuth().signIn(email, password);
  },

  signOut() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },

  currentSession() {
    return configuredAuth().currentSession();
  },
};

window.Db = {
  get: (path, idToken) => configuredDb().get(path, { auth: idToken }),
  set: (path, idToken, value) => configuredDb().put(path, value, { auth: idToken }),
  update: (path, idToken, value) => configuredDb().patch(path, value, { auth: idToken }),
  remove: (path, idToken) => configuredDb().delete(path, { auth: idToken }),
  push: (path, idToken, value) => configuredDb().push(path, value, { auth: idToken }),
};

window.emailToKey = (email) => email.trim().toLowerCase().replace(/\./g, ",");
