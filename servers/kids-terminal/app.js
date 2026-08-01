// ============================================================================
// PURE BUSINESS LOGIC (Deterministic, zero I/O side effects, zero DOM)
// ============================================================================

const YamlParser = {
  parse(yamlStr) {
    const obj = {};
    const lines = yamlStr.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#') || !line.includes(':')) continue;

      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);

      if (val.toLowerCase() === 'true') val = true;
      else if (val.toLowerCase() === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);

      else if (val === '' && lines[lines.indexOf(line) + 1]?.trim().startsWith('-')) {
        const arr = [];
        let nextIdx = lines.indexOf(line) + 1;
        while (nextIdx < lines.length && lines[nextIdx].trim().startsWith('-')) {
          const itemVal = lines[nextIdx].trim().slice(1).trim().replace(/^['"]|['"]$/g, '');
          arr.push(itemVal);
          nextIdx++;
        }
        obj[key] = arr;
      } else {
        obj[key] = val;
      }
    }
    return obj;
  }
};

const PromptConstructor = {
  explain(filePath) {
    return `Explain the file "${filePath}" in a simple way so a 7-year-old child can easily understand it. What does it do?`;
  },
  makeGame() {
    return `Let's make a simple interactive game in this folder. Write the code and show me how we can play it. Make sure you output a step-by-step visual module.`;
  },
  tellStory() {
    return `Tell me a fun interactive adventure story about Agy the robot. Propose 2 choices for me to make at each step!`;
  },
  fixMistakes(filePath) {
    return `Look at the selected file "${filePath}" and find if there are any errors or spelling mistakes. Let's fix them together!`;
  }
};

const ArtifactExtractor = {
  extract(text) {
    // Extracts markdown file links like [filename.py](file:///path/to/filename.py)
    const regex = /\[([^\]]+)\]\((file:\/\/\/[^\)]+)\)/g;
    const artifacts = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      artifacts.push({
        name: match[1],
        path: match[2]
      });
    }
    return artifacts;
  }
};

const SecurityScanner = {
  isRestricted(promptText, keywords) {
    if (!keywords || !Array.isArray(keywords)) return false;
    const lowerText = promptText.toLowerCase();
    return keywords.some(word => lowerText.includes(word.toLowerCase()));
  }
};

function deepMerge(target, source) {
  if (!source) return target;
  const result = { ...target };
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  });
  return result;
}

// ============================================================================
// I18N (Lightweight bilingual EN/BM dictionary, persisted in localStorage)
// ============================================================================

