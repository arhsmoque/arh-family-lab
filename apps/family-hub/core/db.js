// Family Hub — Firebase Realtime Database REST layer (no SDK)
(function (window) {
  'use strict';

  const CONFIG = window.FAMILY_HUB_CONFIG || {};

  function baseUrl() {
    const url = (CONFIG.firebase.url || '').replace(/\/$/, '');
    const root = CONFIG.firebase.root || 'familyHub';
    return `${url}/${root}`;
  }

  function isConfigured() {
    return !!(CONFIG.firebase.url && CONFIG.firebase.apiKey);
  }

  async function req(path, method, idToken, body) {
    if (!isConfigured()) {
      throw new Error('Firebase is not configured. See SETUP.md.');
    }
    if (!idToken) {
      throw new Error('Not authenticated.');
    }

    const url = `${baseUrl()}/${path}.json?auth=${idToken}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const r = await fetch(url, options);
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      throw new Error(data?.error || `${method} ${path} failed (${r.status})`);
    }
    return data;
  }

  function householdPath(ownerUid) {
    return `households/${ownerUid}`;
  }

  window.FamilyHubDb = {
    isConfigured,
    baseUrl,
    get: (path, idToken) => req(path, 'GET', idToken),
    set: (path, idToken, value) => req(path, 'PUT', idToken, value),
    update: (path, idToken, value) => req(path, 'PATCH', idToken, value),
    remove: (path, idToken) => req(path, 'DELETE', idToken),
    householdPath
  };
})(window);
