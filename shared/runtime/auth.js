/**
 * Shared Firebase Identity Toolkit auth layer (no SDK).
 *
 * Usage:
 *   import { FirebaseAuth } from '../../shared/runtime/auth.js';
 *   const auth = new FirebaseAuth({ apiKey: '...' });
 *   await auth.signIn(email, password);
 */

const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1";
const REFRESH_BASE = "https://securetoken.googleapis.com/v1/token";

export class FirebaseAuth {
  constructor({ apiKey, sessionKey = "arh_firebase_session_v1" }) {
    if (!apiKey) throw new Error("FirebaseAuth requires apiKey");
    this.apiKey = apiKey;
    this.sessionKey = sessionKey;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async signUp(email, password) {
    const data = await this._authFetch("accounts:signUp", { email, password });
    const session = this._sessionFromAuthResponse(data);
    this._writeSession(session);
    return session;
  }

  async signIn(email, password) {
    const data = await this._authFetch("accounts:signInWithPassword", { email, password });
    const session = this._sessionFromAuthResponse(data);
    this._writeSession(session);
    return session;
  }

  async currentSession() {
    let session = this._readSession();
    if (!session) return null;
    if (Date.now() > session.expiresAt - 60000) {
      try {
        session = await this._refresh(session);
      } catch (err) {
        this.signOut();
        return null;
      }
    }
    return session;
  }

  signOut() {
    try {
      localStorage.removeItem(this.sessionKey);
    } catch {
      /* ignore */
    }
  }

  _readSession() {
    try {
      return JSON.parse(localStorage.getItem(this.sessionKey) || "null");
    } catch {
      return null;
    }
  }

  _writeSession(session) {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }

  async _authFetch(endpoint, body) {
    const r = await fetch(`${AUTH_BASE}/${endpoint}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(data.error?.message || "Auth request failed");
    }
    return data;
  }

  _sessionFromAuthResponse(data) {
    return {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn) * 1000,
    };
  }

  async _refresh(session) {
    const r = await fetch(`${REFRESH_BASE}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(data.error?.message || "Session expired");
    }
    const next = {
      uid: data.user_id,
      email: session.email,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000,
    };
    this._writeSession(next);
    return next;
  }
}