const I18n = {
  lang: localStorage.getItem('agy-lang') || ((navigator.language || 'en').toLowerCase().startsWith('ms') ? 'ms' : 'en'),

  strings: {
    en: {
      // Auth screen
      authTitleLogin: 'Cadet Space Login',
      authSubtitleLogin: 'Enter your email and password to start!',
      authTitleRegister: 'Create your Cadet account',
      authSubtitleRegister: 'Pick an email and a secret password. Ask a parent if you need help!',
      authEmailLabel: 'Cadet Email',
      authPasswordLabel: 'Secret Password',
      authSubmitLogin: '🚀 Enter Space Station',
      authSubmitRegister: '🚀 Register Cadet',
      authToggleToRegister: 'First time here? Create account',
      authToggleToLogin: 'Already have an account? Log in',
      authAgeTierLabel: 'Your age group',
      ageJunior: 'Junior (7–12)',
      ageTeen: 'Teen (13–18)',
      authParentGate: '🛡️ Parent Setup & Configuration',
      // Main layout
      welcomeTitle: 'Welcome, Cadet!',
      welcomeText: 'Click a card below or talk to me! What shall we learn today?',
      workspaceLabel: 'Your Working Folder',
      noFolder: 'No folder chosen yet',
      btnPickFolder: '📁 Pick Folder',
      btnPickFile: '📄 Pick File',
      cardExplainTitle: 'Explain File',
      cardExplainDesc: 'Teach me about the file I selected!',
      cardGameTitle: 'Make a Game',
      cardGameDesc: 'Create a fun game we can play!',
      cardStoryTitle: 'Tell a Story',
      cardStoryDesc: 'Write an exciting adventure story!',
      cardFixTitle: 'Fix Mistakes',
      cardFixDesc: 'Find and fix bugs in my files!',
      consoleHeader: 'Agy Console Output',
      consoleReady: 'Agy Cadet Terminal Ready. Waiting for connection...',
      btnReadAloud: '🔊 Read Aloud',
      btnClear: '🗑️ Clear',
      promptPlaceholder: 'Type a message or click microphone to speak...',
      btnGo: '🚀 Go!',
      btnStop: '⏹️ Stop',
      cadetBadgeLabel: '🧑‍🚀 Cadet:',
      btnSignout: '🚪 Log Out',
      btnParentPortal: '🛡️ Parent Portal',
      tabVisual: '🔮 Visual Board',
      tabParent: '🛡️ Parent Console',
      // Parent console
      menuLogs: '📈 Cadet Logs',
      menuApproval: '⏳ Approvals',
      menuSettings: '⚙️ Settings',
      logsHeader: 'Activity Logs',
      logsSub: 'Monitor the Cadet queries, responses, and generated artifacts.',
      approvalHeader: 'Pending Gated Approvals',
      approvalSub: 'Review Cadet prompts containing restricted terms.',
      settingsHeader: 'Space Station Settings',
      settingsSub: 'Adjust colors, languages, tutoring style, and security.',
      settingsHeadVisual: '🎨 Visual Customization',
      settingsHeadSpeech: '🗣️ Speech & Language',
      settingsHeadParent: '🛡️ Parent & Tutoring Controls',
      labelApiKey: 'Firebase Web API Key',
      labelSecurity: 'Security Gate',
      securityOff: 'OFF (open — anyone can register)',
      securityOn: 'ON (PIN + approval gates)',
      labelParentPin: 'Parent Security PIN',
      labelSocratic: 'Socratic Tutoring',
      labelPersona: 'Agent Persona Preset',
      btnSave: '💾 Save Configuration',
      settingsSaved: 'Settings saved on the server!',
      cadetSettingsSaved: 'Your personal settings have been saved to your profile!',
      godmodeHeader: '⚡ Parent reset (use carefully)',
      godmodeSub: "Override all Cadets' custom settings back to the master defaults.",
      godmodeConfirm: 'WARNING: This will delete all customized Cadet settings and reset them to the master defaults. Are you sure?',
      btnGodmode: '💥 Reset All User Configurations',
      godmodeDone: 'Reset complete! All users are back to master defaults.',
      godmodeOffline: 'Reset is unavailable in Offline Setup Mode.',
      // PIN modal
      pinTitle: 'Parent Security Gate',
      pinSub: 'Please enter your parent PIN to access the Parent Console.',
      btnPinUnlock: 'Unlock',
      btnPinCancel: 'Cancel',
      // Dynamic states
      agyThinking: '🧠 Agy is thinking… (this can take a little while)',
      gatedWaiting: "Waiting for parent approval… (we sent a message to your parents' phone)",
      btnCancelWait: 'Cancel',
      gatedCancelled: 'Cancelled. Let\'s ask something else!',
      gatedTimeout: 'No answer yet — ask your parents directly, or try a different question!',
      gatedApproved: 'Parent APPROVED! Starting Agy...',
      gatedDenied: 'Your parents did not approve this question. Let\'s ask something else!',
      setupUnlockedTitle: 'Setup Mode Unlocked!',
      setupUnlockedText: 'Welcome! Set your Firebase API Key in the settings below to initialize the system.',
      cliMissing: 'Agy is not installed on this computer yet — answers will show a friendly placeholder until a parent installs it.',
      mockModeOn: 'Demo mode is ON — Agy answers are practice samples.',
      // Friendly auth errors
      errEmailNotFound: 'No account with that email yet. Ask a parent to help register.',
      errWrongPassword: 'Wrong password. Try again!',
      errInvalidLogin: 'Email or password is not right. Try again!',
      errEmailExists: 'That email already has an account. Try logging in!',
      errInvalidEmail: 'That email looks odd. Check the spelling!',
      errWeakPassword: 'Password too weak — use at least 6 characters.',
      errTooMany: 'Too many tries. Wait a moment and try again.',
      errUserDisabled: 'This account has been disabled. Ask a parent to check.',
      errNoApiKey: 'The system is not fully set up yet — ask a parent to enter the API key in settings.',
      errGeneric: 'Something went wrong. Try again or ask a parent for help.',
      errIncorrectPin: 'Incorrect PIN. Try again.',
      errStream: 'Connection lost. Try sending your message again.'
    },

    ms: {
      // Auth screen
      authTitleLogin: 'Log Masuk Angkasa Cadet',
      authSubtitleLogin: 'Masukkan e-mel dan kata laluan untuk mula!',
      authTitleRegister: 'Daftar akaun Cadet anda',
      authSubtitleRegister: 'Pilih e-mel dan kata laluan rahsia. Minta ibu bapa jika perlukan bantuan!',
      authEmailLabel: 'E-mel Cadet',
      authPasswordLabel: 'Kata Laluan Rahsia',
      authSubmitLogin: '🚀 Masuk Stesen Angkasa',
      authSubmitRegister: '🚀 Daftar Cadet',
      authToggleToRegister: 'Pertama kali? Daftar akaun',
      authToggleToLogin: 'Sudah ada akaun? Log masuk',
      authAgeTierLabel: 'Kumpulan umur anda',
      ageJunior: 'Junior (7–12)',
      ageTeen: 'Remaja (13–18)',
      authParentGate: '🛡️ Tetapan & Konfigurasi Ibu Bapa',
      // Main layout
      welcomeTitle: 'Selamat datang, Cadet!',
      welcomeText: 'Klik kad di bawah atau bercakap dengan saya! Apa yang kita belajar hari ini?',
      workspaceLabel: 'Folder Kerja Anda',
      noFolder: 'Tiada folder dipilih lagi',
      btnPickFolder: '📁 Pilih Folder',
      btnPickFile: '📄 Pilih Fail',
      cardExplainTitle: 'Terangkan Fail',
      cardExplainDesc: 'Ajar saya tentang fail yang saya pilih!',
      cardGameTitle: 'Buat Permainan',
      cardGameDesc: 'Cipta permainan seronok untuk kita main!',
      cardStoryTitle: 'Ceritakan Kisah',
      cardStoryDesc: 'Tulis cerita pengembaraan yang menarik!',
      cardFixTitle: 'Betulkan Kesalahan',
      cardFixDesc: 'Cari dan baiki pepijat dalam fail saya!',
      consoleHeader: 'Output Konsol Agy',
      consoleReady: 'Terminal Agy Cadet sedia. Menunggu sambungan...',
      btnReadAloud: '🔊 Baca Kuat',
      btnClear: '🗑️ Padam',
      promptPlaceholder: 'Taip mesej atau klik mikrofon untuk bercakap...',
      btnGo: '🚀 Pergi!',
      btnStop: '⏹️ Berhenti',
      cadetBadgeLabel: '🧑‍🚀 Cadet:',
      btnSignout: '🚪 Log Keluar',
      btnParentPortal: '🛡️ Portal Ibu Bapa',
      tabVisual: '🔮 Papan Visual',
      tabParent: '🛡️ Konsol Ibu Bapa',
      // Parent console
      menuLogs: '📈 Log Cadet',
      menuApproval: '⏳ Kelulusan',
      menuSettings: '⚙️ Tetapan',
      logsHeader: 'Log Aktiviti',
      logsSub: 'Pantau pertanyaan, jawapan, dan artifak Cadet.',
      approvalHeader: 'Kelulusan Terhad Menunggu',
      approvalSub: 'Semak prompt Cadet yang mengandungi kata kunci terhad.',
      settingsHeader: 'Tetapan Stesen Angkasa',
      settingsSub: 'Laraskan warna, bahasa, gaya tuisyen, dan keselamatan.',
      settingsHeadVisual: '🎨 Ubah Suai Visual',
      settingsHeadSpeech: '🗣️ Pertuturan & Bahasa',
      settingsHeadParent: '🛡️ Kawalan Ibu Bapa & Tuisyen',
      labelApiKey: 'Kunci API Web Firebase',
      labelSecurity: 'Pintu Keselamatan',
      securityOff: 'MATI (terbuka — sesiapa boleh daftar)',
      securityOn: 'HIDUP (PIN + pintu kelulusan)',
      labelParentPin: 'PIN Keselamatan Ibu Bapa',
      labelSocratic: 'Tuisyen Socratic',
      labelPersona: 'Pratetap Persona Ejen',
      btnSave: '💾 Simpan Konfigurasi',
      settingsSaved: 'Tetapan disimpan pada pelayan!',
      cadetSettingsSaved: 'Tetapan peribadi anda telah disimpan ke profil anda!',
      godmodeHeader: '⚡ Set semula ibu bapa (guna berhati-hati)',
      godmodeSub: 'Ketepikan semua tetapan tersuai Cadet kembali kepada tetapan induk.',
      godmodeConfirm: 'AMARAN: Ini akan memadam semua tetapan tersuai Cadet dan menetapkan semula kepada tetapan induk. Adakah anda pasti?',
      btnGodmode: '💥 Set Semula Semua Pengguna',
      godmodeDone: 'Set semula selesai! Semua pengguna kembali ke tetapan induk.',
      godmodeOffline: 'Set semula tidak tersedia dalam Mod Persediaan Luar Talian.',
      // PIN modal
      pinTitle: 'Pintu Keselamatan Ibu Bapa',
      pinSub: 'Sila masukkan PIN ibu bapa untuk akses Konsol Ibu Bapa.',
      btnPinUnlock: 'Buka',
      btnPinCancel: 'Batal',
      // Dynamic states
      agyThinking: '🧠 Agy sedang berfikir… (mungkin ambil masa sedikit)',
      gatedWaiting: 'Menunggu kelulusan ibu bapa… (kami hantar mesej ke telefon ibu bapa anda)',
      btnCancelWait: 'Batal',
      gatedCancelled: 'Dibatalkan. Jom tanya benda lain!',
      gatedTimeout: 'Tiada jawapan lagi — tanya ibu bapa terus, atau cuba soalan lain!',
      gatedApproved: 'Ibu bapa LULUSKAN! Memulakan Agy...',
      gatedDenied: 'Ibu bapa tidak meluluskan soalan ini. Jom tanya benda lain!',
      setupUnlockedTitle: 'Mod Persediaan Dibuka!',
      setupUnlockedText: 'Selamat datang! Masukkan Kunci API Firebase dalam tetapan di bawah untuk mulakan sistem.',
      cliMissing: 'Agy belum dipasang pada komputer ini — jawapan akan tunjuk placeholder mesra sehingga ibu bapa memasangnya.',
      mockModeOn: 'Mod demo HIDUP — jawapan Agy adalah contoh latihan.',
      // Friendly auth errors
      errEmailNotFound: 'Tiada akaun dengan e-mel itu lagi. Minta ibu bapa tolong daftar.',
      errWrongPassword: 'Kata laluan salah. Cuba lagi ya.',
      errInvalidLogin: 'E-mel atau kata laluan tidak betul. Cuba lagi!',
      errEmailExists: 'E-mel itu sudah ada akaun. Cuba log masuk!',
      errInvalidEmail: 'E-mel itu nampak pelik. Semak ejaan ya.',
      errWeakPassword: 'Kata laluan terlalu lemah — guna sekurang-kurangnya 6 aksara.',
      errTooMany: 'Terlalu banyak percubaan. Tunggu sebentar dan cuba lagi.',
      errUserDisabled: 'Akaun ini telah dimatikan. Minta ibu bapa semak.',
      errNoApiKey: 'Sistem belum siap sepenuhnya — minta ibu bapa masukkan kunci API dalam tetapan.',
      errGeneric: 'Ada masalah berlaku. Cuba lagi atau minta ibu bapa tolong.',
      errIncorrectPin: 'PIN salah. Cuba lagi.',
      errStream: 'Sambungan terputus. Cuba hantar mesej anda semula.'
    }
  },

  t(key) {
    return this.strings[this.lang]?.[key] || this.strings.en[key] || key;
  },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('agy-lang', lang);
    this.applyStatic();
    renderAuthStrings();
    updateLangButtons();
  },

  applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.innerText = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
  }
};

function updateLangButtons() {
  const label = I18n.lang === 'en' ? 'BM' : 'EN';
  document.querySelectorAll('.btn-lang-toggle').forEach(btn => { btn.innerText = label; });
}

// Map Firebase Identity Toolkit error codes to friendly bilingual messages
function friendlyAuthError(err) {
  const msg = (err?.message || '').toUpperCase();
  const map = [
    ['EMAIL_NOT_FOUND', 'errEmailNotFound'],
    ['INVALID_LOGIN_CREDENTIALS', 'errInvalidLogin'],
    ['INVALID_PASSWORD', 'errWrongPassword'],
    ['EMAIL_EXISTS', 'errEmailExists'],
    ['INVALID_EMAIL', 'errInvalidEmail'],
    ['WEAK_PASSWORD', 'errWeakPassword'],
    ['TOO_MANY_ATTEMPTS_TRY_LATER', 'errTooMany'],
    ['USER_DISABLED', 'errUserDisabled'],
    ['NOT CONFIGURED', 'errNoApiKey']
  ];
  for (const [code, key] of map) {
    if (msg.includes(code)) return I18n.t(key);
  }
  return I18n.t('errGeneric');
}

// ============================================================================
// I/O ADAPTERS (Side Effects & Native Browser/Server Communication)
// ============================================================================

