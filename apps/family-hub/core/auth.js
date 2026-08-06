// Family Hub — Firebase Identity Toolkit REST auth (no SDK)
(function (window) {
  'use strict';

  const CONFIG = window.FAMILY_HUB_CONFIG || {};
  const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
  const REFRESH_BASE = 'https://securetoken.googleapis.com/v1/token';
  const SESSION_KEY = 'familyHub_session_v1';

  function apiKey() {
    return CONFIG.firebase.apiKey || '';
  }

  function isConfigured() {
    return !!(CONFIG.firebase.url && CONFIG.firebase.apiKey);
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
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
    if (!key) throw new Error('Firebase API key is not configured.');

    const r = await fetch(`${AUTH_BASE}/${endpoint}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const message = data.error?.message || 'Auth request failed';
      throw new Error(message);
    }
    return data;
  }

  function sessionFromAuthResponse(data) {
    return {
      uid: data.localId,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn) * 1000
    };
  }

  async function signUp(email, password) {
    const data = await authFetch('accounts:signUp', {
      email,
      password,
      returnSecureToken: true
    });
    const session = sessionFromAuthResponse(data);
    writeSession(session);
    return session;
  }

  async function signIn(email, password) {
    const data = await authFetch('accounts:signInWithPassword', {
      email,
      password,
      returnSecureToken: true
    });
    const session = sessionFromAuthResponse(data);
    writeSession(session);
    return session;
  }

  async function refresh(session) {
    const key = apiKey();
    if (!key) throw new Error('Firebase API key is not configured.');

    const r = await fetch(`${REFRESH_BASE}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(data.error?.message || 'Session expired. Please sign in again.');
    }

    const next = {
      uid: data.user_id,
      email: session.email,
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000
    };
    writeSession(next);
    return next;
  }

  async function currentSession() {
    if (!isConfigured()) return null;
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

  window.FamilyHubAuth = {
    isConfigured,
    signUp,
    signIn,
    signOut,
    currentSession,
    readSession
  };
})(window);
