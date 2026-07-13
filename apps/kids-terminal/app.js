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
// I/O ADAPTERS (Side Effects & Native Browser/Server Communication)
// ============================================================================

// App Global State
const State = {
  selectedDirectory: '',
  selectedFile: '',
  isRecording: false,
  lastAgentResponseText: '',
  config: null,
  session: null
};

// DOM selectors
const authOverlay = document.getElementById('auth-overlay');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
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
const btnMic = document.getElementById('btn-mic');
const btnPickFolder = document.getElementById('btn-pick-folder');
const btnPickFile = document.getElementById('btn-pick-file');
const btnReadAloud = document.getElementById('btn-read-aloud');
const btnClearConsole = document.getElementById('btn-clear-console');
const visualBoard = document.getElementById('visual-board');

const userBadgeEmail = document.getElementById('user-badge-email');
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

linkToggleAuth.addEventListener('click', (e) => {
  e.preventDefault();
  if (authMode === 'login') {
    authMode = 'register';
    authTitle.innerText = "Register New Cadet";
    authSubtitle.innerText = "Register your cadet profile in Firebase to start coding!";
    btnAuthSubmit.innerText = "🚀 Register Cadet";
    linkToggleAuth.innerText = "Already registered? Cadet Login";
  } else {
    authMode = 'login';
    authTitle.innerText = "Cadet Space Login";
    authSubtitle.innerText = "Enter your cadet email and password to start coding!";
    btnAuthSubmit.innerText = "🚀 Enter Space Station";
    linkToggleAuth.innerText = "First time here? Register Cadet";
  }
});

btnAuthSubmit.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) return;

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
    alert(err.message);
    DomRenderer.log(`[Auth Error] ${err.message}`, 'error');
  }
});

btnSignout.addEventListener('click', () => {
  Auth.signOut();
  State.session = null;
  authOverlay.style.display = 'flex';
  mainLayout.style.display = 'none';
  tabBtnParent.style.display = 'none';
  tabBtnVisual.click();
});