// App Global State
const State = {
  selectedDirectory: '',
  selectedFile: '',
  isRecording: false,
  lastAgentResponseText: '',
  config: null,
  session: null,
  parentUnlocked: false,
  adminPin: '',
  ageTier: localStorage.getItem('agy-age-tier') || 'junior',
  currentStream: null
};

function securityOn() {
  return State.config?.security?.enabled === true;
}

// DOM selectors
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authAgeTier = document.getElementById('auth-age-tier');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const linkToggleAuth = document.getElementById('link-toggle-auth');
const linkAuthParentPortal = document.getElementById('link-auth-parent-portal');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');

const mainLayout = document.getElementById('main-layout');
const mascot = document.getElementById('mascot');
const mascotBubbleTitle = document.getElementById('mascot-bubble-title');
const mascotBubbleText = document.getElementById('mascot-bubble-text');
const currentFolderSpan = document.getElementById('current-folder');
const consoleOutput = document.getElementById('console-output');
const promptInput = document.getElementById('prompt-input');
const btnSend = document.getElementById('btn-send');
const btnStop = document.getElementById('btn-stop');
const btnMic = document.getElementById('btn-mic');
const btnPickFolder = document.getElementById('btn-pick-folder');
const btnPickFile = document.getElementById('btn-pick-file');
const btnReadAloud = document.getElementById('btn-read-aloud');
const btnClearConsole = document.getElementById('btn-clear-console');
const visualBoard = document.getElementById('visual-board');

const userBadgeEmail = document.getElementById('user-badge-email');
const ageTierSelect = document.getElementById('age-tier-select');
const btnSignout = document.getElementById('btn-signout');
const btnOpenParentPortal = document.getElementById('btn-open-parent-portal');
const parentPinModal = document.getElementById('parent-pin-modal');
const parentPinInput = document.getElementById('parent-pin-input');
const btnPinSubmit = document.getElementById('btn-pin-submit');
const btnPinCancel = document.getElementById('btn-pin-cancel');

// Tabs & Menu elements
const tabBtnVisual = document.getElementById('tab-btn-visual');
const tabBtnParent = document.getElementById('tab-btn-parent');
const tabContentVisual = document.getElementById('tab-content-visual');
const tabContentParent = document.getElementById('tab-content-parent');

const menuBtnLogs = document.getElementById('menu-btn-logs');
const menuBtnApproval = document.getElementById('menu-btn-approval');
const menuBtnSettings = document.getElementById('menu-btn-settings');
const parentSecLogs = document.getElementById('parent-sec-logs');
const parentSecApproval = document.getElementById('parent-sec-approval');
const parentSecSettings = document.getElementById('parent-sec-settings');

const parentLogsList = document.getElementById('parent-logs-list');
const parentApprovalsList = document.getElementById('parent-approvals-list');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnGodmodeReset = document.getElementById('btn-godmode-reset');

// Auth View Mode toggles
let authMode = 'login'; // 'login' or 'register'

function renderAuthStrings() {
  if (authMode === 'login') {
    authTitle.innerText = I18n.t('authTitleLogin');
    authSubtitle.innerText = I18n.t('authSubtitleLogin');
    btnAuthSubmit.innerText = I18n.t('authSubmitLogin');
    linkToggleAuth.innerText = I18n.t('authToggleToRegister');
  } else {
    authTitle.innerText = I18n.t('authTitleRegister');
    authSubtitle.innerText = I18n.t('authSubtitleRegister');
    btnAuthSubmit.innerText = I18n.t('authSubmitRegister');
    linkToggleAuth.innerText = I18n.t('authToggleToLogin');
  }
}

linkToggleAuth.addEventListener('click', (e) => {
  e.preventDefault();
  authMode = authMode === 'login' ? 'register' : 'login';
  renderAuthStrings();
});

btnAuthSubmit.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) return;

  // Persist chosen age tier for this device's sessions
  State.ageTier = authAgeTier.value === 'teen' ? 'teen' : 'junior';
  localStorage.setItem('agy-age-tier', State.ageTier);

  DomRenderer.log(`[System] Authenticating user: ${email}...`, 'system');
  try {
    let session;
    if (authMode === 'login') {
      session = await Auth.signIn(email, password);
    } else {
      session = await Auth.signUp(email, password);
    }
    State.session = session;

    // Cache session locally for PowerShell 1-week TTL auto-login
    const username = email.split('@')[0].toLowerCase();
    const userPin = State.config?.parent?.pin || "1234";
    const cacheData = {
      username: username,
      pin: userPin,
      createdAt: Date.now(),
      firebaseSession: session
    };
    localStorage.setItem(`agy-session-user-${username}`, JSON.stringify(cacheData));

    await loadAuthenticatedSession();
  } catch (err) {
    const friendly = friendlyAuthError(err);
    alert(friendly);
    DomRenderer.log(`[Auth Error] ${friendly}`, 'error');
  }
});

btnSignout.addEventListener('click', () => {
  Auth.signOut();
  State.session = null;
  State.parentUnlocked = false;
  State.adminPin = '';
  authOverlay.style.display = 'flex';
  mainLayout.style.display = 'none';
  tabBtnParent.style.display = 'none';
  tabBtnVisual.click();
});

async function loadAuthenticatedSession() {
  authOverlay.style.display = 'none';
  mainLayout.style.display = 'grid';
  userBadgeEmail.innerText = State.session.email;
  if (ageTierSelect) ageTierSelect.value = State.ageTier;
  tabBtnParent.style.display = 'inline-block'; // Reveal Parent Console link tab
  DomRenderer.setMascot('idle', `Hello Cadet!`, 'Select a working folder and type a question to Agy!');
  DomRenderer.log(`[System] Signed in as ${State.session.email}`, 'system');

  // Skip Firebase DB profile load if this is the bootstrap parent-setup session
  if (State.session.uid === 'parent-setup') {
    document.getElementById('godmode-section').style.display = 'block';
    return;
  }

  // Load personalized user settings overrides from Firebase
  try {
    const userSettings = await Db.get(`users/${State.session.uid}/settings`, State.session.idToken);
    if (userSettings) {
      State.config = deepMerge(State.config, userSettings);
      ThemeEngine.applyTheme(State.config.theme);
      ThemeEngine.applyLayout(State.config.layout);
      SpeechAdapter.init(State.config.speech);
      DomRenderer.log('[System] Personalized cadet settings loaded.', 'system');
    }
  } catch (e) {
    console.warn("Could not load user overrides, falling back to master:", e.message);
  }

  // Reveal reset panel: everyone when security is OFF, master email only when ON
  const masterEmail = State.config?.parent?.masterGatedEmail || 'arh.homelab@gmail.com';
  if (!securityOn() || State.session.email.toLowerCase() === masterEmail.toLowerCase()) {
    document.getElementById('godmode-section').style.display = 'block';
  } else {
    document.getElementById('godmode-section').style.display = 'none';
  }
}

const DomRenderer = {
  setMascot(state, bubbleTitle, bubbleText) {
    mascot.className = 'mascot-avatar ' + state;
    if (state === 'idle') mascot.innerText = '🤖';
    if (state === 'thinking') mascot.innerText = '🧠';
    if (state === 'success') mascot.innerText = '🎉';
    if (state === 'error') mascot.innerText = '⚠️';

    if (bubbleTitle) mascotBubbleTitle.innerText = bubbleTitle;
    if (bubbleText) mascotBubbleText.innerText = bubbleText;
  },

  log(text, className = '') {
    const msg = document.createElement('div');
    msg.className = `log-message ${className}`;
    msg.innerText = text;
    consoleOutput.appendChild(msg);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    return msg;
  },

  clearLog() {
    consoleOutput.innerHTML = '';
    DomRenderer.log('Console cleared. Ready!', 'system');
  },

  renderPlaceholder() {
    visualBoard.innerHTML = `
      <div class="visual-placeholder">
        <div class="placeholder-icon">🚀</div>
        <h3>Ready for Launch!</h3>
        <p>Agy will show counting grids, quiz choices, and stories in this window when you start asking questions.</p>
      </div>
    `;
  }
};

