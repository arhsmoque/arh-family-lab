// Family Hub — main application controller
(function () {
  'use strict';

  const store = window.FamilyHubStore;
  const auth = window.FamilyHubAuth;
  const security = window.FamilyHubSecurity;
  const audit = window.FamilyHubAudit;
  const audio = window.FamilyHubAudio;

  const state = {
    activeTab: 'today',
    selectedMemberId: null,
    pinInput: '',
    parentUnlocked: false,
    lang: localStorage.getItem('familyHub_lang') || 'en',
    idleTimer: null,
    lockTimer: null,
    session: null
  };

  // Surface fatal errors so the app never silently stops on a blank screen.
  window.addEventListener('error', e => {
    console.error('Unhandled error:', e.error);
    if (el.view && !el.view.innerHTML.trim()) {
      el.view.innerHTML = `
        <div class="card centered-card">
          <h2>😕 Something went wrong</h2>
          <p>${e.message || 'An unexpected error occurred.'}</p>
          <button class="btn-primary" onclick="location.reload()">Reload</button>
        </div>
      `;
      hideNav();
    }
  });
  window.addEventListener('unhandledrejection', e => {
    console.error('Unhandled rejection:', e.reason);
  });

  const i18n = {
    en: {
      today: 'Today',
      family: 'Family',
      calendar: 'Calendar',
      parent: 'Parent',
      setup: 'Set up this household',
      signIn: 'Sign in',
      signUp: 'Create account',
      email: 'Email',
      password: 'Password',
      nextEvent: 'NEXT ACTIVITY',
      familyStatus: 'FAMILY MEMBERS',
      todayTasks: "TODAY'S TASKS",
      checklists: 'LEAVING HOME CHECKLISTS',
      savedNow: 'Saved just now',
      saving: 'Saving...',
      offline: 'Offline',
      unlocking: 'Unlock',
      pinPrompt: 'Enter parent PIN',
      pinSetupPrompt: 'Set a 4-digit parent PIN',
      addMember: 'Add member',
      addTask: 'Add task',
      addChecklist: 'Add checklist',
      addEvent: 'Add event',
      settings: 'Settings',
      signOut: 'Sign out',
      exportData: 'Export data',
      clearData: 'Clear local data',
      noTasks: 'No remaining tasks for today!',
      noEvents: 'No upcoming events.',
      welcome: 'Welcome to Family Hub',
      welcomeSub: 'Keep family plans, child tasks and leaving-home checklists together.',
      householdName: 'Household name',
      continue: 'Continue',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      member: 'Member',
      role: 'Role',
      child: 'Child',
      adult: 'Adult',
      owner: 'Owner',
      insights: 'Household Insights'
    },
    bm: {
      today: 'Hari Ini',
      family: 'Keluarga',
      calendar: 'Kalendar',
      parent: 'Ibu Bapa',
      setup: 'Sediakan isi rumah ini',
      signIn: 'Log masuk',
      signUp: 'Cipta akaun',
      email: 'Emel',
      password: 'Kata laluan',
      nextEvent: 'AKTIVITI SETERUSNYA',
      familyStatus: 'AHLI KELUARGA',
      todayTasks: 'TUGASAN HARI INI',
      checklists: 'SENARAI SEMAK KELUAR RUMAH',
      savedNow: 'Disimpan sebentar tadi',
      saving: 'Menyimpan...',
      offline: 'Luar talian',
      unlocking: 'Buka kunci',
      pinPrompt: 'Masukkan PIN ibu bapa',
      pinSetupPrompt: 'Tetapkan PIN 4 digit ibu bapa',
      addMember: 'Tambah ahli',
      addTask: 'Tambah tugasan',
      addChecklist: 'Tambah senarai semak',
      addEvent: 'Tambah acara',
      settings: 'Tetapan',
      signOut: 'Log keluar',
      exportData: 'Eksport data',
      clearData: 'Padam data tempatan',
      noTasks: 'Tiada tugasan yang tinggal untuk hari ini!',
      noEvents: 'Tiada acara akan datang.',
      welcome: 'Selamat datang ke Family Hub',
      welcomeSub: 'Simpan pelan keluarga, tugasan kanak-kanak dan senarai semak keluar rumah di satu tempat.',
      householdName: 'Nama isi rumah',
      continue: 'Teruskan',
      cancel: 'Batal',
      delete: 'Padam',
      edit: 'Sunting',
      member: 'Ahli',
      role: 'Peranan',
      child: 'Kanak-kanak',
      adult: 'Dewasa',
      owner: 'Pemilik',
      insights: 'Pencerahan Isi Rumah'
    }
  };

  function t(key) {
    return (i18n[state.lang] && i18n[state.lang][key]) || i18n.en[key] || key;
  }

  // Generic modal that replaces native prompt()/confirm().
  // fields: [{ key, label, type, value?, placeholder?, options?[{value,label}]}]
  // validate: async (values) => error string or undefined
  // Returns a promise resolving to values object, or null when cancelled.
  function openFormModal({ title, subtitle, fields = [], confirmText, cancelText, validate }) {
    return new Promise((resolve) => {
      const modal = document.getElementById('formModal');
      const titleEl = document.getElementById('formModalTitle');
      const subtitleEl = document.getElementById('formModalSubtitle');
      const body = document.getElementById('formModalBody');
      const errorEl = document.getElementById('formModalError');
      const confirmBtn = document.getElementById('formModalConfirm');
      const cancelBtn = document.getElementById('formModalCancel');

      titleEl.textContent = title;
      subtitleEl.textContent = subtitle || '';
      subtitleEl.style.display = subtitle ? 'block' : 'none';
      body.innerHTML = '';
      errorEl.textContent = '';
      confirmBtn.textContent = confirmText || 'OK';
      if (cancelText === null) {
        cancelBtn.style.display = 'none';
      } else {
        cancelBtn.style.display = '';
        cancelBtn.textContent = cancelText || t('cancel') || 'Cancel';
      }

      const inputs = [];
      fields.forEach((f) => {
        const label = document.createElement('label');
        label.textContent = f.label;
        let input;
        if (f.type === 'select') {
          input = document.createElement('select');
          (f.options || []).forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            input.appendChild(option);
          });
        } else if (f.type === 'textarea') {
          input = document.createElement('textarea');
          input.placeholder = f.placeholder || '';
        } else {
          input = document.createElement('input');
          input.type = f.type || 'text';
          input.placeholder = f.placeholder || '';
        }
        input.value = f.value !== undefined ? f.value : '';
        body.appendChild(label);
        body.appendChild(input);
        inputs.push({ key: f.key, input });
      });

      function cleanup() {
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        modal.classList.remove('active');
      }

      confirmBtn.onclick = async () => {
        const values = {};
        inputs.forEach((i) => { values[i.key] = i.input.value; });
        if (validate) {
          const err = await validate(values);
          if (err) {
            errorEl.textContent = err;
            return;
          }
        }
        cleanup();
        resolve(values);
      };

      cancelBtn.onclick = () => {
        cleanup();
        resolve(null);
      };

      modal.classList.add('active');
      if (inputs[0]) inputs[0].input.focus();
    });
  }

  function openConfirmModal({ title, subtitle, confirmText, cancelText }) {
    return openFormModal({ title, subtitle, confirmText, cancelText, fields: [] });
  }

  // DOM refs
  const el = {
    body: document.body,
    view: document.getElementById('viewContainer'),
    nav: document.querySelectorAll('.nav-item'),
    syncBadge: document.getElementById('syncBadge'),
    syncText: document.getElementById('syncStatusText'),
    pinModal: document.getElementById('pinModal'),
    pinTitle: document.getElementById('pinTitle'),
    pinSubtitle: document.getElementById('pinSubtitle'),
    pinDots: document.querySelectorAll('.pin-dot'),
    btnUnlock: document.getElementById('btnUnlockParent'),
    btnTheme: document.getElementById('btnThemeToggle'),
    btnLang: document.getElementById('btnLangToggle'),
    headerActions: document.querySelector('.header-actions')
  };

  // ---------- Service worker ----------
  let swUpdateReady = false;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' })
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              swUpdateReady = true;
              showUpdateToast();
            }
          });
        });
      })
      .catch(err => {
        console.warn('Service worker registration failed:', err);
      });

    // Reload once when a new service worker takes control.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  function showUpdateToast() {
    const toast = document.createElement('div');
    toast.className = 'update-toast';
    toast.innerHTML = `<span>New version available.</span><button id="swUpdateBtn">Update</button>`;
    document.body.appendChild(toast);
    document.getElementById('swUpdateBtn').addEventListener('click', () => {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  }

  // ---------- Boot ----------
  async function boot() {
    applyTheme();
    updateLangButton();

    if (!auth.isConfigured()) {
      renderNotConfigured();
      return;
    }

    const session = await auth.currentSession();
    if (!session) {
      renderAuth();
      return;
    }

    await store.init(session);
    state.session = session;

    if (!store.hasHousehold()) {
      renderHouseholdSetup();
      return;
    }

    if (!security.hasPin()) {
      renderPinSetup();
      return;
    }

    startIdleTimers();
    renderTodayView();
    audit.log('session_start', 'system', { sessionId: session.uid.slice(0, 8) + Date.now().toString(36) });
  }

  // ---------- Rendering ----------
  function renderNotConfigured() {
    const isDeployed = /github\.io|pages\.dev|localhost|127\.0\.0\.1/.test(location.host);
    const isLocal = /localhost|127\.0\.0\.1/.test(location.host);
    el.view.innerHTML = `
      <div class="card centered-card">
        <h2>⚙️ Family Hub not configured</h2>
        <p>Firebase is not set up yet.</p>
        ${isLocal ? `
          <p>For local development, generate <code>family.config.local.js</code> from Infisical:</p>
          <pre><code>MSYS_NO_PATHCONV=1 infisical export --projectId=90b0e7ef-3f72-4ddb-b888-055e90e13dfa --env=dev --path=/arh-family-lab/family-hub --format=dotenv > .env</code></pre>
          <p>Then convert it to a JS file that assigns <code>FAMILY_HUB_CONFIG_LOCAL</code>. See <code>SETUP.md</code> for details.</p>
        ` : `
          <p>This deployed build is missing its Firebase configuration. This usually means the last deployment did not finish, or your browser is holding on to an older cached version.</p>
          <div class="form-actions" style="justify-content:center;margin-top:var(--space-5)">
            <button id="btnCheckUpdate" class="btn-primary">Check for update</button>
            <button id="btnUnregisterSw" class="btn-secondary">Clear cached app</button>
          </div>
        `}
        <p style="margin-top:var(--space-5);font-size:var(--font-size-sm);color:var(--color-text-muted)">
          If this keeps happening, ask the operator to check the GitHub Actions deploy status and the Infisical/GitHub secrets.
        </p>
      </div>
    `;
    hideNav();

    if (!isLocal) {
      const btnUpdate = document.getElementById('btnCheckUpdate');
      if (btnUpdate) {
        btnUpdate.addEventListener('click', () => {
          btnUpdate.disabled = true;
          btnUpdate.textContent = 'Checking...';
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
              if (reg) {
                reg.update().then(() => {
                  if (swUpdateReady) {
                    // The update toast already appeared; clicking it will reload.
                  } else {
                    btnUpdate.textContent = 'No update found';
                    setTimeout(() => { btnUpdate.disabled = false; btnUpdate.textContent = 'Check for update'; }, 2000);
                  }
                });
              } else {
                window.location.reload();
              }
            });
          } else {
            window.location.reload();
          }
        });
      }
      const btnClear = document.getElementById('btnUnregisterSw');
      if (btnClear) {
        btnClear.addEventListener('click', async () => {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
          }
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
          window.location.reload(true);
        });
      }
    }
  }

  function renderAuth() {
    el.view.innerHTML = `
      <div class="card centered-card auth-card">
        <h2>${t('welcome')}</h2>
        <p>${t('welcomeSub')}</p>
        <form id="authForm" class="form-stack">
          <label>${t('email')}</label>
          <input type="email" id="authEmail" required placeholder="owner@example.com">
          <label>${t('password')}</label>
          <input type="password" id="authPassword" required placeholder="••••••••">
          <div class="form-actions">
            <button type="submit" class="btn-primary">${t('signIn')}</button>
            <button type="button" class="btn-secondary" id="authSignUp">${t('signUp')}</button>
          </div>
        </form>
        <p id="authError" class="form-error"></p>
      </div>
    `;
    hideNav();

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const errorEl = document.getElementById('authError');
      try {
        const session = await auth.signIn(email, password);
        await store.init(session);
        state.session = session;
        routeAfterAuth();
      } catch (err) {
        errorEl.textContent = friendlyAuthError(err.message);
      }
    });

    document.getElementById('authSignUp').addEventListener('click', async () => {
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const errorEl = document.getElementById('authError');
      if (!email || password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        return;
      }
      try {
        const session = await auth.signUp(email, password);
        await store.init(session);
        state.session = session;
        routeAfterAuth();
      } catch (err) {
        errorEl.textContent = friendlyAuthError(err.message);
      }
    });
  }

  function friendlyAuthError(msg) {
    if (msg.includes('INVALID_LOGIN_CREDENTIALS')) return 'Email or password is incorrect.';
    if (msg.includes('EMAIL_EXISTS')) return 'This email already has an account. Try signing in.';
    if (msg.includes('TOO_MANY_ATTEMPTS')) return 'Too many attempts. Please wait a moment.';
    return msg;
  }

  function routeAfterAuth() {
    if (!store.hasHousehold()) {
      renderHouseholdSetup();
    } else if (!security.hasPin()) {
      renderPinSetup();
    } else {
      showNav();
      startIdleTimers();
      renderTodayView();
    }
  }

  function renderHouseholdSetup() {
    el.view.innerHTML = `
      <div class="card centered-card">
        <h2>🏡 ${t('setup')}</h2>
        <p>Let's create your household dashboard.</p>
        <div class="form-stack">
          <label>${t('householdName')}</label>
          <input type="text" id="householdName" value="Rumah Hilmi" required>
          <button class="btn-primary" id="btnCreateHousehold">${t('continue')}</button>
        </div>
      </div>
    `;
    hideNav();

    document.getElementById('btnCreateHousehold').addEventListener('click', () => {
      const name = document.getElementById('householdName').value.trim();
      if (!name) return;
      store.createHousehold(name, state.session);
      renderPinSetup();
    });
  }

  function renderPinSetup() {
    el.view.innerHTML = `
      <div class="card centered-card">
        <h2>🔐 ${t('pinSetupPrompt')}</h2>
        <p>This PIN unlocks parent mode on this device.</p>
        <div class="pin-display large">
          <div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>
        </div>
        <div class="pin-keypad">${pinKeys()}</div>
        <p id="pinError" class="form-error"></p>
      </div>
    `;
    hideNav();
    bindPinInput('setup');
  }

  function pinKeys() {
    const keys = ['1','2','3','4','5','6','7','8','9','clear','0','back'];
    return keys.map(k => `<button class="pin-key" data-val="${k}">${k === 'clear' ? 'C' : k === 'back' ? '⌫' : k}</button>`).join('');
  }

  function renderTodayView() {
    const st = store.getState();
    const members = Object.values(st.members).sort((a, b) => a.order - b.order);
    const tasks = Object.values(st.tasks);
    const checklists = Object.values(st.checklists);
    const events = Object.values(st.events).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const now = new Date();
    const nextEvent = events.find(e => (e.date || '') >= now.toISOString().slice(0, 10)) || events[0];

    const selectedMember = members.find(m => m.id === state.selectedMemberId);
    const filteredTasks = selectedMember
      ? tasks.filter(t => t.memberId === selectedMember.id)
      : tasks;

    el.view.innerHTML = `
      <div class="grid-dashboard">
        <div class="main-column">
          ${nextEvent ? `
            <div class="card event-card">
              <p class="card-kicker">${t('nextEvent')}</p>
              <h2>${nextEvent.title}</h2>
              <p class="muted">⏰ ${nextEvent.time} • ${nextEvent.member}</p>
            </div>
          ` : ''}

          <div class="card">
            <div class="card-header">
              <span class="card-title">👨‍👩‍👧‍👦 ${t('familyStatus')}</span>
              ${state.selectedMemberId ? `<button class="btn-text" id="btnClearFilter">Show all</button>` : ''}
            </div>
            <div class="members-row">
              ${members.map(m => {
                const pending = tasks.filter(t => t.memberId === m.id && !t.completed).length;
                const active = state.selectedMemberId === m.id;
                return `
                  <div class="member-chip ${active ? 'active' : ''}" data-member-id="${m.id}">
                    <span class="member-avatar">${m.avatar}</span>
                    <div class="member-info">
                      <div class="name">${m.name}</div>
                      <div class="meta">${pending === 0 ? '✓ Done' : pending + ' tasks'}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">📋 ${t('todayTasks')} ${selectedMember ? '— ' + selectedMember.name : ''}</span>
            </div>
            <div class="tasks-list">
              ${filteredTasks.length === 0 ? `<p class="muted empty-state">${t('noTasks')} 🎉</p>` : ''}
              ${filteredTasks.map(t => `
                <div class="task-item ${t.completed ? 'completed' : ''}" data-task-id="${t.id}">
                  <div class="task-checkbox">${t.completed ? '✓' : ''}</div>
                  <div class="task-content">
                    <div class="task-title">${t.title}</div>
                  </div>
                  <span class="task-tag">${t.category}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="sidebar-column">
          <div class="card checklist-card">
            <div class="card-header">
              <span class="card-title">🎒 ${t('checklists')}</span>
            </div>
            ${checklists.length === 0 ? `<p class="muted empty-state">No checklists yet.</p>` : ''}
            ${checklists.map(cl => `
              <div class="checklist-block">
                <div class="checklist-title">${cl.icon} ${cl.title}</div>
                ${Object.values(cl.items || {}).map(item => `
                  <div class="checklist-row" data-checklist-id="${cl.id}" data-item-id="${item.id}">
                    <input type="checkbox" ${item.checked ? 'checked' : ''}>
                    <span class="${item.checked ? 'struck' : ''}">${item.text}</span>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    attachTodayEvents();
  }

  function renderFamilyView() {
    const st = store.getState();
    const members = Object.values(st.members).sort((a, b) => a.order - b.order);

    el.view.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">👨‍👩‍👧‍👦 ${t('family')}</span>
          <button class="btn-primary btn-small" id="btnAddMember">+ ${t('addMember')}</button>
        </div>
        <div class="family-grid">
          ${members.map(m => `
            <div class="family-card" data-member-id="${m.id}">
              <div class="family-avatar">${m.avatar}</div>
              <h3>${m.name}</h3>
              <p class="muted capitalize">${t(m.role)}</p>
              <button class="btn-text btn-delete" data-action="delete-member" data-id="${m.id}">🗑</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btnAddMember').addEventListener('click', async () => {
      const values = await openFormModal({
        title: t('addMember'),
        fields: [
          { key: 'name', label: t('member') + ' name', type: 'text', placeholder: 'e.g. Aisyah' },
          { key: 'avatar', label: 'Avatar emoji', type: 'text', value: '👤', placeholder: 'e.g. 👦' },
          { key: 'role', label: t('role'), type: 'select', value: 'child', options: [
            { value: 'child', label: t('child') },
            { value: 'adult', label: t('adult') }
          ] }
        ],
        confirmText: t('addMember')
      });
      if (!values || !values.name) return;
      store.addMember({ name: values.name, avatar: values.avatar || '👤', role: values.role });
      renderFamilyView();
    });

    document.querySelectorAll('[data-action="delete-member"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const ok = await openConfirmModal({ title: 'Remove member?', subtitle: 'This cannot be undone.', confirmText: t('delete') });
        if (ok) store.removeMember(id);
        renderFamilyView();
      });
    });
  }

  function renderCalendarView() {
    const st = store.getState();
    const events = Object.values(st.events).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    el.view.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">📅 ${t('calendar')}</span>
          <button class="btn-primary btn-small" id="btnAddEvent">+ ${t('addEvent')}</button>
        </div>
        <div class="events-list">
          ${events.length === 0 ? `<p class="muted empty-state">${t('noEvents')}</p>` : ''}
          ${events.map(e => `
            <div class="event-row">
              <div>
                <strong>${e.title}</strong>
                <p class="muted">${e.date} • ${e.time} • ${e.member}</p>
              </div>
              <span class="task-tag">${e.badge}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btnAddEvent').addEventListener('click', async () => {
      const values = await openFormModal({
        title: t('addEvent'),
        fields: [
          { key: 'title', label: 'Event title', type: 'text', placeholder: 'e.g. Swimming lesson' },
          { key: 'time', label: 'Time', type: 'text', value: '12:00 PM', placeholder: 'e.g. 7:15 AM' },
          { key: 'member', label: 'Who is this for?', type: 'text', value: 'All', placeholder: 'Name or All' }
        ],
        confirmText: t('addEvent')
      });
      if (!values || !values.title) return;
      store.addEvent({ title: values.title, time: values.time || '12:00 PM', member: values.member || 'All' });
      renderCalendarView();
    });
  }

  function renderParentView() {
    const st = store.getState();
    const insights = audit.getInsights(7);

    el.view.innerHTML = `
      <div class="grid-dashboard">
        <div class="main-column">
          <div class="card">
            <div class="card-header">
              <span class="card-title">🔐 ${t('settings')}</span>
            </div>
            <div class="settings-list">
              <button class="btn-secondary" id="btnAddTask">+ ${t('addTask')}</button>
              <button class="btn-secondary" id="btnAddChecklist">+ ${t('addChecklist')}</button>
              <button class="btn-secondary" id="btnChangePin">Change PIN</button>
              <label class="setting-label">Auto-lock after inactivity</label>
              <select class="setting-select" id="selAutoLock">
                <option value="60" ${st.config.autoLockSeconds === 60 ? 'selected' : ''}>1 minute</option>
                <option value="120" ${st.config.autoLockSeconds === 120 ? 'selected' : ''}>2 minutes</option>
                <option value="300" ${st.config.autoLockSeconds === 300 ? 'selected' : ''}>5 minutes</option>
              </select>
              <button class="btn-secondary" id="btnExport">${t('exportData')}</button>
              <button class="btn-danger" id="btnSignOut">${t('signOut')}</button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">📊 ${t('insights')}</span>
            </div>
            <ul class="insight-list">
              ${insights.pinFailureCount > 0 ? `<li>⚠️ ${insights.pinFailureCount} failed PIN attempts this week</li>` : ''}
              <li>✅ ${Object.keys(st.tasks).filter(id => st.tasks[id].completed).length} tasks completed</li>
              <li>📝 ${Object.keys(st.tasks).length} total tasks</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnAddTask').addEventListener('click', async () => {
      const members = Object.values(store.getState().members);
      if (members.length === 0) {
        await openConfirmModal({ title: 'No family members', subtitle: 'Add a family member first.' });
        return;
      }
      const values = await openFormModal({
        title: t('addTask'),
        fields: [
          { key: 'title', label: 'Task title', type: 'text', placeholder: 'e.g. Pack school bag' },
          { key: 'memberId', label: t('member'), type: 'select', value: members[0]?.id || '', options: members.map((m) => ({ value: m.id, label: m.name })) }
        ],
        confirmText: t('addTask')
      });
      if (!values || !values.title) return;
      store.addTask({ memberId: values.memberId, title: values.title });
      await openConfirmModal({ title: 'Task added', confirmText: 'OK', cancelText: null });
    });

    document.getElementById('btnAddChecklist').addEventListener('click', async () => {
      const values = await openFormModal({
        title: t('addChecklist'),
        fields: [
          { key: 'title', label: 'Checklist title', type: 'text', placeholder: 'e.g. Leaving home' },
          { key: 'items', label: 'Items, one per line', type: 'textarea', placeholder: 'Shoes\nBag\nWater bottle' }
        ],
        confirmText: t('addChecklist')
      });
      if (!values || !values.title) return;
      const items = (values.items || '').split('\n').filter(Boolean).map(text => ({ text }));
      store.addChecklist({ title: values.title, icon: '🎒', items });
      await openConfirmModal({ title: 'Checklist added', confirmText: 'OK', cancelText: null });
    });

    document.getElementById('btnExport').addEventListener('click', () => {
      const blob = new Blob([audit.exportJson()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-hub-log-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('btnChangePin').addEventListener('click', async () => {
      const values = await openFormModal({
        title: 'Change PIN',
        subtitle: 'Enter your current PIN, then set a new 4–8 digit PIN.',
        fields: [
          { key: 'current', label: 'Current PIN', type: 'password', placeholder: '••••' },
          { key: 'next', label: 'New PIN', type: 'password', placeholder: '4–8 digits' },
          { key: 'confirm', label: 'Confirm new PIN', type: 'password', placeholder: 'Repeat new PIN' }
        ],
        confirmText: 'Change PIN',
        validate: async (vals) => {
          const ok = await security.verifyPin(vals.current);
          if (!ok) return 'Incorrect current PIN.';
          if (!vals.next || !/^[0-9]{4,8}$/.test(vals.next)) return 'PIN must be 4–8 digits.';
          if (vals.next !== vals.confirm) return 'PINs do not match.';
        }
      });
      if (!values) return;
      await security.setPin(values.next);
      await openConfirmModal({ title: 'PIN changed', confirmText: 'OK', cancelText: null });
      audit.log('pin_changed', 'parent', {});
    });

    document.getElementById('selAutoLock').addEventListener('change', (e) => {
      store.setAutoLock(Number(e.target.value));
      startIdleTimers();
      audit.log('auto_lock_changed', 'parent', { seconds: Number(e.target.value) });
    });

    document.getElementById('btnSignOut').addEventListener('click', async () => {
      const ok = await openConfirmModal({
        title: 'Sign out?',
        subtitle: 'You will need your email and password to sign back in.',
        confirmText: t('signOut')
      });
      if (ok) {
        auth.signOut();
        store.signOut();
        state.parentUnlocked = false;
        stopIdleTimers();
        renderAuth();
      }
    });
  }

  // ---------- Events ----------
  function attachTodayEvents() {
    document.querySelectorAll('.member-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        audio.playClick();
        const id = chip.getAttribute('data-member-id');
        state.selectedMemberId = state.selectedMemberId === id ? null : id;
        audit.log('member_selected', 'child', { memberId: id });
        renderTodayView();
      });
    });

    const clearBtn = document.getElementById('btnClearFilter');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        audio.playClick();
        state.selectedMemberId = null;
        renderTodayView();
      });
    }

    document.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', () => {
        const taskId = item.getAttribute('data-task-id');
        const task = store.toggleTask(taskId);
        if (task && task.completed) audio.playSuccessChime();
        else audio.playClick();
        renderTodayView();
      });
    });

    document.querySelectorAll('.checklist-row').forEach(row => {
      row.addEventListener('click', () => {
        const checklistId = row.getAttribute('data-checklist-id');
        const itemId = row.getAttribute('data-item-id');
        store.toggleChecklistItem(checklistId, itemId);
        audio.playClick();
        renderTodayView();
      });
    });
  }

  // ---------- PIN modal ----------
  let pinMode = 'unlock'; // 'unlock' | 'setup'
  let pinBuffer = '';

  function openPinModal(mode = 'unlock') {
    pinMode = mode;
    pinBuffer = '';
    el.pinTitle.textContent = mode === 'setup' ? t('pinSetupPrompt') : t('pinPrompt');
    el.pinSubtitle.textContent = mode === 'setup' ? 'Enter twice to confirm.' : '';
    updatePinDots();
    el.pinModal.classList.add('active');
  }

  function closePinModal() {
    el.pinModal.classList.remove('active');
    pinBuffer = '';
    updatePinDots();
  }

  function updatePinDots() {
    el.pinDots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < pinBuffer.length);
    });
  }

  let setupPinFirst = '';

  function bindPinInput(mode) {
    pinMode = mode;
    pinBuffer = '';
    setupPinFirst = '';
    const dots = document.querySelectorAll('#viewContainer .pin-dot');
    const errorEl = document.getElementById('pinError');

    function updateLocalDots() {
      dots.forEach((dot, i) => dot.classList.toggle('filled', i < pinBuffer.length));
    }

    function onKey(val) {
      if (val === 'clear') pinBuffer = '';
      else if (val === 'back') pinBuffer = pinBuffer.slice(0, -1);
      else if (pinBuffer.length < 4) pinBuffer += val;

      updateLocalDots();

      if (pinBuffer.length === 4) {
        handlePinComplete(pinBuffer, errorEl);
      }
    }

    document.querySelectorAll('#viewContainer .pin-key').forEach(key => {
      key.addEventListener('click', () => onKey(key.getAttribute('data-val')));
    });
  }

  async function handlePinComplete(pin, errorEl) {
    if (pinMode === 'setup') {
      if (!setupPinFirst) {
        setupPinFirst = pin;
        pinBuffer = '';
        updatePinDots();
        if (errorEl) errorEl.textContent = 'Enter again to confirm.';
        return;
      }
      if (setupPinFirst !== pin) {
        setupPinFirst = '';
        pinBuffer = '';
        updatePinDots();
        if (errorEl) errorEl.textContent = 'PINs did not match. Try again.';
        return;
      }
      await security.setPin(pin);
      closePinModal();
      showNav();
      startIdleTimers();
      renderTodayView();
      return;
    }

    try {
      const ok = await security.verifyPin(pin);
      if (ok) {
        state.parentUnlocked = true;
        closePinModal();
        renderParentView();
        state.activeTab = 'parent';
        updateNav();
      } else {
        pinBuffer = '';
        updatePinDots();
        audit.log('pin_failed', 'child', {});
        if (errorEl) errorEl.textContent = 'Incorrect PIN.';
      }
    } catch (err) {
      pinBuffer = '';
      updatePinDots();
      if (errorEl) errorEl.textContent = err.message;
    }
  }

  // Header PIN unlock
  el.btnUnlock.addEventListener('click', () => {
    openPinModal('unlock');
  });

  // Modal PIN keys (header modal)
  document.querySelectorAll('#pinModal .pin-key').forEach(key => {
    key.addEventListener('click', () => {
      const val = key.getAttribute('data-val');
      if (val === 'clear') pinBuffer = '';
      else if (val === 'back') pinBuffer = pinBuffer.slice(0, -1);
      else if (pinBuffer.length < 4) pinBuffer += val;
      updatePinDots();
      if (pinBuffer.length === 4) {
        handlePinComplete(pinBuffer, document.getElementById('pinModalError'));
      }
    });
  });

  // ---------- Navigation ----------
  el.nav.forEach(item => {
    item.addEventListener('click', () => {
      audio.playClick();
      const tab = item.getAttribute('data-tab');

      if (tab === 'parent') {
        if (state.parentUnlocked) {
          state.activeTab = 'parent';
          renderParentView();
        } else {
          openPinModal('unlock');
          return;
        }
      } else {
        state.activeTab = tab;
        if (tab === 'today') renderTodayView();
        else if (tab === 'family') renderFamilyView();
        else if (tab === 'calendar') renderCalendarView();
      }
      updateNav();
    });
  });

  function updateNav() {
    el.nav.forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${state.activeTab}"]`)?.classList.add('active');
  }

  function showNav() {
    document.querySelector('.app-nav').style.display = '';
  }

  function hideNav() {
    document.querySelector('.app-nav').style.display = 'none';
  }

  // ---------- Theme / Lang ----------
  function applyTheme() {
    const st = store.getState();
    const themeId = (st && st.config && st.config.activeTheme) || window.FAMILY_HUB_CONFIG?.defaults?.theme || 'warm';
    el.body.setAttribute('data-theme', themeId);
  }

  function updateLangButton() {
    el.btnLang.textContent = state.lang.toUpperCase();
  }

  el.btnLang.addEventListener('click', () => {
    audio.playClick();
    state.lang = state.lang === 'en' ? 'bm' : 'en';
    localStorage.setItem('familyHub_lang', state.lang);
    store.setLang(state.lang);
    updateLangButton();
    if (state.activeTab === 'today') renderTodayView();
    else if (state.activeTab === 'family') renderFamilyView();
    else if (state.activeTab === 'calendar') renderCalendarView();
    else if (state.activeTab === 'parent') renderParentView();
  });

  // Theme picker
  const themeModal = document.getElementById('themeModal');
  el.btnTheme.addEventListener('click', () => {
    audio.playClick();
    themeModal.classList.add('active');
  });

  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.getAttribute('data-theme-id');
      store.setTheme(themeId);
      applyTheme();
      audio.playClick();
      themeModal.classList.remove('active');
    });
  });

  // ---------- Idle / Auto-lock ----------
  function startIdleTimers() {
    stopIdleTimers();
    const lockSeconds = (store.getState().config && store.getState().config.autoLockSeconds) || 120;
    const returnSeconds = window.FAMILY_HUB_CONFIG?.defaults?.idleReturnSeconds || 60;

    const reset = () => {
      clearTimeout(state.idleTimer);
      clearTimeout(state.lockTimer);
      state.idleTimer = setTimeout(returnToToday, returnSeconds * 1000);
      state.lockTimer = setTimeout(lockParent, lockSeconds * 1000);
    };

    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.addEventListener(evt, reset, { passive: true });
    });

    reset();
  }

  function stopIdleTimers() {
    clearTimeout(state.idleTimer);
    clearTimeout(state.lockTimer);
  }

  function returnToToday() {
    if (state.activeTab !== 'today') {
      state.activeTab = 'today';
      renderTodayView();
      updateNav();
    }
  }

  function lockParent() {
    if (state.parentUnlocked) {
      state.parentUnlocked = false;
      audit.log('parent_locked', 'system', {});
      returnToToday();
      updateNav();
    }
  }

  // ---------- Sync status ----------
  store.subscribe((event, data) => {
    if (event === 'syncStatus') {
      if (data === 'saved') {
        el.syncText.textContent = t('savedNow');
        el.syncBadge.className = 'status-badge';
      } else if (data === 'offline') {
        el.syncText.textContent = t('offline');
        el.syncBadge.className = 'status-badge offline';
      } else if (data === 'syncing' || data === 'saving') {
        el.syncText.textContent = t('saving');
        el.syncBadge.className = 'status-badge syncing';
      }
    } else if (event === 'change') {
      applyTheme();
    }
  });

  // ---------- Boot ----------
  boot();
})();
