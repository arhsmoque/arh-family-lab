/**
 * Generic local-first store with optional Firebase sync queue.
 *
 * Usage:
 *   import { LocalStore } from '../../shared/runtime/store.js';
 *   const store = new LocalStore({ key: 'my-app-state' });
 *   store.set('user.name', 'Ada');
 *
 * With sync:
 *   const sync = new SyncQueue({ db, getAuthToken: () => session.idToken });
 *   sync.enqueue({ method: 'PATCH', path: 'users/ada', value: { name: 'Ada' } });
 */

export class LocalStore {
  constructor({ key, defaults = {} }) {
    this.key = key;
    this.state = { ...defaults };
    this.listeners = [];
    this.load();
  }

  load() {
    try {
      const cached = localStorage.getItem(this.key);
      if (cached) {
        this.state = { ...this.state, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn(`[LocalStore ${this.key}] load failed:`, e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.state));
    } catch (e) {
      console.error(`[LocalStore ${this.key}] save failed:`, e);
    }
  }

  get(path) {
    return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), this.state);
  }

  set(path, value) {
    const parts = path.split(".");
    let target = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!target[part] || typeof target[part] !== "object") {
        target[part] = {};
      }
      target = target[part];
    }
    target[parts[parts.length - 1]] = value;
    this.save();
    this.emit("change", { path, value, state: this.state });
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
}

export class SyncQueue {
  constructor({ db, getAuthToken, key = "arh_sync_queue_v1" }) {
    this.db = db;
    this.getAuthToken = getAuthToken;
    this.key = key;
    this.items = [];
    this.status = "idle";
    this.load();

    window.addEventListener("online", () => this.flush());
  }

  load() {
    try {
      this.items = JSON.parse(localStorage.getItem(this.key) || "[]");
    } catch {
      this.items = [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.items));
    } catch (e) {
      console.error("[SyncQueue] save failed:", e);
    }
  }

  enqueue(item) {
    // Deduplicate consecutive writes to the same path.
    const last = this.items[this.items.length - 1];
    if (last && last.path === item.path && last.method === item.method) {
      last.value = item.value;
      last.ts = Date.now();
    } else {
      this.items.push({ ...item, ts: Date.now() });
    }
    this.save();
    if (navigator.onLine) this.flush();
  }

  async flush() {
    if (!this.db || this.items.length === 0 || this.status === "syncing") return;
    this.status = "syncing";
    const token = this.getAuthToken ? await this.getAuthToken() : undefined;

    while (this.items.length > 0) {
      const item = this.items[0];
      try {
        if (item.method === "PATCH") {
          await this.db.patch(item.path, item.value, { auth: token });
        } else if (item.method === "PUT") {
          await this.db.put(item.path, item.value, { auth: token });
        } else if (item.method === "DELETE") {
          await this.db.delete(item.path, { auth: token });
        }
        this.items.shift();
        this.save();
      } catch (err) {
        console.warn("[SyncQueue] flush failed:", err);
        break;
      }
    }

    this.status = this.items.length > 0 ? "pending" : "idle";
  }
}