async function verifyPinRemote(pin) {
  try {
    const res = await fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    return { ok: data.ok === true, error: data.error || '' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const ThemeEngine = {
  async init() {
    try {
      const res = await fetch('/api/config');
      const config = await res.json();
      State.config = config;

      this.applyTheme(config.theme);
      this.applyLayout(config.layout);

      SpeechAdapter.init(config.speech);

      // CLI availability / demo mode advisory (non-blocking)
      if (config.mockMode) {
        DomRenderer.log(`[System] ${I18n.t('mockModeOn')}`, 'system');
      } else if (config.cliAvailable === false) {
        DomRenderer.log(`[System] ${I18n.t('cliMissing')}`, 'system');
      }

      // Check for PowerShell / url auto-login parameters
      const urlParams = new URLSearchParams(window.location.search);
      const autologin = urlParams.get('autologin');
      const pin = urlParams.get('pin');
      const portal = urlParams.get('portal');

      // Parent Dev Gate Shortcut / Login
      if (portal === 'parent') {
        if (pin && securityOn()) {
          const result = await verifyPinRemote(pin);
          if (result.ok) {
            State.adminPin = pin;
            const session = await Auth.currentSession();
            if (session && session.email.toLowerCase() === (config?.parent?.masterGatedEmail || 'arh.homelab@gmail.com').toLowerCase()) {
              State.session = session;
              State.parentUnlocked = true;
              await loadAuthenticatedSession();
              tabBtnParent.click(); // Open Dev Console
              return;
            }
          }
        }
        // Security OFF: auto-enter. Security ON without valid pin: show the PIN modal.
        openParentPinGate();
        return;
      }

      // Kids PWSH Alias Auto-Login (with 1-week TTL verification)
      if (autologin && pin) {
        const cachedSessionRaw = localStorage.getItem(`agy-session-user-${autologin.toLowerCase()}`);
        if (cachedSessionRaw) {
          const cached = JSON.parse(cachedSessionRaw);
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
          let pinOk = pin === cached.pin;
          if (securityOn()) {
            const result = await verifyPinRemote(pin);
            pinOk = result.ok;
            if (pinOk) State.adminPin = pin;
          }
          if (Date.now() - cached.createdAt < oneWeekMs && pinOk) {
            State.session = cached.firebaseSession;
            // Write back to main session storage to re-verify token
            localStorage.setItem("agy-terminal-session-v1", JSON.stringify(cached.firebaseSession));
            await loadAuthenticatedSession();
            DomRenderer.log(`[System] Signed in automatically (cached login).`, 'system');
            return;
          }
        }
      }

      // Default session recovery
      const session = await Auth.currentSession();
      if (session) {
        State.session = session;
        await loadAuthenticatedSession();
      } else {
        authOverlay.style.display = 'flex';
      }
    } catch (err) {
      console.error('Could not load configuration:', err.message);
    }
  },

  applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;

    const mappings = {
      colorBackground: '--bg',
      colorPaper: '--paper',
      colorSurface: '--surface',
      colorInk: '--ink',
      colorMuted: '--muted',
      colorBrand: '--brand',
      colorAccent: '--accent',
      colorWarm: '--warm',
      colorConsoleBackground: '--console-bg',
      colorConsoleText: '--console-text',
      fontSizeBody: '--font-size-body',
      fontSizeConsole: '--font-size-console',
      fontFamilyBody: '--fb',
      fontFamilyHeading: '--fd'
    };

    Object.keys(mappings).forEach(key => {
      if (theme[key]) {
        root.style.setProperty(mappings[key], theme[key]);
      }
    });
  },

  applyLayout(layout) {
    if (!layout) return;
    const appLayout = document.querySelector('.app-layout');

    if (appLayout && layout.paneRatio) {
      const parts = layout.paneRatio.split('/');
      if (parts.length === 2) {
        appLayout.style.gridTemplateColumns = `${parts[0]}fr auto ${parts[1]}fr`;
      }
    }

    if (layout.showMascot === false) {
      document.querySelector('.mascot-header').style.display = 'none';
    }
    if (layout.showQuickCards === false) {
      document.querySelector('.cards-section').style.display = 'none';
    }

    if (layout.allowResize !== false) {
      this.setupSplitterDrag(appLayout);
    }
  },

  setupSplitterDrag(container) {
    const leftPanel = document.querySelector('.control-panel');
    const splitter = document.createElement('div');
    splitter.className = 'layout-splitter';
    container.insertBefore(splitter, leftPanel.nextSibling);

    let isDragging = false;

    splitter.addEventListener('mousedown', (e) => {
      isDragging = true;
      splitter.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const containerWidth = container.clientWidth;
      const mouseX = e.clientX - container.getBoundingClientRect().left;

      let percentage = (mouseX / containerWidth) * 100;
      if (percentage < 25) percentage = 25;
      if (percentage > 75) percentage = 75;

      container.style.gridTemplateColumns = `${percentage}% auto ${100 - percentage}%`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        splitter.classList.remove('dragging');
        document.body.style.cursor = 'default';
      }
    });
  }
};

const TranslationAdapter = {
  async translate(text, fromLang, toLang) {
    if (!text || fromLang === toLang) return text;
    try {
      const queryParams = new URLSearchParams({ text, from: fromLang, to: toLang });
      const res = await fetch(`/api/translate?${queryParams.toString()}`);
      const data = await res.json();
      return data.success ? data.translation : text;
    } catch (e) {
      console.error('[Translation] Error translating text:', e);
      return text;
    }
  }
};

const SpeechAdapter = {
  recognition: null,
  currentUtterance: null,
  speechConfig: null,

  init(speechConfig) {
    this.speechConfig = speechConfig || {
      speechToText: { inputLanguage: 'en-US', targetLanguage: 'en-US', translationEnabled: false },
      textToSpeech: { inputLanguage: 'en-US', targetLanguage: 'en-US', translationEnabled: false }
    };

    const stt = this.speechConfig.speechToText;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechObj();
      this.recognition.continuous = false;
      this.recognition.lang = stt.inputLanguage || 'en-US';

      this.recognition.onstart = () => {
        State.isRecording = true;
        btnMic.classList.add('recording');
        btnMic.innerText = '🔴';
        DomRenderer.setMascot('thinking', 'Listening...', 'Tell Agy what you want in your native language!');
      };

      this.recognition.onresult = async (event) => {
        const speechResult = event.results[0][0].transcript;

        if (stt.translationEnabled && stt.inputLanguage !== stt.targetLanguage) {
          DomRenderer.setMascot('thinking', 'Translating voice...', 'Translating what you said to English...');
          const translated = await TranslationAdapter.translate(speechResult, stt.inputLanguage, stt.targetLanguage);
          promptInput.value = translated;
        } else {
          promptInput.value = speechResult;
        }
      };

      this.recognition.onend = () => {
        State.isRecording = false;
        btnMic.classList.remove('recording');
        btnMic.innerText = '🎤';
        DomRenderer.setMascot('idle', 'Speech Connected!', 'Your speech is ready! Press Go!');
      };

      this.recognition.onerror = () => {
        State.isRecording = false;
        btnMic.classList.remove('recording');
        btnMic.innerText = '🎤';
        DomRenderer.setMascot('error', 'Speech Error', 'I did not catch that. Let\'s try typing or speak again.');
      };
    } else {
      btnMic.style.display = 'none';
    }
  },

  toggleDictation() {
    if (!this.recognition) return;
    if (State.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  },

  speak(text, locale, onStart, onEnd) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    this.currentUtterance = new SpeechSynthesisUtterance(text);

    const tts = this.speechConfig?.textToSpeech || {};
    this.currentUtterance.rate = tts.voiceRate || 0.95;
    this.currentUtterance.pitch = tts.voicePitch || 1.0;

    const targetLocale = locale || tts.targetLanguage || 'en-US';
    this.currentUtterance.lang = targetLocale;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(targetLocale) || v.lang.startsWith(targetLocale.split('-')[0]));
    if (matchingVoice) {
      this.currentUtterance.voice = matchingVoice;
    }

    this.currentUtterance.onstart = onStart;
    this.currentUtterance.onend = onEnd;

    window.speechSynthesis.speak(this.currentUtterance);
  },

  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};

const NetworkAdapter = {
  async selectPath(type) {
    const res = await fetch(`/api/select-path?type=${type}`);
    return await res.json();
  },

  runStream({ prompt, directory, persona, ageTier, approvedLogId }, { onStdout, onStderr, onDone, onError }) {
    const queryParams = new URLSearchParams({
      prompt,
      directory: directory || '',
      persona,
      ageTier: ageTier || 'junior'
    });
    if (approvedLogId) queryParams.set('approvedLogId', approvedLogId);

    const eventSource = new EventSource(`/api/run-agy?${queryParams.toString()}`);
    let finished = false;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'stdout') onStdout(data.text);
      else if (data.type === 'stderr') onStderr(data.text);
      else if (data.type === 'done') {
        finished = true;
        eventSource.close();
        onDone(data.code);
      } else if (data.type === 'error') {
        finished = true;
        eventSource.close();
        onError(data.message);
      }
    };

    eventSource.onerror = () => {
      if (finished) return;
      finished = true;
      eventSource.close();
      onError(I18n.t('errStream'));
    };

    return eventSource;
  }
};

// ============================================================================
// WIDGET RENDERERS (Adapting parsed YAML to UI DOM components)
// ============================================================================

