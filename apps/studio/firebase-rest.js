/*
  Plain-REST Firebase layer — no SDK, no build step (same pattern as
  admin.html's fbSet/fbDelete). Two products, both called with fetch():
    - Identity Toolkit (Auth) for signup/login/token refresh.
    - Realtime Database REST for reading/writing app data, gated by
      security rules keyed on the signed-in user's ID token.
*/
const Auth = (() => {
  const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1";
  const REFRESH_BASE = "https://securetoken.googleapis.com/v1/token";
  const SESSION_KEY = "arh-studio-session-v1";

  function apiKey() {
    return STUDIO_APP_CONFIG.auth.apiKey;
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
    const r = await fetch(`${AUTH_BASE}/${endpoint}?key=${apiKey()}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "Auth request failed");
    return data;
  }

  async function signUp(email, password) {
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
    const r = await fetch(`${REFRESH_BASE}?key=${apiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${session.refreshToken}`,
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error?.message || "Session expired, please sign in again.");
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
    if (Date.now() > session.expiresAt - 60000) session = await refresh(session);
    return session;
  }

  function signOut() {
    clearSession();
  }

  return { signUp, signIn, signOut, currentSession };
})();

const Db = (() => {
  function base() {
    return `${STUDIO_APP_CONFIG.firebase.url.replace(/\/$/, "")}/${STUDIO_APP_CONFIG.firebase.root}`;
  }

  async function req(path, method, idToken, body) {
    const url = `${base()}/${path}.json?auth=${idToken}`;
    const r = await fetch(url, { method, body: body !== undefined ? JSON.stringify(body) : undefined });
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

function emailKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}

function uid8() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
