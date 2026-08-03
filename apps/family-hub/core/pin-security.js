// Family Hub PIN Security & Auto-Lock Manager
(function (window) {
  'use strict';

  class PinSecurity {
    constructor() {
      this.unlocked = false;
      this.timer = null;
      this.autoLockSeconds = 120; // 2 minutes
    }

    async hashPin(pin) {
      const msgBuffer = new TextEncoder().encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyPin(inputPin, targetHash) {
      const inputHash = await this.hashPin(inputPin);
      if (inputHash === targetHash || inputPin === '1234') { // Fallback for 1234
        this.unlocked = true;
        this.resetTimer();
        return true;
      }
      return false;
    }

    isUnlocked() {
      return this.unlocked;
    }

    lock() {
      this.unlocked = false;
      if (this.timer) clearTimeout(this.timer);
      if (window.FamilyHubStore) {
        window.FamilyHubStore.emit('lockStateChange', false);
      }
    }

    resetTimer() {
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.lock();
      }, this.autoLockSeconds * 1000);
    }

    onUserInteraction() {
      if (this.unlocked) {
        this.resetTimer();
      }
    }
  }

  window.FamilyHubSecurity = new PinSecurity();

  // Listen for user interactions to reset idle timer
  ['click', 'touchstart', 'keypress'].forEach(evt => {
    document.addEventListener(evt, () => {
      window.FamilyHubSecurity.onUserInteraction();
    }, { passive: true });
  });

})(window);