const WidgetRenderer = {
  render(data) {
    visualBoard.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'module-container';

    if (data.type === 'dots-grid') {
      this.dotsGrid(data, container);
    } else if (data.type === 'quiz') {
      this.quiz(data, container);
    } else if (data.type === 'story-scene') {
      this.storyScene(data, container);
    } else if (data.type === 'step-by-step') {
      this.stepByStep(data, container);
    } else {
      DomRenderer.renderPlaceholder();
      return;
    }

    visualBoard.appendChild(container);
  },

  dotsGrid(data, container) {
    const title = document.createElement('h3');
    title.className = 'module-title';
    title.innerText = data.title || 'Let\'s count!';
    container.appendChild(title);

    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'dots-grid-wrapper';

    const cols = data.cols || 5;
    const rows = data.rows || 5;
    const symbol = data.symbol || State.config?.engine?.defaultSymbol || '⭐';
    const color = data.color || State.config?.engine?.defaultSymbolColor || 'gold';

    gridWrapper.style.gridTemplateColumns = `repeat(${cols}, 44px)`;

    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        count++;
        const currentVal = count;
        const dot = document.createElement('div');
        dot.className = 'grid-dot';
        dot.innerText = symbol;

        dot.addEventListener('click', () => {
          dot.classList.add('active');
          dot.style.backgroundColor = getSymbolColorHex(color);
          dot.innerText = currentVal;

          SpeechAdapter.speak(currentVal.toString());

          if (currentVal === rows * cols) {
            confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0.5 } });
          }
        });

        gridWrapper.appendChild(dot);
      }
    }
    container.appendChild(gridWrapper);

    const sub = document.createElement('p');
    sub.className = 'muted';
    sub.style.textAlign = 'center';
    sub.innerText = `Grid: ${rows} x ${cols} = ${rows * cols}. Click dots to count!`;
    container.appendChild(sub);
  },

  quiz(data, container) {
    const title = document.createElement('h3');
    title.className = 'module-title';
    title.innerText = data.question || 'Quiz!';
    container.appendChild(title);

    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'quiz-options';

    const feedbackHolder = document.createElement('div');
    feedbackHolder.className = 'quiz-feedback';
    feedbackHolder.style.display = 'none';

    const options = [];
    Object.keys(data).forEach(k => {
      if (k.startsWith('option_')) {
        const match = k.match(/option_(\d+)_(\w+)/);
        if (match) {
          const idx = parseInt(match[1]) - 1;
          const prop = match[2];
          if (!options[idx]) options[idx] = {};
          options[idx][prop] = data[k];
        }
      }
    });

    if (options.length === 0 && Array.isArray(data.options)) {
      data.options.forEach((optStr) => {
        const isCorrect = optStr.toLowerCase().includes('(correct)');
        const text = optStr.replace(/\(correct\)/i, '').trim();
        options.push({ text, correct: isCorrect, feedback: isCorrect ? 'Great Job!' : 'Almost! Try again.' });
      });
    }

    if (options.length === 0) {
      options.push({ text: 'Yes', correct: true, feedback: 'Correct!' });
      options.push({ text: 'No', correct: false, feedback: 'Incorrect!' });
    }

    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.innerText = opt.text;

      btn.addEventListener('click', () => {
        optionsWrapper.querySelectorAll('.quiz-option').forEach(b => {
          b.disabled = true;
          b.classList.remove('correct', 'wrong');
        });

        if (opt.correct) {
          btn.classList.add('correct');
          feedbackHolder.innerText = `🎉 Correct! ${opt.feedback || ''}`;
          feedbackHolder.style.borderColor = '#34d399';
          SpeechAdapter.speak('Correct! Great job!');
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } else {
          btn.classList.add('wrong');
          feedbackHolder.innerText = `💡 Try Again! ${opt.feedback || ''}`;
          feedbackHolder.style.borderColor = '#f87171';
          SpeechAdapter.speak('Almost! Try again.');

          setTimeout(() => {
            optionsWrapper.querySelectorAll('.quiz-option').forEach(b => {
              b.disabled = false;
              b.classList.remove('correct', 'wrong');
            });
          }, 2000);
        }
        feedbackHolder.style.display = 'block';
      });
      optionsWrapper.appendChild(btn);
    });

    container.appendChild(optionsWrapper);
    container.appendChild(feedbackHolder);
  },

  storyScene(data, container) {
    const textCard = document.createElement('div');
    textCard.className = 'story-text';
    textCard.innerText = data.text || 'Adventure story scene...';
    container.appendChild(textCard);

    const choicesWrapper = document.createElement('div');
    choicesWrapper.className = 'story-choices';

    const choices = [];
    Object.keys(data).forEach(k => {
      if (k.startsWith('choice_')) {
        const match = k.match(/choice_(\d+)_(\w+)/);
        if (match) {
          const idx = parseInt(match[1]) - 1;
          const prop = match[2];
          if (!choices[idx]) choices[idx] = {};
          choices[idx][prop] = data[k];
        }
      }
    });

    if (choices.length === 0 && Array.isArray(data.choices)) {
      data.choices.forEach(chStr => {
        choices.push({ text: chStr, action: `Choose path: ${chStr}` });
      });
    }

    if (choices.length === 0) {
      choices.push({ text: 'Continue Story', action: 'Tell me what happens next!' });
    }

    choices.forEach(ch => {
      if (!ch.text) return;
      const btn = document.createElement('button');
      btn.className = 'story-choice-btn';
      btn.innerText = `👉 ${ch.text}`;
      btn.addEventListener('click', () => {
        promptInput.value = ch.action || ch.text;
        runAgent(ch.action || ch.text);
      });
      choicesWrapper.appendChild(btn);
    });
    container.appendChild(choicesWrapper);
  },

  stepByStep(data, container) {
    const title = document.createElement('h3');
    title.className = 'module-title';
    title.innerText = data.title || 'Steps to follow:';
    container.appendChild(title);

    const list = document.createElement('div');
    list.className = 'steps-list';

    let steps = data.steps || [];
    if (!Array.isArray(steps)) {
      steps = [];
      Object.keys(data).forEach(k => {
        if (k.startsWith('step_')) steps.push(data[k]);
      });
    }

    steps.forEach((stepText, idx) => {
      const item = document.createElement('div');
      item.className = 'step-item';

      const num = document.createElement('div');
      num.className = 'step-number';
      num.innerText = idx + 1;
      item.appendChild(num);

      const txt = document.createElement('div');
      txt.className = 'step-text';
      txt.innerText = stepText;
      item.appendChild(txt);

      item.addEventListener('click', () => {
        item.style.opacity = item.style.opacity === '0.5' ? '1' : '0.5';
        item.style.textDecoration = item.style.textDecoration === 'line-through' ? 'none' : 'line-through';
        SpeechAdapter.speak('Checked!');
      });

      list.appendChild(item);
    });
    container.appendChild(list);
  }
};

function getSymbolColorHex(color) {
  const map = {
    gold: '#fbbf24',
    red: '#f87171',
    blue: '#60a5fa',
    green: '#34d399',
    purple: '#c084fc',
    orange: '#fb923c'
  };
  return map[color.toLowerCase()] || '#2f7b67';
}

// ============================================================================
// SYSTEM ORCHESTRATION & EVENT BINDINGS
// ============================================================================

function setStopButtonVisible(visible) {
  btnStop.style.display = visible ? 'inline-block' : 'none';
  btnSend.style.display = visible ? 'none' : 'inline-block';
}

function stopCurrentStream() {
  if (State.currentStream) {
    State.currentStream.close(); // server kills the spawned CLI on disconnect
    State.currentStream = null;
  }
  setStopButtonVisible(false);
}

btnStop.addEventListener('click', () => {
  stopCurrentStream();
  DomRenderer.setMascot('idle', 'Stopped!', 'Agy stopped working. Ask something else!');
  DomRenderer.log('[System] Stopped by user.', 'system');
});

async function runAgent(promptText) {
  if (!promptText.trim()) return;

  // 1. Guardrail restriction check (Gated Approval flow) — only when security is ON.
  //    When OFF, restricted words are simply logged and the prompt runs through.
  const isGated = SecurityScanner.isRestricted(promptText, State.config?.parent?.gatedKeywords);
  if (isGated) {
    if (securityOn()) {
      handleGatedPrompt(promptText);
      return;
    }
    DomRenderer.log(`[Security OFF] Restricted word detected (logging only): "${promptText}"`, 'system');
  }

  // 2. Normal execution loop
  streamAgent(promptText, {});
}

