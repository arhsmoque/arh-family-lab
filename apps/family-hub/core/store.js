// Family Hub — local-first store with Firebase sync and offline queue
(function (window) {
  'use strict';

  const CACHE_KEY = 'familyHub_state_v2';
  const QUEUE_KEY = 'familyHub_sync_queue_v2';

  const emptyHousehold = () => ({
    meta: null,
    members: {},
    tasks: {},
    checklists: {},
    events: {},
    config: {
      activeTheme: window.FAMILY_HUB_CONFIG?.defaults?.theme || 'warm',
      lang: window.FAMILY_HUB_CONFIG?.defaults?.lang || 'en',
      autoLockSeconds: window.FAMILY_HUB_CONFIG?.defaults?.autoLockSeconds || 120
    }
  });

  class Store {
    constructor() {
      this.state = emptyHousehold();
      this.listeners = [];
      this.session = null;
      this.syncStatus = 'idle';
      this.online = navigator.onLine;

      window.addEventListener('online', () => {
        this.online = true;
        this.emit('syncStatus', 'online');
        this.flushQueue();
      });
      window.addEventListener('offline', () => {
        this.online = false;
        this.emit('syncStatus', 'offline');
      });
    }

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
      };
    }

    emit(event, data) {
      this.listeners.forEach(fn => fn(event, data));
    }

    loadCache() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          this.state = Object.assign(emptyHousehold(), JSON.parse(cached));
        }
      } catch (e) {
        console.warn('Failed to load cache:', e);
      }
    }

    saveCache() {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Failed to save cache:', e);
      }
    }

    async init(session) {
      this.session = session;
      this.loadCache();
      this.emit('change', this.state);

      if (session && window.FamilyHubDb.isConfigured() && this.online) {
        try {
          this.setSyncStatus('syncing');
          const remote = await window.FamilyHubDb.get(
            window.FamilyHubDb.householdPath(session.uid),
            session.idToken
          );
          if (remote) {
            this.state = this.mergeRemote(this.state, remote);
            this.saveCache();
            this.emit('change', this.state);
          }
          this.setSyncStatus('saved');
          await this.flushQueue();
        } catch (err) {
          console.warn('Firebase load failed:', err);
          this.setSyncStatus('offline');
        }
      }
    }

    mergeRemote(local, remote) {
      const merged = emptyHousehold();
      merged.meta = remote.meta || local.meta;
      merged.config = Object.assign({}, local.config, remote.config);

      ['members', 'tasks', 'checklists', 'events'].forEach(collection => {
        const localCol = local[collection] || {};
        const remoteCol = remote[collection] || {};
        const out = {};
        const allKeys = new Set([...Object.keys(localCol), ...Object.keys(remoteCol)]);
        allKeys.forEach(key => {
          const l = localCol[key];
          const r = remoteCol[key];
          if (!l) out[key] = r;
          else if (!r) out[key] = l;
          else {
            const lTime = l.updatedAt || l.createdAt || 0;
            const rTime = r.updatedAt || r.createdAt || 0;
            out[key] = rTime > lTime ? r : l;
          }
        });
        merged[collection] = out;
      });

      return merged;
    }

    setSyncStatus(status) {
      this.syncStatus = status;
      this.emit('syncStatus', status);
    }

    getState() {
      return this.state;
    }

    hasHousehold() {
      return !!(this.state.meta && this.state.meta.ownerUid);
    }

    // --- Household ---
    createHousehold(name, ownerSession) {
      this.session = ownerSession;
      this.state.meta = {
        name,
        ownerUid: ownerSession.uid,
        ownerEmail: ownerSession.email,
        createdAt: Date.now()
      };
      this.saveCache();
      this.sync('');
      this.emit('change', this.state);
      window.FamilyHubAudit.log('household_created', 'owner', { name });
    }

    // --- Members ---
    addMember(member) {
      const id = 'm_' + Date.now().toString(36);
      this.state.members[id] = {
        id,
        name: member.name,
        role: member.role || 'child',
        avatar: member.avatar || '👤',
        color: member.color || '#3B82F6',
        order: member.order ?? Object.keys(this.state.members).length,
        createdAt: Date.now()
      };
      this.persist(`members/${id}`, this.state.members[id]);
      window.FamilyHubAudit.log('member_added', 'parent', { memberId: id, name: member.name });
      return id;
    }

    removeMember(memberId) {
      delete this.state.members[memberId];
      this.state.tasks = Object.fromEntries(
        Object.entries(this.state.tasks).filter(([, t]) => t.memberId !== memberId)
      );
      this.persist(`members/${memberId}`, null);
      window.FamilyHubAudit.log('member_removed', 'parent', { memberId });
    }

    // --- Tasks ---
    addTask(task) {
      const id = 't_' + Date.now().toString(36);
      const now = Date.now();
      this.state.tasks[id] = {
        id,
        memberId: task.memberId,
        title: task.title,
        category: task.category || 'general',
        priority: task.priority || 'medium',
        completed: false,
        createdAt: now,
        updatedAt: now
      };
      this.persist(`tasks/${id}`, this.state.tasks[id]);
      window.FamilyHubAudit.log('task_added', 'parent', { taskId: id, memberId: task.memberId });
      return id;
    }

    toggleTask(taskId) {
      const task = this.state.tasks[taskId];
      if (!task) return null;
      task.completed = !task.completed;
      task.updatedAt = Date.now();
      this.persist(`tasks/${taskId}`, task);
      window.FamilyHubAudit.log('task_toggled', 'child', { taskId, completed: task.completed });
      return task;
    }

    removeTask(taskId) {
      delete this.state.tasks[taskId];
      this.persist(`tasks/${taskId}`, null);
      window.FamilyHubAudit.log('task_removed', 'parent', { taskId });
    }

    // --- Checklists ---
    addChecklist(checklist) {
      const id = 'c_' + Date.now().toString(36);
      this.state.checklists[id] = {
        id,
        title: checklist.title,
        icon: checklist.icon || '📋',
        items: {},
        createdAt: Date.now()
      };
      (checklist.items || []).forEach((item, idx) => {
        const itemId = `ci_${idx}_${Date.now().toString(36)}`;
        this.state.checklists[id].items[itemId] = {
          id: itemId,
          text: item.text,
          checked: false,
          createdAt: Date.now()
        };
      });
      this.persist(`checklists/${id}`, this.state.checklists[id]);
      window.FamilyHubAudit.log('checklist_added', 'parent', { checklistId: id });
      return id;
    }

    toggleChecklistItem(checklistId, itemId) {
      const checklist = this.state.checklists[checklistId];
      if (!checklist || !checklist.items[itemId]) return null;
      const item = checklist.items[itemId];
      item.checked = !item.checked;
      item.updatedAt = Date.now();
      checklist.updatedAt = Date.now();
      this.persist(`checklists/${checklistId}`, checklist);
      window.FamilyHubAudit.log('checklist_item_toggled', 'child', { checklistId, itemId, checked: item.checked });
      return item;
    }

    // --- Events ---
    addEvent(event) {
      const id = 'e_' + Date.now().toString(36);
      this.state.events[id] = {
        id,
        title: event.title,
        time: event.time,
        member: event.member || 'All',
        memberIds: event.memberIds || {},
        badge: event.badge || 'General',
        date: event.date || new Date().toISOString().slice(0, 10),
        createdAt: Date.now()
      };
      this.persist(`events/${id}`, this.state.events[id]);
      window.FamilyHubAudit.log('event_added', 'parent', { eventId: id });
      return id;
    }

    // --- Config ---
    setTheme(themeId) {
      this.state.config.activeTheme = themeId;
      this.persist('config', this.state.config);
    }

    setLang(lang) {
      this.state.config.lang = lang;
      localStorage.setItem('familyHub_lang', lang);
      this.persist('config', this.state.config);
    }

    setAutoLock(seconds) {
      this.state.config.autoLockSeconds = seconds;
      this.persist('config', this.state.config);
    }

    // --- Sync ---
    persist(path, value) {
      this.saveCache();
      this.emit('change', this.state);
      this.queue(path, value);
    }

    queue(path, value) {
      if (!this.session) return;
      try {
        const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        q.push({ path, value, ts: Date.now() });
        localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
      } catch (e) {
        console.warn('Failed to queue change:', e);
      }
      if (this.online) this.flushQueue();
      else this.setSyncStatus('offline');
    }

    async flushQueue() {
      if (!this.session || !window.FamilyHubDb.isConfigured()) return;

      try {
        const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        if (q.length === 0) return;

        this.setSyncStatus('syncing');
        for (const item of q) {
          const fullPath = `${window.FamilyHubDb.householdPath(this.session.uid)}/${item.path}`;
          if (item.value === null) {
            await window.FamilyHubDb.remove(fullPath, this.session.idToken);
          } else {
            await window.FamilyHubDb.update(fullPath, this.session.idToken, item.value);
          }
        }
        localStorage.removeItem(QUEUE_KEY);
        this.setSyncStatus('saved');
      } catch (err) {
        console.warn('Queue flush failed:', err);
        this.setSyncStatus('offline');
      }
    }

    async sync(fullPath) {
      if (!this.session) return;
      if (this.online) {
        await this.flushQueue();
      } else {
        this.setSyncStatus('offline');
      }
    }

    signOut() {
      this.session = null;
      this.state = emptyHousehold();
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(QUEUE_KEY);
      this.emit('change', this.state);
    }
  }

  window.FamilyHubStore = new Store();
})(window);
