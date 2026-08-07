/**
 * Family Hub bridge to shared runtime.
 *
 * Imports shared config/auth/db and exposes the same window globals the
 * legacy core/auth.js and core/db.js provided, so the existing app.js,
 * store.js, pin-security.js, and audit-log.js keep working.
 */

import { loadConfig } from "../../shared/runtime/config.js";
import { FirebaseAuth } from "../../shared/runtime/auth.js";
import { FirebaseDB } from "../../shared/runtime/db.js";

const CONFIG = loadConfig("FAMILY_HUB_CONFIG", {
  required: ["firebase.url", "firebase.apiKey", "firebase.root"],
});

window.FAMILY_HUB_CONFIG = CONFIG;

const auth = new FirebaseAuth({
  apiKey: CONFIG.firebase.apiKey,
  sessionKey: "familyHub_session_v1",
});

const db = new FirebaseDB({
  baseUrl: CONFIG.firebase.url,
  root: CONFIG.firebase.root,
});

window.FamilyHubAuth = {
  isConfigured: () => !!(CONFIG.firebase.url && CONFIG.firebase.apiKey),
  signUp: (email, password) => auth.signUp(email, password),
  signIn: (email, password) => auth.signIn(email, password),
  signOut: () => auth.signOut(),
  currentSession: () => auth.currentSession(),
  readSession: () => {
    try {
      return JSON.parse(localStorage.getItem("familyHub_session_v1") || "null");
    } catch {
      return null;
    }
  },
};

window.FamilyHubDb = {
  isConfigured: () => !!(CONFIG.firebase.url && CONFIG.firebase.apiKey),
  baseUrl: () => `${CONFIG.firebase.url.replace(/\/$/, "")}/${CONFIG.firebase.root}`,
  get: (path, idToken) => db.get(path, { auth: idToken }),
  set: (path, idToken, value) => db.put(path, value, { auth: idToken }),
  update: (path, idToken, value) => db.patch(path, value, { auth: idToken }),
  remove: (path, idToken) => db.delete(path, { auth: idToken }),
  householdPath: (ownerUid) => `households/${ownerUid}`,
};