// Shared streaming runner for normal and parent-approved prompts
function streamAgent(promptText, { approvedLogId }) {
  stopCurrentStream();
  consoleOutput.innerHTML = '';
  State.lastAgentResponseText = '';
  btnReadAloud.disabled = true;
  SpeechAdapter.stopSpeaking();

  DomRenderer.setMascot('thinking', 'Agy is working...', 'I am checking with the space agents. Hold on!');
  DomRenderer.log(`[Prompt] ${promptText}`, 'system');

  // Loading indicator — first byte from agy can take many seconds
  const thinkingMsg = DomRenderer.log(I18n.t('agyThinking'), 'system agy-loading');
  let firstByte = true;

  const currentLog = document.createElement('div');
  currentLog.className = 'log-message';
  consoleOutput.appendChild(currentLog);

  const persona = State.config?.engine?.persona || 'socratic_teacher';

  State.currentStream = NetworkAdapter.runStream(
    {
      prompt: promptText,
      directory: State.selectedDirectory,
      persona,
      ageTier: State.ageTier,
      approvedLogId
    },
    {
      onStdout: (text) => {
        if (firstByte) {
          firstByte = false;
          thinkingMsg.remove();
        }
        currentLog.innerText += text;
        State.lastAgentResponseText += text;
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      },
      onStderr: (errText) => {
        if (firstByte) {
          firstByte = false;
          thinkingMsg.remove();
        }
        DomRenderer.log(`Step: ${errText.trim()}`, 'stderr');
      },
      onDone: async (code) => {
        thinkingMsg.remove();
        setStopButtonVisible(false);
        State.currentStream = null;
        DomRenderer.setMascot('success', 'Task Done!', 'Woohoo! We got the answers! Check the visual panel on the right!');
        btnReadAloud.disabled = false;

        const yamlRegex = /```yaml\s*([\s\S]*?)```/g;
        const match = yamlRegex.exec(State.lastAgentResponseText);
        if (match && match[1]) {
          const parsed = YamlParser.parse(match[1]);
          WidgetRenderer.render(parsed);
        } else {
          DomRenderer.renderPlaceholder();
        }

        if (approvedLogId) {
          // Update the existing pending log to completed in Firebase DB
          const artifacts = ArtifactExtractor.extract(State.lastAgentResponseText);
          const updateData = {
            response: State.lastAgentResponseText,
            status: 'completed',
            artifacts: artifacts,
            timestamp: Date.now()
          };
          await Db.update(`logs/${approvedLogId}`, State.session.idToken, updateData);
        } else {
          // Log complete Cadet activity to Firebase Realtime Database
          await pushActivityLog(promptText, State.lastAgentResponseText, 'completed');
        }
      },
      onError: (errMsg) => {
        thinkingMsg.remove();
        setStopButtonVisible(false);
        State.currentStream = null;
        DomRenderer.setMascot('error', 'Error occurred', 'Something went wrong running Agy.');
        DomRenderer.log(`[Error] ${errMsg}`, 'error');
      }
    }
  );
  setStopButtonVisible(true);
}

// Gated Approvals logic
async function handleGatedPrompt(promptText) {
  DomRenderer.clearLog();
  DomRenderer.setMascot('error', 'Approval Needed!', 'Agy detected a restricted word. I sent a request to your parents\' phone!');
  DomRenderer.log(`[Warning] Restricted query blocked: "${promptText}"`, 'error');

  // Kid-friendly waiting state with a Cancel button
  const waitingMsg = DomRenderer.log(`${I18n.t('gatedWaiting')} `, 'system');
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-danger btn-ghost';
  cancelBtn.style.marginLeft = '8px';
  cancelBtn.innerText = I18n.t('btnCancelWait');
  waitingMsg.appendChild(cancelBtn);

  let pollInterval = null;
  let timeoutId = null;
  let settled = false;

  const settle = (fn) => {
    if (settled) return;
    settled = true;
    if (pollInterval) clearInterval(pollInterval);
    if (timeoutId) clearTimeout(timeoutId);
    fn();
  };

  cancelBtn.addEventListener('click', () => {
    settle(() => {
      DomRenderer.setMascot('idle', 'Cancelled', 'No problem! Let\'s ask something else.');
      DomRenderer.log(I18n.t('gatedCancelled'), 'system');
    });
  });

  // 5-minute timeout — stops the infinite 3s polling
  timeoutId = setTimeout(() => {
    settle(() => {
      DomRenderer.setMascot('idle', 'Still waiting...', 'Maybe your parents are busy right now.');
      DomRenderer.log(I18n.t('gatedTimeout'), 'system');
    });
  }, 5 * 60 * 1000);

  // Trigger POST notification to phone (IP 100.85.170.170)
  try {
    await fetch(`/api/notify-gated?email=${encodeURIComponent(State.session.email)}&prompt=${encodeURIComponent(promptText)}`);
  } catch (err) {
    console.warn('Failed to notify parent phone:', err.message);
  }

  // Push pending record to Firebase
  const logId = await pushActivityLog(promptText, 'Pending parent approval...', 'pending_approval');

  if (!logId) {
    settle(() => {
      DomRenderer.log('[System] Could not reach the approval system. Ask a parent to check the setup.', 'error');
    });
    return;
  }

  // Poll database every 3 seconds to check for parent approval status
  pollInterval = setInterval(async () => {
    try {
      const record = await Db.get(`logs/${logId}`, State.session.idToken);
      if (!record) return;

      if (record.status === 'approved') {
        settle(() => {
          DomRenderer.log(`[System] ${I18n.t('gatedApproved')}`, 'system');
          // Re-run with the approved log id (server re-checks gated keywords when security is ON)
          streamAgent(promptText, { approvedLogId: logId });
        });
      } else if (record.status === 'denied') {
        settle(() => {
          DomRenderer.setMascot('error', 'Request Denied', I18n.t('gatedDenied'));
          DomRenderer.log(`[Denied] Restricted query was explicitly rejected by parent.`, 'error');
        });
      }
    } catch (e) {
      console.error('Error polling approvals:', e.message);
    }
  }, 3000);
}

// Firebase log syncing
async function pushActivityLog(prompt, response, status) {
  if (!State.session || State.session.uid === 'parent-setup') return null;

  // Extract artifacts/file outputs from response text
  const artifacts = ArtifactExtractor.extract(response);

  const logData = {
    email: State.session.email,
    uid: State.session.uid,
    prompt: prompt,
    response: response,
    status: status,
    artifacts: artifacts,
    timestamp: Date.now()
  };

  try {
    const logId = await Db.push(`logs`, State.session.idToken, logData);
    return logId;
  } catch (err) {
    console.error('Failed to push log to Firebase:', err.message);
    return null;
  }
}

// Event Bindings
btnSend.addEventListener('click', () => {
  const val = promptInput.value;
  promptInput.value = '';
  runAgent(val);
});

promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const val = promptInput.value;
    promptInput.value = '';
    runAgent(val);
  }
});

if (ageTierSelect) {
  ageTierSelect.addEventListener('change', () => {
    State.ageTier = ageTierSelect.value === 'teen' ? 'teen' : 'junior';
    localStorage.setItem('agy-age-tier', State.ageTier);
    if (authAgeTier) authAgeTier.value = State.ageTier;
  });
}

btnPickFolder.addEventListener('click', async () => {
  DomRenderer.setMascot('thinking', 'Opening Folder Box...', 'Pick a folder on your computer to work in!');
  try {
    const data = await NetworkAdapter.selectPath('folder');
    if (data.success) {
      State.selectedDirectory = data.path;
      const parts = State.selectedDirectory.split(/[\\/]/);
      const folderName = parts[parts.length - 1] || State.selectedDirectory;
      currentFolderSpan.innerText = folderName;
      currentFolderSpan.title = State.selectedDirectory;
      DomRenderer.setMascot('idle', 'Folder Connected!', `Awesome! We are now working inside: "${folderName}".`);
      DomRenderer.log(`[System] Connected workspace: ${State.selectedDirectory}`, 'system');
    } else {
      DomRenderer.setMascot('idle', 'Cancelled', 'No folder was chosen.');
    }
  } catch (err) {
    DomRenderer.setMascot('error', 'Oops!', 'Could not open the folder browser.');
    DomRenderer.log(`[Error] ${err.message}`, 'error');
  }
});

btnPickFile.addEventListener('click', async () => {
  DomRenderer.setMascot('thinking', 'Opening File Box...', 'Select a code file or script!');
  try {
    const data = await NetworkAdapter.selectPath('file');
    if (data.success) {
      State.selectedFile = data.path;
      const parts = State.selectedFile.split(/[\\/]/);
      const fileName = parts[parts.length - 1] || State.selectedFile;
      DomRenderer.setMascot('idle', 'File Chosen!', `You picked the file "${fileName}". Now we can explain it or check for mistakes!`);
      DomRenderer.log(`[System] Selected file: ${State.selectedFile}`, 'system');
    } else {
      DomRenderer.setMascot('idle', 'Cancelled', 'No file was selected.');
    }
  } catch (err) {
    DomRenderer.setMascot('error', 'Oops!', 'Could not open the file browser.');
    DomRenderer.log(`[Error] ${err.message}`, 'error');
  }
});

