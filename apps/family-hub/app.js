// Family Hub Main Controller Application
(function () {
  'use strict';

  // State Management
  const state = {
    activeTab: 'today',
    selectedMemberId: null,
    pinInput: '',
    parentModeUnlocked: false,
    autoLockTimer: null,
    config: window.FamilyHubConfig || {},
    lang: localStorage.getItem('familyHub_lang') || 'en'
  };

  // DOM Elements
  const el = {
    viewContainer: document.getElementById('viewContainer'),
    syncBadge: document.getElementById('syncBadge'),
    syncStatusText: document.getElementById('syncStatusText'),
    pinModal: document.getElementById('pinModal'),
    pinDots: document.querySelectorAll('.pin-dot'),
    btnUnlock: document.getElementById('btnUnlockParent'),
    btnLangToggle: document.getElementById('btnLangToggle'),
    navItems: document.querySelectorAll('.nav-item')
  };

  // Sound Synth Generator (Web Audio API)
  function playCompletionChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio not permitted without user gesture
    }
  }

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
      locked: "Locked",
      unlocked: "Parent Mode Active"
    },
    bm: {
      today: "Hari Ini",
      family: "Profil Keluarga",
      calendar: "Kalendar",
      parent: "Mod Ibu Bapa",
      nextEvent: "ACTIVITI SETERUSNYA",
      familyStatus: "AHLI KELUARGA",
      todayTasks: "TUGASAN HARI INI",
      checklists: "SENARAI SEMAK KELUAR RUMAH",
      savedNow: "Disimpan sebentar tadi",
      enterPin: "Masukkan PIN Ibu Bapa",
      pinPrompt: "Tindakan dilindungi memerlukan PIN ibu bapa.",
      locked: "Terkunci",
      unlocked: "Mod Ibu Bapa Aktif"
    }
  };

  function t(key) {
    return i18n[state.lang][key] || key;
  }

  // Render Functions
  function renderTodayView() {
    const members = state.config.members || [];
    const tasks = state.config.tasks || [];
    const checklists = state.config.checklists || [];
    const events = state.config.events || [];
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
                  <div class="checklist-row" data-checklist-item="${item.id}">
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
    const members = state.config.members || [];
    el.viewContainer.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">👨‍👩‍👧‍👦 ${t('family')}</span>
          ${state.parentModeUnlocked ? '<button class="btn-icon" style="font-size:14px;padding:4px 12px;height:auto">+ Add Member</button>' : ''}
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
  }

  function renderCalendarView() {
    const events = state.config.events || [];
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
        const id = chip.getAttribute('data-member-id');
        state.selectedMemberId = (state.selectedMemberId === id) ? null : id;
        renderTodayView();
      });
    });

    const btnClear = document.getElementById('btnClearFilter');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        state.selectedMemberId = null;
        renderTodayView();
      });
    }

    // Task toggle (3-tap child action)
    document.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', () => {
        const taskId = item.getAttribute('data-task-id');
        const task = state.config.tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = !task.completed;
          if (task.completed) {
            playCompletionChime();
          }
          triggerSaveStatus();
          renderTodayView();
        }
      });
    });
  }

  function triggerSaveStatus() {
    el.syncStatusText.textContent = t('savedNow');
    el.syncBadge.style.opacity = '1';
  }

  // Navigation Logic
  el.navItems.forEach(item => {
    item.addEventListener('click', () => {
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
    key.addEventListener('click', () => {
      const val = key.getAttribute('data-val');
      if (val === 'clear') {
        state.pinInput = '';
      } else if (val === 'back') {
        state.pinInput = state.pinInput.slice(0, -1);
      } else if (state.pinInput.length < 4) {
        state.pinInput += val;
        if (state.pinInput.length === 4) {
          verifyPin();
        }
      }
      updatePinDots();
    });
  });

  function verifyPin() {
    // Default PIN: 1234
    if (state.pinInput === '1234') {
      state.parentModeUnlocked = true;
      closePinModal();
      alert('Parent Mode Unlocked!');
      renderFamilyView();
    } else {
      alert('Incorrect PIN. Try 1234');
      state.pinInput = '';
      updatePinDots();
    }
  }

  el.btnUnlock.addEventListener('click', openPinModal);

  // Language Toggle
  el.btnLangToggle.addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'bm' : 'en';
    localStorage.setItem('familyHub_lang', state.lang);
    el.btnLangToggle.textContent = state.lang.toUpperCase();
    if (state.activeTab === 'today') renderTodayView();
    else if (state.activeTab === 'family') renderFamilyView();
    else if (state.activeTab === 'calendar') renderCalendarView();
  });

  // Initialize
  el.btnLangToggle.textContent = state.lang.toUpperCase();
  renderTodayView();

})();
