/**
 * Studio bridge to shared runtime.
 *
 * This module imports the shared Firebase auth/db plugins and exposes the
 * same global API surface that the legacy firebase-rest.js provided, so the
 * existing studio app.js keeps working while the underlying implementation
 * is unified with Family Hub.
 */

import { loadConfig } from "../../shared/runtime/config.js";
import { FirebaseAuth } from "../../shared/runtime/auth.js";
import { FirebaseDB } from "../../shared/runtime/db.js";

const APP_CONFIG = loadConfig("STUDIO_APP_CONFIG", {
  required: ["auth.apiKey", "firebase.url", "firebase.root"],
});

const auth = new FirebaseAuth({
  apiKey: APP_CONFIG.auth.apiKey,
  sessionKey: "arh-studio-session-v1",
});

const db = new FirebaseDB({
  baseUrl: APP_CONFIG.firebase.url,
  root: APP_CONFIG.firebase.root,
});

window.APP_CONFIG = APP_CONFIG;

window.Auth = {
  signUp: (email, password) => auth.signUp(email, password),
  signIn: (email, password) => auth.signIn(email, password),
  signOut: () => auth.signOut(),
  currentSession: () => auth.currentSession(),
  sendPasswordReset: (email) => {
    // Shared runtime does not yet expose password reset; fall back to fetch.
    return fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${APP_CONFIG.auth.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
      }
    ).then(r => {
      if (!r.ok) throw new Error("Password reset failed");
    });
  },
};

window.Db = {
  get: (path, idToken) => db.get(path, { auth: idToken }),
  set: (path, idToken, value) => db.put(path, value, { auth: idToken }),
  update: (path, idToken, value) => db.patch(path, value, { auth: idToken }),
  remove: (path, idToken) => db.delete(path, { auth: idToken }),
  push: async (path, idToken, value) => db.push(path, value, { auth: idToken }),
  shallowGet: async (path, idToken) => db.get(path, { auth: idToken, shallow: true }),
};

window.emailKey = (email) => email.trim().toLowerCase().replace(/\./g, ",");
window.uid8 = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
