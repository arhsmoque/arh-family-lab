// Family Hub — local device PIN security (salted PBKDF2, no fallback)
(function (window) {
  'use strict';

  const PIN_KEY = 'familyHub_pin_v1';
  const RATE_KEY = 'familyHub_pin_rate_v1';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

  function getStorage() {
    return {
      pin: localStorage.getItem(PIN_KEY),
      rate: JSON.parse(localStorage.getItem(RATE_KEY) || 'null')
    };
  }

  function setPinData(salt, hash) {
    localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash }));
  }

  function clearPinData() {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(RATE_KEY);
  }

  function getRateState() {
    try {
      return JSON.parse(localStorage.getItem(RATE_KEY) || 'null') || { attempts: 0, lockedUntil: 0 };
    } catch {
      return { attempts: 0, lockedUntil: 0 };
    }
  }

  function setRateState(state) {
    localStorage.setItem(RATE_KEY, JSON.stringify(state));
  }

  function arrayBufferToHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexToArrayBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  async function deriveKey(pin, saltHex) {
    const salt = hexToArrayBuffer(saltHex);
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    return arrayBufferToHex(bits);
  }

  async function setPin(pin) {
    if (!/^[0-9]{4,8}$/.test(pin)) {
      throw new Error('PIN must be 4–8 digits.');
    }
    const salt = arrayBufferToHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await deriveKey(pin, salt);
    setPinData(salt, hash);
    setRateState({ attempts: 0, lockedUntil: 0 });
    return true;
  }

  async function verifyPin(pin) {
    const rate = getRateState();
    if (Date.now() < rate.lockedUntil) {
      const wait = Math.ceil((rate.lockedUntil - Date.now()) / 1000);
      throw new Error(`Too many attempts. Try again in ${wait}s.`);
    }

    const stored = JSON.parse(localStorage.getItem(PIN_KEY) || 'null');
    if (!stored || !stored.salt || !stored.hash) {
      return false;
    }

    const hash = await deriveKey(pin, stored.salt);
    if (hash === stored.hash) {
      setRateState({ attempts: 0, lockedUntil: 0 });
      return true;
    }

    const attempts = rate.attempts + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
    setRateState({ attempts, lockedUntil });
    return false;
  }

  function hasPin() {
    return !!localStorage.getItem(PIN_KEY);
  }

  function resetPin() {
    clearPinData();
  }

  window.FamilyHubSecurity = {
    setPin,
    verifyPin,
    hasPin,
    resetPin
  };
})(window);
