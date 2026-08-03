// Family Hub Zero-SDK Firebase REST Adapter & Offline Sync Queue
(function (window) {
  'use strict';

  class RestAdapter {
    constructor() {
      this.baseUrl = "https://arh-firebase-db.firebaseio.com/familyHub/households/default.json";
      this.queueKey = "familyHub_offline_queue_v1";
      this.isOnline = navigator.onLine;
      this.initListeners();
    }

    initListeners() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emitStatus('online');
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.emitStatus('offline');
      });
    }

    async syncData(data) {
      if (!this.isOnline) {
        this.enqueue(data);
        this.emitStatus('offline');
        return false;
      }

      try {
        this.emitStatus('saving');
        const res = await fetch(this.baseUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          this.emitStatus('saved');
          return true;
        } else {
          this.enqueue(data);
          this.emitStatus('offline');
          return false;
        }
      } catch (err) {
        this.enqueue(data);
        this.emitStatus('offline');
        return false;
      }
    }

    enqueue(data) {
      try {
        const queue = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
        queue.push({ data, timestamp: Date.now() });
        localStorage.setItem(this.queueKey, JSON.stringify(queue));
      } catch (e) {
        console.error('Failed to enqueue offline item:', e);
      }
    }

    async flushQueue() {
      try {
        const queue = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
        if (queue.length === 0) return;

        this.emitStatus('syncing');
        for (const item of queue) {
          await fetch(this.baseUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          });
        }
        localStorage.removeItem(this.queueKey);
        this.emitStatus('saved');
      } catch (e) {
        console.warn('Queue flush paused:', e);
      }
    }

    emitStatus(status) {
      if (window.FamilyHubStore) {
        window.FamilyHubStore.emit('syncStatus', status);
      }
    }
  }

  window.FamilyHubRest = new RestAdapter();

})(window);