document.querySelectorAll('.play-card').forEach(card => {
  card.addEventListener('click', () => {
    const action = card.dataset.action;
    if ((action === 'explain' || action === 'fix') && !State.selectedFile) {
      DomRenderer.setMascot('error', 'Select a file first!', 'Please click "Pick File" above to choose the file you want to inspect!');
      return;
    }

    let prompt = '';
    if (action === 'explain') prompt = PromptConstructor.explain(State.selectedFile);
    else if (action === 'fix') prompt = PromptConstructor.fixMistakes(State.selectedFile);
    else if (action === 'game') prompt = PromptConstructor.makeGame();
    else if (action === 'story') prompt = PromptConstructor.tellStory();

    runAgent(prompt);
  });
});

btnClearConsole.addEventListener('click', () => {
  DomRenderer.clearLog();
  State.lastAgentResponseText = '';
  btnReadAloud.disabled = true;
  SpeechAdapter.stopSpeaking();
});

btnReadAloud.addEventListener('click', async () => {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    SpeechAdapter.stopSpeaking();
    btnReadAloud.innerText = I18n.t('btnReadAloud');
    return;
  }

  const cleanText = State.lastAgentResponseText
    .replace(/```[a-z]*[\s\S]*?```/g, '') // strip yaml code blocks
    .trim();

  if (!cleanText) return;

  const tts = State.config?.speech?.textToSpeech || {};
  let textToRead = cleanText;

  if (tts.translationEnabled && tts.inputLanguage !== tts.targetLanguage) {
    DomRenderer.setMascot('thinking', 'Translating speech...', 'Translating reply for Text-to-Speech...');
    textToRead = await TranslationAdapter.translate(cleanText, tts.inputLanguage, tts.targetLanguage);
    DomRenderer.setMascot('success', 'Ready to Read!', 'Check the translation speech output!');
  }

  SpeechAdapter.speak(
    textToRead,
    tts.targetLanguage || 'en-US',
    () => btnReadAloud.innerText = '⏹️ Stop',
    () => btnReadAloud.innerText = I18n.t('btnReadAloud')
  );
});

// Drag and drop handler
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    DomRenderer.setMascot('idle', 'Item Dropped!', `You dropped "${files[0].name}"! Click "Pick Folder" or "Pick File" to connect its path for Agy!`);
    DomRenderer.log(`[System] Dropped item: ${files[0].name} (${files[0].size} bytes)`, 'system');
  }
});

btnMic.addEventListener('click', () => {
  SpeechAdapter.toggleDictation();
});

// ============================================================================
// TAB NAVIGATION & PARENT PORTAL CONTROLS
// ============================================================================

tabBtnVisual.addEventListener('click', () => {
  tabBtnVisual.classList.add('active');
  tabBtnParent.classList.remove('active');
  tabContentVisual.style.display = 'block';
  tabContentParent.style.display = 'none';
});

tabBtnParent.addEventListener('click', () => {
  if (State.parentUnlocked) {
    tabBtnParent.classList.add('active');
    tabBtnVisual.classList.remove('active');
    tabContentVisual.style.display = 'none';
    tabContentParent.style.display = 'block';
  } else {
    openParentPinGate();
  }
});

btnOpenParentPortal.addEventListener('click', () => {
  if (State.parentUnlocked) {
    tabBtnParent.click();
  } else {
    openParentPinGate();
  }
});

linkAuthParentPortal.addEventListener('click', (e) => {
  e.preventDefault();
  if (State.parentUnlocked) {
    tabBtnParent.click();
  } else {
    openParentPinGate();
  }
});

function openParentPinGate() {
  // Security OFF: parent portal opens without a PIN (auto-enter)
  if (!securityOn()) {
    unlockParentConsole('');
    return;
  }
  parentPinModal.style.display = 'flex';
  parentPinInput.value = '';
  parentPinInput.focus();
}

async function unlockParentConsole(enteredPin) {
  parentPinModal.style.display = 'none';
  State.parentUnlocked = true;
  State.adminPin = enteredPin;

  const parentConfig = State.config?.parent || {};

  // Check if parent setup bypass is needed (i.e. user is currently unauthenticated)
  if (!State.session) {
    State.session = {
      email: parentConfig.masterGatedEmail || 'arh.homelab@gmail.com',
      uid: 'parent-setup',
      idToken: 'parent-setup-dummy-token'
    };
    await loadAuthenticatedSession();
    tabBtnParent.click(); // Open parent console settings directly
    openParentSection('settings');
    DomRenderer.setMascot('thinking', I18n.t('setupUnlockedTitle'), I18n.t('setupUnlockedText'));
    return;
  }

  // Unlock parent tab navigation standard flow
  tabBtnParent.classList.add('active');
  tabBtnVisual.classList.remove('active');
  tabContentVisual.style.display = 'none';
  tabContentParent.style.display = 'block';

  openParentSection('logs');
}

btnPinCancel.addEventListener('click', () => {
  parentPinModal.style.display = 'none';
});

btnPinSubmit.addEventListener('click', () => {
  verifyParentPin();
});

parentPinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    verifyParentPin();
  }
});

async function verifyParentPin() {
  const enteredPin = parentPinInput.value;

  if (!securityOn()) {
    unlockParentConsole(enteredPin);
    return;
  }

  const result = await verifyPinRemote(enteredPin);
  if (result.ok) {
    unlockParentConsole(enteredPin);
  } else {
    alert(result.error || I18n.t('errIncorrectPin'));
    parentPinInput.value = '';
    parentPinInput.focus();
  }
}

// Parent subtabs
menuBtnLogs.addEventListener('click', () => openParentSection('logs'));
menuBtnApproval.addEventListener('click', () => openParentSection('approval'));
menuBtnSettings.addEventListener('click', () => openParentSection('settings'));

function openParentSection(secName) {
  menuBtnLogs.classList.remove('active');
  menuBtnApproval.classList.remove('active');
  menuBtnSettings.classList.remove('active');

  parentSecLogs.style.display = 'none';
  parentSecApproval.style.display = 'none';
  parentSecSettings.style.display = 'none';

  if (secName === 'logs') {
    menuBtnLogs.classList.add('active');
    parentSecLogs.style.display = 'flex';
    loadParentLogs();
  } else if (secName === 'approval') {
    menuBtnApproval.classList.add('active');
    parentSecApproval.style.display = 'flex';
    loadParentPendingApprovals();
  } else if (secName === 'settings') {
    menuBtnSettings.classList.add('active');
    parentSecSettings.style.display = 'flex';
    loadParentSettingsForm();
  }
}

// 1. Load activity logs from Firebase REST
async function loadParentLogs() {
  if (State.session.uid === 'parent-setup') {
    parentLogsList.innerHTML = '<p class="muted">Logs are unavailable in Offline Setup Mode. Please configure the Firebase API Key first.</p>';
    return;
  }

  parentLogsList.innerHTML = '<p class="muted">Loading Cadet logs from Firebase...</p>';
  try {
    const data = await Db.get('logs', State.session.idToken);
    parentLogsList.innerHTML = '';
    if (!data) {
      parentLogsList.innerHTML = '<p class="muted">No logs recorded yet.</p>';
      return;
    }

    // Sort logs descending by timestamp
    const sortedLogs = Object.entries(data)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.timestamp - a.timestamp);

    sortedLogs.forEach(log => {
      const card = document.createElement('div');
      card.className = 'log-card';

      const dateStr = new Date(log.timestamp).toLocaleString();
      const statusBadge = `<span class="status-badge ${log.status}">${log.status.replace('_', ' ')}</span>`;

      let artifactsHTML = '';
      if (log.artifacts && log.artifacts.length > 0) {
        artifactsHTML = `
          <div class="artifacts-holder">
            <strong>📁 Artifacts Produced:</strong>
            ${log.artifacts.map(a => `<div class="artifact-item"><span>${a.name}</span><a href="${a.path}" target="_blank">View File</a></div>`).join('')}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="header-info">
          <span class="cadet-email">${log.email}</span>
          <span>${dateStr}</span>
        </div>
        <div class="prompt-text">${log.prompt}</div>
        <div class="response-text">${log.response}</div>
        ${artifactsHTML}
        ${statusBadge}
      `;
      parentLogsList.appendChild(card);
    });
  } catch (err) {
    parentLogsList.innerHTML = `<p class="error">Failed to load logs: ${err.message}</p>`;
  }
}

