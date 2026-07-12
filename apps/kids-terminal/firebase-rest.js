/*
  Plain-REST Firebase layer for Agy Kids Terminal.
  Reuses the same REST API pattern as apps/studio/firebase-rest.js.
  Auth and Realtime Database functions are decoupled and called using standard fetch().
*/

const Auth = (() => {
  const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1";
  const REFRESH_BASE = "https://securetoken.googleapis.com/v1/token";
  const SESSION_KEY = "agy-terminal-session-v1";

  function apiKey() {
    return State.config?.auth?.apiKey || "";
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function writeSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function authFetch(endpoint, body) {
    const key = apiKey();
    if (!key || key.startsWith("REPLACE_")) {
      throw new Error("Firebase Web API Key is not configured yet. Please configure it in Settings.");
    }
    const r = await fetch(`${AUTH_BASE}/${endpoint}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "Authentication request failed");
    return data;
  }

  async function signUp(email, password) {
    // Notify the server about the new user registration attempt
    try {
      await fetch(`/api/notify-registration?email=${encodeURIComponent(email)}`);
    } catch (e) {
      console.warn("Failed to notify registration attempt:", e.message);
    }

    const data = await authFetch("accounts:signUp", { email, password, returnSecureToken: true });
    writeSession(sessionFromAuthResponse(data));
    return readSession();
  }

  async function signIn(email, password) {
    const data = await authFetch("accounts:signInWithPassword", { email, password, returnSecureToken: true });
    writeSession(sessionFromAuthResponse(data));
    return readSession();
  }

  function sessionFromAuthResponse(data) {
    return {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn) * 1000,
    };
  }

  async function refresh(session) {
    const key = apiKey();
    const r = await fetch(`${REFRESH_BASE}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${session.refreshToken}`,
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "Session expired. Please sign in again.");
    const next = {
      uid: data.user_id,
      email: session.email,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000,
    };
    writeSession(next);
    return next;
  }

  async function currentSession() {
    let session = readSession();
    if (!session) return null;
    if (Date.now() > session.expiresAt - 60000) {
      try {
        session = await refresh(session);
      } catch (err) {
        clearSession();
        return null;
      }
    }
    return session;
  }

  function signOut() {
    clearSession();
  }

  return { signUp, signIn, signOut, currentSession };
})();

const Db = (() => {
  function base() {
    const url = State.config?.firebase?.url || "https://arh-firebase-db-default-rtdb.asia-southeast1.firebasedatabase.app";
    const root = State.config?.firebase?.root || "kids-terminal";
    return `${url.replace(/\/$/, "")}/${root}`;
  }

  async function req(path, method, idToken, body) {
    const url = `${base()}/${path}.json?auth=${idToken}`;
    const r = await fetch(url, { 
      method, 
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined 
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error(data?.error || `${method} ${path} failed (${r.status})`);
    return data;
  }

  return {
    get: (path, idToken) => req(path, "GET", idToken),
    set: (path, idToken, value) => req(path, "PUT", idToken, value),
    update: (path, idToken, value) => req(path, "PATCH", idToken, value),
    remove: (path, idToken) => req(path, "DELETE", idToken),
    push: async (path, idToken, value) => {
      const result = await req(path, "POST", idToken, value);
      return result.name;
    },
  };
})();

function emailToKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}
