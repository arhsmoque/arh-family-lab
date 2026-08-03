// Family Hub Main Controller Application
(function () {
  'use strict';

  // Services & State
  const store = window.FamilyHubStore;
  const security = window.FamilyHubSecurity;
  const rest = window.FamilyHubRest;
  const audio = window.FamilyHubAudio;

  const state = {
    activeTab: 'today',
    selectedMemberId: null,
    pinInput: '',
    lang: localStorage.getItem('familyHub_lang') || 'en'
  };

  // DOM Elements
  const el = {
    body: document.body,
    viewContainer: document.getElementById('viewContainer'),
    syncBadge: document.getElementById('syncBadge'),
    syncStatusText: document.getElementById('syncStatusText'),
    pinModal: document.getElementById('pinModal'),
    themeModal: document.getElementById('themeModal'),
    pinDots: document.querySelectorAll('.pin-dot'),
    btnUnlock: document.getElementById('btnUnlockParent'),
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    btnLangToggle: document.getElementById('btnLangToggle'),
    navItems: document.querySelectorAll('.nav-item')
  };

  // Language Dictionary
  const i18n = {
    en: {
      today: "Today",
      family: "Family Profiles",
      calendar: "Calendar",
      parent: "Parent Mode",
      nextEvent: "NEXT ACTIVITY",
      familyStatus: "FAMILY MEMBERS",
      todayTasks: "TODAY'S TASKS",
      checklists: "LEAVING HOME CHECKLISTS",
      savedNow: "Saved just now",
      enterPin: "Enter Parent PIN",
      pinPrompt: "Protected actions require parent PIN unlock.",
      selectTheme: "Select Visual Profile Theme"
    },
    bm: {
      today: "Hari Ini",
      family: "Profil Keluarga",
      calendar: "Kalendar",
      parent: "Mod Ibu Bapa",
      nextEvent: "AKTIVITI SETERUSNYA",
      familyStatus: "AHLI KELUARGA",
      todayTasks: "TUGASAN HARI INI",
      checklists: "SENARAI SEMAK KELUAR RUMAH",
      savedNow: "Disimpan sebentar tadi",
      enterPin: "Masukkan PIN Ibu Bapa",
      pinPrompt: "Tindakan dilindungi memerlukan PIN ibu bapa.",
      selectTheme: "Pilih Tema Profil Visual"
    }
  };

  function t(key) {
    return (i18n[state.lang] && i18n[state.lang][key]) ? i18n[state.lang][key] : key;
  }

  // Theme Manager
  function applyTheme(themeId) {
    const activeTheme = themeId || store.getState().household.activeTheme || 'warm';
    el.body.setAttribute('data-theme', activeTheme);
  }

  // Render Views
  function renderTodayView() {
    const currentState = store.getState();
    const members = currentState.members || [];
    const tasks = currentState.tasks || [];
    const checklists = currentState.checklists || [];
    const events = currentState.events || [];
    const nextEvent = events[0] || { title: "School Departure", time: "7:15 AM" };

    const selectedMember = members.find(m => m.id === state.selectedMemberId);
    const filteredTasks = selectedMember 
      ? tasks.filter(t => t.memberId === selectedMember.id)
      : tasks;

    el.viewContainer.innerHTML = `
      <div class="grid-dashboard">
        <!-- Main Column -->
        <div class="main-column">
          <!-- Next Event Card -->
          <div class="card" style="border-left: 4px solid var(--color-primary)">
            <p style="font-size:12px;font-weight:800;color:var(--color-primary);letter-spacing:0.1em;margin-bottom:6px">${t('nextEvent')}</p>
            <h2 style="font-size:22px;font-weight:700">${nextEvent.title}</h2>
            <p style="color:var(--color-text-muted);font-size:14px;margin-top:4px">⏰ ${nextEvent.time} • ${nextEvent.member || 'All'}</p>
          </div>

          <!-- Family Members Avatars -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">👨‍👩‍👧‍👦 ${t('familyStatus')}</span>
              ${state.selectedMemberId ? `<button class="btn-icon" id="btnClearFilter" style="font-size:12px;padding:4px 10px;height:auto">Show All</button>` : ''}
            </div>
            <div class="members-row">
              ${members.map(m => {
                const memberTasks = tasks.filter(tk => tk.memberId === m.id);
                const pendingCount = memberTasks.filter(tk => !tk.completed).length;
                const isSelected = state.selectedMemberId === m.id;
                return `
                  <div class="member-chip ${isSelected ? 'active' : ''}" data-member-id="${m.id}">
                    <span class="member-avatar">${m.avatar}</span>
                    <div class="member-info">
                      <div class="name">${m.name}</div>
                      <div class="meta">${pendingCount === 0 ? '✓ Done' : pendingCount + ' tasks'}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Tasks Card (3-Tap Child Interactive) -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">📋 ${t('todayTasks')} ${selectedMember ? '— ' + selectedMember.name : ''}</span>
            </div>
            <div class="tasks-list">
              ${filteredTasks.length === 0 ? '<p style="color:var(--color-text-muted);padding:12px 0">No remaining tasks for today! 🎉</p>' : ''}
              ${filteredTasks.map(tk => `
                <div class="task-item ${tk.completed ? 'completed' : ''}" data-task-id="${tk.id}">
                  <div class="task-checkbox">${tk.completed ? '✓' : ''}</div>
                  <div class="task-content">
                    <div class="task-title">${tk.title}</div>
                  </div>
                  <span class="task-tag">${tk.category}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Sidebar Column -->
        <div class="sidebar-column">
          <!-- Leaving Home Checklists -->
          <div class="card checklist-card">
            <div class="card-header">
              <span class="card-title">🎒 ${t('checklists')}</span>
            </div>
            ${checklists.map(cl => `
              <div style="margin-bottom:16px">
                <div style="font-weight:700;font-size:15px;margin-bottom:8px">${cl.icon} ${cl.title}</div>
                ${cl.items.map(item => `
                  <div class="checklist-row" data-checklist-id="${cl.id}" data-item-id="${item.id}">
                    <input type="checkbox" ${item.checked ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer">
                    <span style="font-size:14px;${item.checked ? 'text-decoration:line-through;color:var(--color-text-muted)' : ''}">${item.text}</span>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    attachEvents();
  }

  function renderFamilyView() {
    const currentState = store.getState();
    const members = currentState.members || [];
    const isUnlocked = security.isUnlocked();

    el.viewContainer.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">👨‍👩‍👧‍👦 ${t('family')}</span>
          ${isUnlocked ? '<button class="btn-icon" id="btnAddMember" style="font-size:14px;padding:4px 12px;height:auto">+ Add Member</button>' : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:16px">
          ${members.map(m => `
            <div class="card" style="text-align:center;margin-bottom:0">
              <div style="font-size:48px;margin-bottom:8px">${m.avatar}</div>
              <h3 style="font-size:18px">${m.name}</h3>
              <p style="color:var(--color-text-muted);font-size:13px;text-transform:capitalize">${m.role}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const btnAdd = document.getElementById('btnAddMember');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const name = prompt('Enter member name:');
        if (name) {
          store.addMember({ name });
          renderFamilyView();
        }
      });
    }
  }

  function renderCalendarView() {
    const currentState = store.getState();
    const events = currentState.events || [];
    el.viewContainer.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">📅 ${t('calendar')}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${events.map(e => `
            <div style="padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center">
              <div>
                <strong style="font-size:16px">${e.title}</strong>
                <p style="color:var(--color-text-muted);font-size:13px">⏰ ${e.time} • ${e.member}</p>
              </div>
              <span class="task-tag">${e.badge}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function attachEvents() {
    // Member chip selection
    document.querySelectorAll('.member-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        audio.playClick();
        const id = chip.getAttribute('data-member-id');
        state.selectedMemberId = (state.selectedMemberId === id) ? null : id;
        renderTodayView();
      });
    });

    const btnClear = document.getElementById('btnClearFilter');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        audio.playClick();
        state.selectedMemberId = null;
        renderTodayView();
      });
    }

    // Task toggle (3-tap child action)
    document.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', () => {
        const taskId = item.getAttribute('data-task-id');
        const task = store.toggleTask(taskId);
        if (task && task.completed) {
          audio.playSuccessChime();
        } else {
          audio.playClick();
        }
        rest.syncData({ tasks: store.getState().tasks });
        renderTodayView();
      });
    });

    // Checklist item toggle
    document.querySelectorAll('.checklist-row').forEach(row => {
      row.addEventListener('click', () => {
        const checklistId = row.getAttribute('data-checklist-id');
        const itemId = row.getAttribute('data-item-id');
        store.toggleChecklistItem(checklistId, itemId);
        audio.playClick();
        rest.syncData({ checklists: store.getState().checklists });
        renderTodayView();
      });
    });
  }

  // Navigation Logic
  el.navItems.forEach(item => {
    item.addEventListener('click', () => {
      audio.playClick();
      const tab = item.getAttribute('data-tab');
      state.activeTab = tab;
      
      el.navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      if (tab === 'today') renderTodayView();
      else if (tab === 'family') renderFamilyView();
      else if (tab === 'calendar') renderCalendarView();
      else if (tab === 'parent') openPinModal();
    });
  });

  // PIN Modal Logic
  function openPinModal() {
    state.pinInput = '';
    updatePinDots();
    el.pinModal.classList.add('active');
  }

  function closePinModal() {
    el.pinModal.classList.remove('active');
  }

  function updatePinDots() {
    el.pinDots.forEach((dot, index) => {
      if (index < state.pinInput.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  document.querySelectorAll('.pin-key').forEach(key => {
    key.addEventListener('click', async () => {
      audio.playClick();
      const val = key.getAttribute('data-val');
      if (val === 'clear') {
        state.pinInput = '';
      } else if (val === 'back') {
        state.pinInput = state.pinInput.slice(0, -1);
      } else if (state.pinInput.length < 4) {
        state.pinInput += val;
        if (state.pinInput.length === 4) {
          const targetHash = store.getState().household.parentPinHash;
          const isOk = await security.verifyPin(state.pinInput, targetHash);
          if (isOk) {
            closePinModal();
            alert('Parent Mode Unlocked!');
            renderFamilyView();
          } else {
            alert('Incorrect PIN. Try 1234');
            state.pinInput = '';
          }
        }
      }
      updatePinDots();
    });
  });

  el.btnUnlock.addEventListener('click', openPinModal);

  // Theme Picker Modal
  if (el.btnThemeToggle) {
    el.btnThemeToggle.addEventListener('click', () => {
      audio.playClick();
      if (el.themeModal) el.themeModal.classList.add('active');
    });
  }

  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.getAttribute('data-theme-id');
      store.setTheme(themeId);
      applyTheme(themeId);
      audio.playClick();
      if (el.themeModal) el.themeModal.classList.remove('active');
    });
  });

  // Language Toggle
  el.btnLangToggle.addEventListener('click', () => {
    audio.playClick();
    state.lang = state.lang === 'en' ? 'bm' : 'en';
    localStorage.setItem('familyHub_lang', state.lang);
    el.btnLangToggle.textContent = state.lang.toUpperCase();
    if (state.activeTab === 'today') renderTodayView();
    else if (state.activeTab === 'family') renderFamilyView();
    else if (state.activeTab === 'calendar') renderCalendarView();
  });

  // Sync Status Listeners
  store.subscribe((event, status) => {
    if (event === 'syncStatus') {
      if (status === 'saved') {
        el.syncStatusText.textContent = t('savedNow');
        el.syncBadge.className = 'status-badge';
      } else if (status === 'offline') {
        el.syncStatusText.textContent = 'Offline';
        el.syncBadge.className = 'status-badge offline';
      } else if (status === 'saving' || status === 'syncing') {
        el.syncStatusText.textContent = 'Saving...';
      }
    }
  });

  // Initialize App
  applyTheme();
  el.btnLangToggle.textContent = state.lang.toUpperCase();
  renderTodayView();

})();
