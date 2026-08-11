/**
 * Shared Firebase Realtime Database REST layer (no SDK).
 *
 * Usage:
 *   import { FirebaseDB } from '../../shared/runtime/db.js';
 *   const db = new FirebaseDB({ baseUrl: 'https://...firebaseio.com', root: 'familyHub' });
 *   const data = await db.get('households/owner/tasks', { auth: idToken });
 *   await db.patch('households/owner/tasks', { newTask: true }, { auth: idToken });
 */

export class FirebaseDB {
  constructor({ baseUrl, root = "" }) {
    if (!baseUrl) throw new Error("FirebaseDB requires baseUrl");
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.root = root;
  }

  _url(path, { auth, shallow } = {}) {
    let url = `${this.baseUrl}/${this.root ? `${this.root}/` : ""}${path}.json`;
    const params = new URLSearchParams();
    if (auth) params.set("auth", auth);
    if (shallow) params.set("shallow", "true");
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
  }

  async _fetch(method, path, body, opts) {
    const init = { method, headers: { "Content-Type": "application/json" } };
    if (body !== undefined) init.body = JSON.stringify(body);
    const r = await fetch(this._url(path, opts), init);
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      throw new Error(data?.error || `DB ${method} ${path} failed: ${r.status}`);
    }
    return data;
  }

  async get(path, opts = {}) {
    return this._fetch("GET", path, undefined, opts);
  }

  async put(path, value, opts = {}) {
    return this._fetch("PUT", path, value, opts);
  }

  async patch(path, value, opts = {}) {
    return this._fetch("PATCH", path, value, opts);
  }

  async delete(path, opts = {}) {
    return this._fetch("DELETE", path, undefined, opts);
  }

  async push(path, value, opts = {}) {
    const result = await this._fetch("POST", path, value, opts);
    return result?.name;
  }
}