async function loadAuthenticatedSession() {
  authOverlay.style.display = 'none';
  mainLayout.style.display = 'grid';
  userBadgeEmail.innerText = State.session.email;
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

  // Reveal Godmode reset panel only if logged-in user matches parent email
  const masterEmail = State.config?.parent?.masterGatedEmail || 'arh.homelab@gmail.com';
  if (State.session.email.toLowerCase() === masterEmail.toLowerCase()) {
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
  },
  
  clearLog() {
    consoleOutput.innerHTML = '<div class="log-message system">Console cleared. Ready!</div>';
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

const ThemeEngine = {
  async init() {
    try {
      const res = await fetch('/api/config');
      const config = await res.json();
      State.config = config;
      
      this.applyTheme(config.theme);
      this.applyLayout(config.layout);
      
      SpeechAdapter.init(config.speech);
      
      // Check for PowerShell / url auto-login parameters
      const urlParams = new URLSearchParams(window.location.search);
      const autologin = urlParams.get('autologin');
      const pin = urlParams.get('pin');
      const portal = urlParams.get('portal');

      // Parent Dev Gate Shortcut / Login
      if (portal === 'parent') {
        if (pin) {
          const correctPin = config?.parent?.pin || "1234";
          if (pin === correctPin) {
            const session = await Auth.currentSession();
            if (session && session.email.toLowerCase() === (config?.parent?.masterGatedEmail || 'arh.homelab@gmail.com').toLowerCase()) {
              State.session = session;
              await loadAuthenticatedSession();
              tabBtnParent.click(); // Open Dev Console
              return;
            }
          }
        }
        // If pin is invalid or not provided, show the PIN modal immediately
        openParentPinGate();
      }

      // Kids PWSH Alias Auto-Login (with 1-week TTL verification)
      if (autologin && pin) {
        const cachedSessionRaw = localStorage.getItem(`agy-session-user-${autologin.toLowerCase()}`);
        if (cachedSessionRaw) {
          const cached = JSON.parse(cachedSessionRaw);
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - cached.createdAt < oneWeekMs && pin === cached.pin) {
            State.session = cached.firebaseSession;
            // Write back to main session storage to re-verify token
            localStorage.setItem("agy-terminal-session-v1", JSON.stringify(cached.firebaseSession));
            await loadAuthenticatedSession();
            DomRenderer.log(`[System] Auto-logged in via PWSH alias. Login cached.`, 'system');
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

  runStream(prompt, directory, persona, onStdout, onStderr, onDone, onError) {
    const queryParams = new URLSearchParams({ prompt, directory, persona });
    const eventSource = new EventSource(`/api/run-agy?${queryParams.toString()}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'stdout') onStdout(data.text);
      else if (data.type === 'stderr') onStderr(data.text);
      else if (data.type === 'done') {
        eventSource.close();
        onDone(data.code);
      } else if (data.type === 'error') {
        eventSource.close();
        onError(data.message);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      onError('Stream connection disconnected.');
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

async function runAgent(promptText) {
  if (!promptText.trim()) return;

  // 1. Guardrail restriction check (Gated Approval flow)
  const isGated = SecurityScanner.isRestricted(promptText, State.config?.parent?.gatedKeywords);
  if (isGated) {
    handleGatedPrompt(promptText);
    return;
  }

  // 2. Normal execution loop
  consoleOutput.innerHTML = '';
  State.lastAgentResponseText = '';
  btnReadAloud.disabled = true;
  SpeechAdapter.stopSpeaking();

  DomRenderer.setMascot('thinking', 'Agy is working...', 'I am checking with the space agents. Hold on!');
  DomRenderer.log(`[Prompt] ${promptText}`, 'system');

  let currentLog = document.createElement('div');
  currentLog.className = 'log-message';
  consoleOutput.appendChild(currentLog);

  const persona = State.config?.engine?.persona || 'socratic_teacher';

  NetworkAdapter.runStream(
    promptText,
    State.selectedDirectory,
    persona,
    (text) => {
      currentLog.innerText += text;
      State.lastAgentResponseText += text;
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    },
    (errText) => {
      DomRenderer.log(`Step: ${errText.trim()}`, 'stderr');
    },
    async (code) => {
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

      // Log complete Cadet activity to Firebase Realtime Database
      await pushActivityLog(promptText, State.lastAgentResponseText, 'completed');
    },
    (errMsg) => {
      DomRenderer.setMascot('error', 'Error occurred', 'Something went wrong running Agy.');
      DomRenderer.log(`[Error] ${errMsg}`, 'error');
    }
  );
}

// Gated Approvals logic
async function handleGatedPrompt(promptText) {
  DomRenderer.clearLog();
  DomRenderer.setMascot('error', 'Approval Needed!', 'Agy detected a restricted word. I sent a request to your parents\' phone!');
  DomRenderer.log(`[Warning] Restricted query blocked: "${promptText}"`, 'error');
  DomRenderer.log(`[System] Waiting for Parent remote approval...`, 'system');

  // Trigger POST notification to phone (IP 100.85.170.170)
  try {
    await fetch(`/api/notify-gated?email=${encodeURIComponent(State.session.email)}&prompt=${encodeURIComponent(promptText)}`);
  } catch (err) {
    console.warn('Failed to notify parent phone:', err.message);
  }

  // Push pending record to Firebase
  const logId = await pushActivityLog(promptText, 'Pending parent approval...', 'pending_approval');

  // Poll database every 3 seconds to check for parent approval status
  const pollInterval = setInterval(async () => {
    try {
      const record = await Db.get(`logs/${logId}`, State.session.idToken);
      if (!record) return;

      if (record.status === 'approved') {
        clearInterval(pollInterval);
        DomRenderer.log(`[System] Parent APPROVED! Starting agent...`, 'system');
        // Reset and run prompt
        runApprovedAgent(promptText, logId);
      } else if (record.status === 'denied') {
        clearInterval(pollInterval);
        DomRenderer.setMascot('error', 'Request Denied', 'Your parents did not approve this question. Let\'s ask something else!');
        DomRenderer.log(`[Denied] Restricted query was explicitly rejected by parent.`, 'error');
      }
    } catch (e) {
      console.error('Error polling approvals:', e.message);
    }
  }, 3000);
}

async function runApprovedAgent(promptText, logId) {
  consoleOutput.innerHTML = '';
  State.lastAgentResponseText = '';
  DomRenderer.setMascot('thinking', 'Agy is working...', 'Running parent-approved query...');
  
  let currentLog = document.createElement('div');
  currentLog.className = 'log-message';
  consoleOutput.appendChild(currentLog);

  const persona = State.config?.engine?.persona || 'socratic_teacher';

  NetworkAdapter.runStream(
    promptText,
    State.selectedDirectory,
    persona,
    (text) => {
      currentLog.innerText += text;
      State.lastAgentResponseText += text;
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    },
    (errText) => {},
    async (code) => {
      DomRenderer.setMascot('success', 'Task Done!', 'Check the visual board!');
      btnReadAloud.disabled = false;
      
      const yamlRegex = /```yaml\s*([\s\S]*?)```/g;
      const match = yamlRegex.exec(State.lastAgentResponseText);
      if (match && match[1]) {
        const parsed = YamlParser.parse(match[1]);
        WidgetRenderer.render(parsed);
      } else {
        DomRenderer.renderPlaceholder();
      }

      // Update the existing pending log to completed in Firebase DB
      const artifacts = ArtifactExtractor.extract(State.lastAgentResponseText);
      const updateData = {
        response: State.lastAgentResponseText,
        status: 'completed',
        artifacts: artifacts,
        timestamp: Date.now()
      };
      await Db.update(`logs/${logId}`, State.session.idToken, updateData);
    },
    (errMsg) => {
      DomRenderer.log(`[Error] ${errMsg}`, 'error');
    }
  );
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
    btnReadAloud.innerText = '🔊 Read Aloud';
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
    () => btnReadAloud.innerText = '🔊 Read Aloud'
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
  openParentPinGate();
});

btnOpenParentPortal.addEventListener('click', () => {
  openParentPinGate();
});

linkAuthParentPortal.addEventListener('click', (e) => {
  e.preventDefault();
  openParentPinGate();
});

function openParentPinGate() {
  parentPinModal.style.display = 'flex';
  parentPinInput.value = '';
  parentPinInput.focus();
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
  const parentConfig = State.config?.parent || {};
  const correctPin = parentConfig.pin || "1234";

  if (enteredPin === correctPin) {
    parentPinModal.style.display = 'none';
    
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
      DomRenderer.setMascot('thinking', 'Setup Mode Unlocked!', 'Welcome! Set your Firebase API Key in the settings below to initialize the system.');
      return;
    }

    // Unlock parent tab navigation standard flow
    tabBtnParent.classList.add('active');
    tabBtnVisual.classList.remove('active');
    tabContentVisual.style.display = 'none';
    tabContentParent.style.display = 'block';
    
    openParentSection('logs');
  } else {
    alert("Incorrect Security PIN. Access Denied.");
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
    parentApprovalsList.innerHTML = `<p class="error">Failed to load approvals: ${err.message}</p>';
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

  // Safeguards & Persona Presets
  document.getElementById('set-parent-pin').value = config.parent.pin || '1234';
  document.getElementById('set-socratic-mode').value = config.engine.socraticMode !== false ? 'true' : 'false';
  document.getElementById('set-persona').value = config.engine.persona || 'socratic_teacher';
}

// 4. Save settings back to config.json (Master Parent) or Firebase (Cadet Personal Profile)
btnSaveSettings.addEventListener('click', async () => {
  const config = State.config;
  if (!config) return;

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
    parent: {
      pin: document.getElementById('set-parent-pin').value
    },
    engine: {
      socraticMode: document.getElementById('set-socratic-mode').value === 'true',
      persona: document.getElementById('set-persona').value
    }
  };

  btnSaveSettings.disabled = true;
  btnSaveSettings.innerText = 'Saving...';
  try {
    const masterEmail = State.config?.parent?.masterGatedEmail || 'arh.homelab@gmail.com';
    const username = State.session.email.split('@')[0].toLowerCase();

    // Parent saves (including bootstrap setup saves)
    if (State.session.email.toLowerCase() === masterEmail.toLowerCase() || State.session.uid === 'parent-setup') {
      const updatedConfig = deepMerge(State.config, settingsOverride);
      const res = await fetch('/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();
      if (data.success) {
        State.config = updatedConfig;
        alert('Master dev configuration updated on the server!');
        
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
      alert('Your personalized cadet settings have been saved to your profile!');
    }

    // Update local alias cache PIN so pwsh commands continue matching their new PIN setting
    const cachedSessionRaw = localStorage.getItem(`agy-session-user-${username}`);
    if (cachedSessionRaw) {
      const cached = JSON.parse(cachedSessionRaw);
      cached.pin = settingsOverride.parent.pin;
      localStorage.setItem(`agy-session-user-${username}`, JSON.stringify(cached));
    }

    ThemeEngine.applyTheme(State.config.theme);
    ThemeEngine.applyLayout(State.config.layout);
    SpeechAdapter.init(State.config.speech);
  } catch (err) {
    alert('Failed to save settings: ' + err.message);
  } finally {
    btnSaveSettings.disabled = false;
    btnSaveSettings.innerText = '💾 Save Configuration';
  }
});

// 5. Godmode System Reset: Deletes all Cadet customized overrides from Firebase
btnGodmodeReset.addEventListener('click', async () => {
  if (State.session.uid === 'parent-setup') {
    alert("System Reset is unavailable in Offline Setup Mode.");
    return;
  }

  const check = confirm("WARNING: This will delete all customized Cadet configurations and reset them back to dev master default. Are you sure?");
  if (!check) return;

  btnGodmodeReset.disabled = true;
  btnGodmodeReset.innerText = 'Resetting...';

  try {
    const users = await Db.get('users', State.session.idToken);
    if (users) {
      for (let uid of Object.keys(users)) {
        if (users[uid].settings) {
          await Db.remove(`users/${uid}/settings`, State.session.idToken);
        }
      }
    }
    alert('System Reset Complete! All users are now reset to dev master defaults.');
    window.location.reload();
  } catch (err) {
    alert('Failed to perform system reset: ' + err.message);
  } finally {
    btnGodmodeReset.disabled = false;
    btnGodmodeReset.innerText = '💥 Reset All User Configurations';
  }
});

// Initialize Settings
ThemeEngine.init();