// 2. Load pending approvals
async function loadParentPendingApprovals() {
  if (State.session.uid === 'parent-setup') {
    parentApprovalsList.innerHTML = '<p class="muted">Gated approvals are unavailable in Offline Setup Mode.</p>';
    return;
  }

  parentApprovalsList.innerHTML = '<p class="muted">Checking pending approvals...</p>';
  try {
    const data = await Db.get('logs', State.session.idToken);
    parentApprovalsList.innerHTML = '';
    if (!data) {
      parentApprovalsList.innerHTML = '<p class="muted">No pending approvals.</p>';
      return;
    }

    const pendings = Object.entries(data)
      .map(([id, val]) => ({ id, ...val }))
      .filter(log => log.status === 'pending_approval');

    if (pendings.length === 0) {
      parentApprovalsList.innerHTML = '<p class="muted">No pending approvals.</p>';
      return;
    }

    pendings.forEach(log => {
      const card = document.createElement('div');
      card.className = 'log-card approval-card';
      const dateStr = new Date(log.timestamp).toLocaleString();

      card.innerHTML = `
        <div class="header-info">
          <span class="cadet-email">${log.email}</span>
          <span>${dateStr}</span>
        </div>
        <div class="prompt-text">${log.prompt}</div>
        <div class="approval-buttons">
          <button class="btn btn-primary" onclick="approveGated('${log.id}', true)">✅ Approve & Run</button>
          <button class="btn btn-danger" onclick="approveGated('${log.id}', false)">❌ Reject</button>
        </div>
      `;
      parentApprovalsList.appendChild(card);
    });
  } catch (err) {
    parentApprovalsList.innerHTML = `<p class="error">Failed to load approvals: ${err.message}</p>`;
  }
}

// Global hook functions for approvals
window.approveGated = async function(logId, isApproved) {
  const status = isApproved ? 'approved' : 'denied';
  try {
    await Db.update(`logs/${logId}`, State.session.idToken, { status });
    loadParentPendingApprovals();
  } catch (e) {
    alert('Failed to update status: ' + e.message);
  }
};

// 3. Load settings form with config values
function loadParentSettingsForm() {
  const config = State.config;
  if (!config) return;

  // Visuals
  document.getElementById('set-color-bg').value = config.theme.colorBackground || '#f7f1e8';
  document.getElementById('set-color-paper').value = config.theme.colorPaper || '#fffaf2';
  document.getElementById('set-color-accent').value = config.theme.colorAccent || '#2f7b67';
  document.getElementById('set-color-console-bg').value = config.theme.colorConsoleBackground || '#1e2524';
  document.getElementById('set-color-console-text').value = config.theme.colorConsoleText || '#6ef0d2';
  document.getElementById('set-show-mascot').value = config.layout.showMascot !== false ? 'true' : 'false';

  // Localizations
  document.getElementById('set-stt-input').value = config.speech.speechToText.inputLanguage || 'ms-MY';
  document.getElementById('set-stt-target').value = config.speech.speechToText.targetLanguage || 'en-US';
  document.getElementById('set-tts-target').value = config.speech.textToSpeech.targetLanguage || 'ms-MY';
  document.getElementById('set-speech-translation').value = config.speech.speechToText.translationEnabled !== false ? 'true' : 'false';

  // Firebase bootstrap key (blank when it is still the placeholder)
  const apiKey = config.auth?.apiKey || '';
  document.getElementById('set-api-key').value = apiKey.startsWith('REPLACE_') ? '' : apiKey;

  // Security gate toggle
  document.getElementById('set-security-enabled').value = securityOn() ? 'true' : 'false';

  // Safeguards & Persona Presets — PIN is hidden when security is ON (blank = unchanged)
  document.getElementById('set-parent-pin').value = securityOn() ? '' : (config.parent.pin || '1234');
  document.getElementById('set-socratic-mode').value = config.engine.socraticMode !== false ? 'true' : 'false';
  document.getElementById('set-persona').value = config.engine.persona || 'socratic_teacher';
  document.getElementById('set-provider').value = config.engine.provider || 'mock';
}

// 4. Save settings back to config.json (Master Parent) or Firebase (Cadet Personal Profile)
btnSaveSettings.addEventListener('click', async () => {
  const config = State.config;
  if (!config) return;

  const apiKeyVal = document.getElementById('set-api-key').value.trim();
  const pinVal = document.getElementById('set-parent-pin').value.trim();

  // Read visual and functional updates
  const settingsOverride = {
    theme: {
      colorBackground: document.getElementById('set-color-bg').value,
      colorPaper: document.getElementById('set-color-paper').value,
      colorAccent: document.getElementById('set-color-accent').value,
      colorConsoleBackground: document.getElementById('set-color-console-bg').value,
      colorConsoleText: document.getElementById('set-color-console-text').value
    },
    layout: {
      showMascot: document.getElementById('set-show-mascot').value === 'true'
    },
    speech: {
      speechToText: {
        inputLanguage: document.getElementById('set-stt-input').value,
        targetLanguage: document.getElementById('set-stt-target').value,
        translationEnabled: document.getElementById('set-speech-translation').value === 'true'
      },
      textToSpeech: {
        targetLanguage: document.getElementById('set-tts-target').value,
        translationEnabled: document.getElementById('set-speech-translation').value === 'true'
      }
    },
    parent: {},
    security: {
      enabled: document.getElementById('set-security-enabled').value === 'true'
    },
    engine: {
      socraticMode: document.getElementById('set-socratic-mode').value === 'true',
      persona: document.getElementById('set-persona').value,
      provider: document.getElementById('set-provider').value.trim() || 'mock'
    }
  };

  // Only send secrets the parent actually typed (blank = keep current)
  if (pinVal) settingsOverride.parent.pin = pinVal;
  if (apiKeyVal) settingsOverride.auth = { apiKey: apiKeyVal };

  btnSaveSettings.disabled = true;
  btnSaveSettings.innerText = 'Saving...';
  try {
    const masterEmail = State.config?.parent?.masterGatedEmail || 'arh.homelab@gmail.com';
    const username = State.session.email.split('@')[0].toLowerCase();

    // Parent saves (including bootstrap setup saves).
    // When security is OFF every signed-in user may save the master config.
    if (!securityOn() || State.session.email.toLowerCase() === masterEmail.toLowerCase() || State.session.uid === 'parent-setup') {
      const updatedConfig = deepMerge(State.config, settingsOverride);
      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': State.adminPin || ''
        },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();
      if (data.success) {
        State.config = updatedConfig;
        alert(I18n.t('settingsSaved'));

        // If we were in temporary bootstrap setup mode, force reload so standard Auth works
        if (State.session.uid === 'parent-setup') {
          window.location.reload();
          return;
        }
      } else {
        throw new Error(data.error);
      }
    } else {
      // Cadet saves personalized settings override in Firebase Realtime Database
      await Db.set(`users/${State.session.uid}/settings`, State.session.idToken, settingsOverride);
      State.config = deepMerge(State.config, settingsOverride);
      alert(I18n.t('cadetSettingsSaved'));
    }

    // Update local alias cache PIN so pwsh commands continue matching their new PIN setting
    if (settingsOverride.parent.pin) {
      const cachedSessionRaw = localStorage.getItem(`agy-session-user-${username}`);
      if (cachedSessionRaw) {
        const cached = JSON.parse(cachedSessionRaw);
        cached.pin = settingsOverride.parent.pin;
        localStorage.setItem(`agy-session-user-${username}`, JSON.stringify(cached));
      }
    }

    ThemeEngine.applyTheme(State.config.theme);
    ThemeEngine.applyLayout(State.config.layout);
    SpeechAdapter.init(State.config.speech);
  } catch (err) {
    alert('Failed to save settings: ' + err.message);
  } finally {
    btnSaveSettings.disabled = false;
    btnSaveSettings.innerText = I18n.t('btnSave');
  }
});

// 5. Parent reset: Deletes all Cadet customized overrides from Firebase.
//    Server gates this behind the admin PIN when security is ON.
btnGodmodeReset.addEventListener('click', async () => {
  if (State.session.uid === 'parent-setup') {
    alert(I18n.t('godmodeOffline'));
    return;
  }

  const check = confirm(I18n.t('godmodeConfirm'));
  if (!check) return;

  btnGodmodeReset.disabled = true;
  btnGodmodeReset.innerText = 'Resetting...';

  try {
    // Server-side PIN gate (no-op when security is OFF)
    const gateRes = await fetch('/api/godmode-reset', {
      method: 'POST',
      headers: { 'x-admin-pin': State.adminPin || '' }
    });
    if (!gateRes.ok) {
      throw new Error(I18n.t('errIncorrectPin'));
    }

    const users = await Db.get('users', State.session.idToken);
    if (users) {
      for (let uid of Object.keys(users)) {
        if (users[uid].settings) {
          await Db.remove(`users/${uid}/settings`, State.session.idToken);
        }
      }
    }
    alert(I18n.t('godmodeDone'));
    window.location.reload();
  } catch (err) {
    alert('Failed to perform reset: ' + err.message);
  } finally {
    btnGodmodeReset.disabled = false;
    btnGodmodeReset.innerText = I18n.t('btnGodmode');
  }
});

// Language toggle buttons (auth screen + footer)
document.querySelectorAll('.btn-lang-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    I18n.setLang(I18n.lang === 'en' ? 'ms' : 'en');
  });
});

// Initialize age-tier controls from stored choice
if (authAgeTier) authAgeTier.value = State.ageTier;
if (ageTierSelect) ageTierSelect.value = State.ageTier;

// Initialize localized UI strings
I18n.applyStatic();
renderAuthStrings();
updateLangButtons();

// Initialize Settings
ThemeEngine.init();
