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
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => {
      console.warn('Service worker registration failed:', err);
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
    el.view.innerHTML = `
      <div class="card centered-card">
        <h2>⚙️ Family Hub not configured</h2>
        <p>Firebase is not set up yet. Ask the operator to run the steps in <code>SETUP.md</code>.</p>
        <p>For local development, generate <code>family.config.local.js</code> from infisical.</p>
      </div>
    `;
    hideNav();
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

    document.getElementById('btnAddMember').addEventListener('click', () => {
      const name = prompt(t('addMember') + ' name:');
      if (!name) return;
      const avatar = prompt('Avatar emoji (e.g. 👦):') || '👤';
      const role = confirm('Is this an adult? (Cancel = child)') ? 'adult' : 'child';
      store.addMember({ name, avatar, role });
      renderFamilyView();
    });

    document.querySelectorAll('[data-action="delete-member"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Remove this member?')) store.removeMember(id);
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

    document.getElementById('btnAddEvent').addEventListener('click', () => {
      const title = prompt('Event title:');
      if (!title) return;
      const time = prompt('Time (e.g. 7:15 AM):') || '12:00 PM';
      const member = prompt('Who is this for?') || 'All';
      store.addEvent({ title, time, member });
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

    document.getElementById('btnAddTask').addEventListener('click', () => {
      const members = Object.values(store.getState().members);
      if (members.length === 0) { alert('Add a family member first.'); return; }
      const title = prompt('Task title:');
      if (!title) return;
      const memberNames = members.map((m, i) => `${i + 1}. ${m.name}`).join('\n');
      const choice = prompt(`Assign to:\n${memberNames}\n(enter number):`);
      const member = members[Number(choice) - 1];
      if (!member) return;
      store.addTask({ memberId: member.id, title });
      alert('Task added.');
    });

    document.getElementById('btnAddChecklist').addEventListener('click', () => {
      const title = prompt('Checklist title:');
      if (!title) return;
      const raw = prompt('Items, one per line:');
      const items = (raw || '').split('\n').filter(Boolean).map(text => ({ text }));
      store.addChecklist({ title, icon: '🎒', items });
      alert('Checklist added.');
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
      const current = prompt('Enter current PIN:');
      if (current === null) return;
      const ok = await security.verifyPin(current);
      if (!ok) { alert('Incorrect PIN.'); return; }
      const next = prompt('Enter new 4-digit PIN:');
      if (!next || !/^[0-9]{4,8}$/.test(next)) { alert('PIN must be 4–8 digits.'); return; }
      const confirm = prompt('Confirm new PIN:');
      if (next !== confirm) { alert('PINs do not match.'); return; }
      await security.setPin(next);
      alert('PIN changed.');
      audit.log('pin_changed', 'parent', {});
    });

    document.getElementById('selAutoLock').addEventListener('change', (e) => {
      store.setAutoLock(Number(e.target.value));
      startIdleTimers();
      audit.log('auto_lock_changed', 'parent', { seconds: Number(e.target.value) });
    });

    document.getElementById('btnSignOut').addEventListener('click', () => {
      if (confirm('Sign out? You will need your email and password to sign back in.')) {
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
