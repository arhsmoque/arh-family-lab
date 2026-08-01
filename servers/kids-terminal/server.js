const express = require('express');
const path = require('path');
const { spawnSync } = require('child_process');
// cross-spawn (not plain child_process.spawn): npm-installed CLIs like
// claude/codex/kimi are ".cmd" shims on Windows, and plain spawn() fails
// with ENOENT (extensionless lookup) or EINVAL (paths with spaces, e.g.
// "C:\Users\Abdul Rahman Hilmi\...") without correct shell quoting.
// cross-spawn is the standard fix for this exact problem.
const spawn = require('cross-spawn');
const fs = require('fs');
const http = require('http');

const app = express();
const repoRoot = path.resolve(__dirname, '../../');
const configPath = path.join(__dirname, 'config.json');

app.use(express.json());

// ============================================================================
// ENVIRONMENT LOADER (Zero-dependency manual .env parser)
// ============================================================================

const envFile = path.join(__dirname, '.env');

function loadEnv() {
  if (!fs.existsSync(envFile)) return;
  try {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) return;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      // Real environment variables (e.g. injected by infisical) always win
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    });
    console.log('[Env] Loaded local environment configuration successfully.');
  } catch (e) {
    console.error('[Env] Error loading .env:', e.message);
  }
}

function saveEnv(updates) {
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, '', 'utf8');
  }
  try {
    let content = fs.readFileSync(envFile, 'utf8');
    Object.keys(updates).forEach(key => {
      const val = updates[key];
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (content.match(regex)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        if (content && !content.endsWith('\n')) content += '\n';
        content += `${key}=${val}\n`;
      }
      process.env[key] = val; // Sync in active process
    });
    fs.writeFileSync(envFile, content, 'utf8');
    return true;
  } catch (e) {
    console.error('[Env] Error saving .env:', e.message);
    return false;
  }
}

// Load env values on startup
loadEnv();

const START_PORT = parseInt(process.env.SERVER_PORT || '3000', 10);
const TAILSCALE_IP = process.env.TAILSCALE_IP || '100.85.130.130';
const MOCK_MODE = /^(1|true|yes|on)$/i.test(process.env.AGY_MOCK_MODE || '');

// ============================================================================
// CONFIG & SECURITY RESOLUTION
// ============================================================================

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('[Config] Error reading config.json:', e.message);
    return null;
  }
}

// Security gate toggle: SECURITY_ENABLED env override > config.json security.enabled
function isSecurityEnabled() {
  if (process.env.SECURITY_ENABLED !== undefined) {
    return /^(1|true|yes|on)$/i.test(process.env.SECURITY_ENABLED);
  }
  const config = readConfig();
  return config?.security?.enabled === true;
}

function getParentPin() {
  if (process.env.PARENT_PIN) return process.env.PARENT_PIN;
  const config = readConfig();
  return config?.parent?.pin || '1234';
}

// Fallback presets used only if config.json has no engine.providers entry for
// the selected name (keeps old config.json files working after this change).
const BUILTIN_PROVIDERS = {
  mock: { executable: null, args: [] },
  claude: { executable: 'claude', args: ['--dangerously-skip-permissions', '-p', '{prompt}'] },
  codex: { executable: 'codex', args: ['exec', '--dangerously-bypass-approvals-and-sandbox', '{prompt}'] },
  kimi: { executable: 'kimi', args: ['--auto', '-p', '{prompt}'] },
  antigravity: { executable: 'antigravity', args: ['-p', '{prompt}'] },
  agy: { executable: 'agy.exe', args: ['--dangerously-skip-permissions', '-p', '{prompt}'] }
};

// AI backend provider: env > config.json engine.provider > 'mock'. Switching
// providers (e.g. after hitting a usage limit) is just changing this one
// value — via Settings in the UI, or engine.provider in config.json directly.
function resolveProvider() {
  const config = readConfig();
  const name = process.env.AGY_PROVIDER || config?.engine?.provider || 'mock';
  const preset = (config?.engine?.providers || {})[name] || BUILTIN_PROVIDERS[name] || BUILTIN_PROVIDERS.mock;
  // CLI_EXECUTABLE still lets an operator override just the binary path/name
  // for whichever provider is currently active, without editing config.json.
  const executable = process.env.CLI_EXECUTABLE || preset.executable;
  return { name, executable, argsTemplate: preset.args || [] };
}

// Substitute the built prompt into a provider's args template. Each preset
// already bakes in its own non-interactive/skip-approval flag, because the
// SSE streaming architecture below has no channel for a CLI to ask the kid
// for interactive confirmation.
function buildProviderArgs(argsTemplate, prompt) {
  return argsTemplate.map((a) => (a === '{prompt}' ? prompt : a));
}

// Resolve a bare command name (e.g. "claude") to the exact file Node can
// spawn. On Windows, npm-installed CLIs are usually ".cmd" shims — `where`
// also lists the extensionless POSIX shell-script twin ahead of it, which
// child_process.spawn() cannot execute directly (ENOENT), so we prefer the
// Windows-executable extensions in PATHEXT order. Node spawns .bat/.cmd
// files safely (with proper argument escaping) without needing shell:true,
// as long as we hand it the resolved path with its real extension.
function resolveExecutablePath(executable) {
  if (!executable) return null;
  if (executable.includes('/') || executable.includes('\\')) {
    return fs.existsSync(executable) ? executable : null;
  }
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(cmd, [executable], { encoding: 'utf8' });
    if (result.status !== 0) return null;
    const lines = (result.stdout || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (process.platform !== 'win32') return lines[0] || null;
    for (const ext of ['.exe', '.cmd', '.bat', '.com']) {
      const match = lines.find((l) => l.toLowerCase().endsWith(ext));
      if (match) return match;
    }
    return lines[0] || null;
  } catch (e) {
    return null;
  }
}

// Check whether a provider's CLI is actually callable on this machine
function checkCliAvailable(executable) {
  return resolveExecutablePath(executable) !== null;
}

// ============================================================================
// PIN VERIFICATION (lightly rate-limited: 5 tries/min per IP)
// ============================================================================

const pinAttempts = new Map(); // ip -> { count, resetAt }

function pinRateLimitOk(ip) {
  const now = Date.now();
  const rec = pinAttempts.get(ip);
  if (!rec || now > rec.resetAt) {
    pinAttempts.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  rec.count++;
  return rec.count <= 5;
}

// Admin guard for sensitive endpoints — only enforced when security is ON
function requireAdminPin(req, res, next) {
  if (!isSecurityEnabled()) return next();
  const pin = req.headers['x-admin-pin'];
  if (pin && pin === getParentPin()) return next();
  res.status(401).json({ success: false, error: 'Invalid or missing admin PIN.' });
}

// ============================================================================
// I/O ADAPTERS (Side Effects & System/Shell Communication)
// ============================================================================

const FileIOAdapter = {
  readJson(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`[FileIO] Error reading JSON from ${filePath}:`, e.message);
      return null;
    }
  },
  writeJson(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error(`[FileIO] Error writing JSON to ${filePath}:`, e.message);
      return false;
    }
  }
};

const DialogAdapter = {
  selectPath(isFolder, onComplete) {
    let script = '';
    if (isFolder) {
      script = `
        [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null;
        $d = New-Object System.Windows.Forms.FolderBrowserDialog;
        $d.Description = 'Choose a folder to work with Agy!';
        if ($d.ShowDialog() -eq 'OK') { Write-Output $d.SelectedPath }
      `;
    } else {
      script = `
        [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null;
        $d = New-Object System.Windows.Forms.OpenFileDialog;
        $d.Title = 'Choose a file for Agy!';
        $d.Filter = 'All Files (*.*)|*.*';
        if ($d.ShowDialog() -eq 'OK') { Write-Output $d.FileName }
      `;
    }

    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command', script
    ]);

    let output = '';
    ps.stdout.on('data', (data) => output += data.toString());
    ps.on('close', () => onComplete(output.trim()));
  }
};

const CliAdapter = {
  run(executable, args, options, onData, onErr, onClose, onProcessErr) {
    // stdin: 'ignore' — otherwise providers like Claude Code wait ~3s for
    // piped stdin before proceeding, adding a needless delay to every prompt.
    const proc = spawn(executable, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });

    proc.stdout.on('data', onData);
    proc.stderr.on('data', onErr);
    proc.on('close', onClose);
    proc.on('error', onProcessErr);

    return proc;
  }
};

const NotificationAdapter = {
  send(urlStr, data) {
    if (!urlStr || urlStr.startsWith('http://REPLACE_')) {
      console.log('[Notification] Parent phone notification skipped (not configured).');
      return;
    }
    try {
      const url = new URL(urlStr);
      const postData = JSON.stringify(data);
      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 2000 // 2 second timeout so server doesn't block if phone is offline
      };

      const req = http.request(options, (res) => {
        console.log(`[Notification] Sent to parent phone. Status: ${res.statusCode}`);
      });

      req.on('error', (e) => {
        console.warn(`[Notification] Failed to notify phone: ${e.message}`);
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn(`[Notification] Connection timeout to parent phone.`);
      });

      req.write(postData);
      req.end();
    } catch (err) {
      console.error('[Notification] Error parsing notifyUrl:', err.message);
    }
  }
};

// ============================================================================
// PURE BUSINESS LOGIC (No I/O Side Effects)
// ============================================================================

// Flat-YAML widget contract — the front-end parser (app.js YamlParser) is a
// naive flat key/value parser, so the model MUST emit flat option_N_/choice_N_
// keys. Nested YAML objects silently lose correctness/feedback data.
const YAML_CONTRACT = `
4. Visual YAML Generation: Whenever explaining math (multiplication, addition), counts, story choices, or step-by-step instructions, you MUST generate a YAML block inside a standard \`\`\`yaml code block. This YAML block will be parsed by our front-end engine and shown as an interactive game or diagram.
   IMPORTANT: Use ONLY flat key-value lines exactly as shown below. NEVER nest objects under "options:" or "choices:" — nested YAML breaks the game. For quizzes use option_1_text / option_1_correct / option_1_feedback groups; for stories use choice_1_text / choice_1_action groups.
   Supported YAML blocks (choose the best match):

   - A dot/star grid for multiplication or counting:
     \`\`\`yaml
     type: dots-grid
     title: "7 groups of 8"
     rows: 7
     cols: 8
     symbol: "⭐"
     color: "gold"
     \`\`\`

   - A friendly visual quiz (flat keys, one group per answer):
     \`\`\`yaml
     type: quiz
     question: "Which of these is a variable container?"
     option_1_text: "x = 5"
     option_1_correct: true
     option_1_feedback: "Super job! x is like a box holding the number 5."
     option_2_text: "5"
     option_2_correct: false
     option_2_feedback: "Almost! 5 is just a number. A box needs a name, like x = 5!"
     \`\`\`

   - Interactive adventure story choices (flat keys, one group per choice):
     \`\`\`yaml
     type: story-scene
     text: "You stand before the Magic Castle doors. They are green and glowing."
     choice_1_text: "Knock on the door"
     choice_1_action: "Describe knocking on the door and what funny creature opens it"
     choice_2_text: "Tickle the door knob"
     choice_2_action: "Describe what happens when you tickle the door knob"
     \`\`\`

   - Step-by-step guide card:
     \`\`\`yaml
     type: step-by-step
     title: "How to fix your game"
     steps:
       - "Open your game file."
       - "Check for a print mistake."
       - "Run Agy again to check."
     \`\`\`
`;

const AGE_TIER_ADDENDUMS = {
  junior: `You are communicating with a 7 to 12-year-old child who has NO command-line or programming experience. You MUST follow these rules:
1. Socratic Method: DO NOT give direct answers to questions immediately. Instead, use a Socratic dialogue to loop the query and guide them to learn and figure it out.
   Example: If they ask "what is 7 x 8?", respond in your persona tone: "So you want to know what 7 times 8 is! How about we look at a cool way to count it together?" Then guide them. If they say "just tell me", reloop by proposing a visual way of working it out.
2. Plain Language: DO NOT use technical developer jargon like "JSON", "CSV", "Markdown", "compile", "path", "directory", "repository", "TUI", "CLI". Use simple words like "Folder", "File", "Game", "Helper", "Steps", "Agy Speech".
3. Bilingual Welcome: The child is Malaysian. If they write in Bahasa Melayu, reply in simple Bahasa Melayu. Otherwise use simple English.`,

  teen: `You are communicating with a Malaysian teenager (13 to 18 years old) who is learning coding and computational thinking. You MUST follow these rules:
1. Study-Buddy Mentor: Act as a sharp, encouraging study buddy and coding mentor. NO baby talk. Give direct, correct answers when asked, then deepen understanding with one smart follow-up question or challenge.
2. Exam-Smart: Connect explanations to problem decomposition, pattern recognition, and exam-style logic (e.g. SPM-level reasoning). Teach them HOW to think, not just what to copy.
3. Real Vocabulary: Use correct technical terms (variable, function, loop, compile) and briefly explain each new one — teens can handle real engineering language.
4. Bilingual Welcome: Mixing Bahasa Melayu and English is welcome and natural. Match the language the teen uses; BM/EN code-switching is fine.`
};

const PromptBuilder = {
  build(prompt, socraticMode, persona, ageTier) {
    if (!socraticMode) return prompt;

    // Define vocab aligned persona prompts
    let personaPrompt = `You are a warm, encouraging lady teacher. Speak in a gentle, supportive, and validation-focused tone. Use vocabulary like "Cadet", "Super attempt!", "learning journey", "star chart", and friendly real-world metaphors.`;

    if (persona === 'alfred') {
      personaPrompt = `You are Alfred Pennyworth, a loyal British butler and protective advisory assistant. Address the user formally as 'Young Master' or 'Young Miss'. Speak in a highly polished, witty, dry, and cautionary tone. DO NOT use the word 'protocol'. Instead, use butler vocabulary like 'cautionary measure', 'discretion is the better part of valor', 'safeguard', 'bloody log', and 'advisory notice'. If they propose code changes, warn them proactively first (e.g. "I would strongly advise caution, Young Master. Shall we run a safeguard first?").`;
    } else if (persona === 'jarvis') {
      personaPrompt = `You are Jarvis, a sleek, technical AI assistant. Speak in a clean, helpful, and technical tone. Address the user as 'Sir' or 'Ma'am'. Use advanced technical vocabulary like 'diagnostics', 're-routing computational grids', 'House Party Protocol', 'systems operational', and 'threat index'. E.g. "Diagnostics complete, Sir. Ready to commence compilation."`;
    } else if (persona === 'friday') {
      personaPrompt = `You are Friday, a sassy, tech-forward, and highly protective AI assistant. Address the user as 'Boss'. Use vocabulary like 'Barnyard Protocol', 'sealing the HQ', 'shields up', 'contusions detected', 'global extinction level', and 'systems override'. Keep your tone slightly dry, quick, and protective. E.g. "Barnyard Protocol engaged, Boss. Gating the HQ. Ready to run compile cycles."`;
    }

    const ageAddendum = AGE_TIER_ADDENDUMS[ageTier] || AGE_TIER_ADDENDUMS.junior;

    const addendum = `

[SYSTEM RULE ADDENDUM]
Persona Assignment: ${personaPrompt}

${ageAddendum}
${YAML_CONTRACT}`;
    return `${prompt}\n\n${addendum}`;
  },

  buildTranslationPrompt(text, fromLang, toLang) {
    return `Translate the following text from language locale "${fromLang}" to language locale "${toLang}". Provide ONLY the direct translation. Do not add any greeting, explanation, markdown containers (except the translation itself), or meta text. Speak naturally in the target language.

Text: "${text}"`;
  }
};

// ============================================================================
// MOCK ENGINE (AGY_MOCK_MODE=1 — full UI flow without agy.exe installed)
// ============================================================================

const MockEngine = {
  runAgyResponse(prompt, ageTier) {
    const isTeen = ageTier === 'teen';
    const lower = (prompt || '').toLowerCase();

    let yamlBlock;
    let intro;
    let outro;

    if (/stor(y|ies)/.test(lower)) {
      intro = isTeen
        ? 'Demo mode (agy.exe not installed) — here is a sample interactive story so you can test the UI flow:'
        : 'Demo mode, Cadet! Agy is not installed yet, so here is a practice story! ';
      yamlBlock = `\`\`\`yaml
type: story-scene
text: "You stand before the Magic Castle doors. They are green and glowing."
choice_1_text: "Knock on the door"
choice_1_action: "Describe knocking on the door and what funny creature opens it"
choice_2_text: "Tickle the door knob"
choice_2_action: "Describe what happens when you tickle the door knob"
\`\`\``;
      outro = isTeen ? 'Pick a choice on the right panel to continue.' : 'Tap a choice on the right to keep going!';
    } else if (/count|times|multiply|[0-9]+\s*[x×*]\s*[0-9]+/.test(lower)) {
      intro = isTeen
        ? 'Demo mode (agy.exe not installed) — sample counting grid for UI testing:'
        : 'Demo mode, Cadet! Let us count together with this practice grid!';
      yamlBlock = `\`\`\`yaml
type: dots-grid
title: "7 groups of 8"
rows: 7
cols: 8
symbol: "⭐"
color: "gold"
\`\`\``;
      outro = isTeen ? 'Click the dots to count them off — 7 × 8 = 56.' : 'Click each star to count it. 7 times 8 equals 56!';
    } else {
      intro = isTeen
        ? 'Demo mode (agy.exe not installed) — sample quiz so you can verify correctness/feedback rendering:'
        : 'Great question, Cadet! Agy is not installed yet, so this is a practice quiz!';
      yamlBlock = `\`\`\`yaml
type: quiz
question: "Which of these makes a box that holds the number 5?"
option_1_text: "x = 5"
option_1_correct: true
option_1_feedback: "Super job! x is the box, and 5 lives inside it."
option_2_text: "5"
option_2_correct: false
option_2_feedback: "Almost! 5 is just a number. A box needs a name, like x = 5."
\`\`\``;
      outro = isTeen ? 'Answer on the right panel — the feedback confirms the flat-YAML contract works.' : 'Tap an answer on the right to play!';
    }

    return `${intro}\n\n${yamlBlock}\n\n${outro}`;
  },

  translateResponse(text, toLang) {
    return `[Demo translation to ${toLang}] ${text}`;
  }
};

// ============================================================================
// EXPRESS APP ORCHESTRATION & ROUTING
// ============================================================================

// Serve static files from the repository root
app.use(express.static(repoRoot));

// Admin shortcut redirect
app.get('/servers/kids-terminal/admin', (req, res) => {
  res.redirect('/servers/kids-terminal/?portal=parent');
});

// Serve index.html for the kids-terminal route
app.get('/servers/kids-terminal/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Config Endpoint: Merges .env values over config.json dynamically
app.get('/api/config', (req, res) => {
  const config = FileIOAdapter.readJson(configPath);
  if (config) {
    const securityOn = isSecurityEnabled();

    // Dynamic overlay from process.env
    if (process.env.FIREBASE_URL) config.firebase.url = process.env.FIREBASE_URL;
    if (process.env.FIREBASE_ROOT) config.firebase.root = process.env.FIREBASE_ROOT;
    if (process.env.FIREBASE_API_KEY) config.auth.apiKey = process.env.FIREBASE_API_KEY;

    if (process.env.PARENT_PIN) config.parent.pin = process.env.PARENT_PIN;
    if (process.env.PARENT_NOTIFY_URL) config.parent.notifyUrl = process.env.PARENT_NOTIFY_URL;
    if (process.env.PARENT_MASTER_EMAIL) config.parent.masterGatedEmail = process.env.PARENT_MASTER_EMAIL;

    if (process.env.AGY_PROVIDER) config.engine.provider = process.env.AGY_PROVIDER;

    // Runtime state exposed to the client
    const provider = resolveProvider();
    config.security = { enabled: securityOn };
    config.cliAvailable = provider.name === 'mock' ? true : checkCliAvailable(provider.executable);
    config.mockMode = MOCK_MODE || provider.name === 'mock';

    // When security is ON, never leak the parent PIN in plaintext — serve a boolean
    if (securityOn) {
      const pinSet = !!(process.env.PARENT_PIN || config.parent.pin);
      config.parent = { ...config.parent, pinSet };
      delete config.parent.pin;
    }

    res.json(config);
  } else {
    res.status(500).json({ error: 'Could not load settings config.json' });
  }
});

// PIN verification for the client PIN modal (only meaningful when security is ON)
app.post('/api/verify-pin', (req, res) => {
  if (!isSecurityEnabled()) {
    res.json({ ok: true });
    return;
  }
  if (!pinRateLimitOk(req.ip)) {
    res.status(429).json({ ok: false, error: 'Too many tries. Wait a minute and try again.' });
    return;
  }
  const pin = req.body?.pin;
  res.json({ ok: !!pin && pin === getParentPin() });
});

// Save Config Endpoint: Writes updates back to config.json (UI elements) and .env (secrets)
app.post('/api/save-config', requireAdminPin, (req, res) => {
  const incoming = req.body;
  const config = FileIOAdapter.readJson(configPath);

  if (!config) {
    res.status(500).json({ success: false, error: 'Could not read config.json' });
    return;
  }

  // 1. Separate UI elements to save in config.json
  config.theme = incoming.theme;
  config.layout = incoming.layout;
  config.engine.socraticMode = incoming.engine.socraticMode;
  config.engine.persona = incoming.engine.persona;
  if (incoming.engine.provider) config.engine.provider = incoming.engine.provider;
  config.speech = incoming.speech;

  // Security gate toggle (default OFF/open)
  if (incoming.security) {
    config.security = { enabled: incoming.security.enabled === true };
  }

  // 2. Separate system path and key updates to save in .env
  const envUpdates = {};
  if (incoming.auth?.apiKey) envUpdates.FIREBASE_API_KEY = incoming.auth.apiKey;
  if (incoming.firebase?.url) envUpdates.FIREBASE_URL = incoming.firebase.url;
  if (incoming.parent?.pin) envUpdates.PARENT_PIN = incoming.parent.pin;
  if (incoming.parent?.notifyUrl) envUpdates.PARENT_NOTIFY_URL = incoming.parent.notifyUrl;

  const successJson = FileIOAdapter.writeJson(configPath, config);
  const successEnv = saveEnv(envUpdates);

  if (successJson && successEnv) {
    res.json({ success: true, message: 'Settings and environment variables saved successfully.' });
  } else {
    res.status(500).json({ success: false, error: 'Failed to write config updates.' });
  }
});

// Godmode reset gate: client performs the Firebase-side cleanup itself, but must
// clear this PIN check first when security is ON (no-op when security is OFF).
app.post('/api/godmode-reset', requireAdminPin, (req, res) => {
  res.json({ success: true });
});

// Notify parent about new registration attempt
app.get('/api/notify-registration', (req, res) => {
  const email = req.query.email;
  const notifyUrl = process.env.PARENT_NOTIFY_URL;

  NotificationAdapter.send(notifyUrl, {
    event: 'registration_attempt',
    timestamp: new Date().toISOString(),
    email: email,
    message: `Alert: New user creation is being attempted for email: ${email}`
  });

  res.json({ success: true });
});

// Notify parent about gated restricted prompts
app.get('/api/notify-gated', (req, res) => {
  const email = req.query.email;
  const prompt = req.query.prompt;
  const notifyUrl = process.env.PARENT_NOTIFY_URL;

  NotificationAdapter.send(notifyUrl, {
    event: 'gated_approval_needed',
    timestamp: new Date().toISOString(),
    email: email,
    prompt: prompt,
    message: `Alert: Restricted query attempted by ${email}. Query: "${prompt}". Needs Parent Approval.`
  });

  res.json({ success: true });
});

// Translation Endpoint: Uses agy CLI dynamically to translate input/output
app.get('/api/translate', (req, res) => {
  const text = req.query.text;
  const fromLang = req.query.from || 'en-US';
  const toLang = req.query.to || 'en-US';

  if (!text) {
    res.status(400).json({ error: 'Text is required' });
    return;
  }

  const provider = resolveProvider();

  if (MOCK_MODE || provider.name === 'mock') {
    res.json({ success: true, translation: MockEngine.translateResponse(text, toLang), mock: true });
    return;
  }

  if (!checkCliAvailable(provider.executable)) {
    res.json({ success: false, error: `Agy CLI ("${provider.name}") is not installed on this machine.`, cliAvailable: false });
    return;
  }

  const translationPrompt = PromptBuilder.buildTranslationPrompt(text, fromLang, toLang);
  const args = buildProviderArgs(provider.argsTemplate, translationPrompt);
  const cliExecutable = provider.executable;

  let output = '';
  CliAdapter.run(
    cliExecutable,
    args,
    { cwd: repoRoot },
    (data) => { output += data.toString(); },
    (data) => {},
    (code) => {
      res.json({ success: code === 0, translation: output.trim(), exitCode: code });
    },
    (err) => {
      res.status(500).json({ success: false, error: err.message });
    }
  );
});

// Endpoint to trigger native Windows Folder or File Selection Dialogs
app.get('/api/select-path', (req, res) => {
  const isFolder = req.query.type === 'folder';

  DialogAdapter.selectPath(isFolder, (selectedPath) => {
    if (selectedPath) {
      res.json({ success: true, path: selectedPath });
    } else {
      res.json({ success: false, message: 'Selection cancelled' });
    }
  });
});

// Endpoint to stream agy response via Server-Sent Events (SSE)
app.get('/api/run-agy', (req, res) => {
  const prompt = req.query.prompt;
  const directory = req.query.directory || repoRoot;
  const persona = req.query.persona || 'socratic_teacher';
  const ageTier = req.query.ageTier === 'teen' ? 'teen' : 'junior';
  const approvedLogId = req.query.approvedLogId || '';

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const config = readConfig() || { engine: {} };
  const securityOn = isSecurityEnabled();

  // Server-side gated-keyword re-check (only when security is ON).
  // Restricted prompts must carry an approved log id from the parent approval flow.
  if (securityOn) {
    const keywords = config.parent?.gatedKeywords || [];
    const lowerPrompt = prompt.toLowerCase();
    const restricted = keywords.some(w => lowerPrompt.includes(String(w).toLowerCase()));
    if (restricted && !approvedLogId) {
      res.status(403).json({
        status: 'pending_approval',
        message: 'This prompt contains a restricted word and needs parent approval first.'
      });
      return;
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const provider = resolveProvider();

  // Mock mode: canned demo responses so the full UI flow works without a
  // real AI backend installed/configured.
  if (MOCK_MODE || provider.name === 'mock') {
    const text = MockEngine.runAgyResponse(prompt, ageTier);
    const midpoint = Math.floor(text.length / 2);
    res.write(`data: ${JSON.stringify({ type: 'stdout', text: text.slice(0, midpoint) })}\n\n`);
    const timer = setTimeout(() => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', text: text.slice(midpoint) })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', code: 0 })}\n\n`);
      res.end();
    }, 400);
    req.on('close', () => clearTimeout(timer));
    return;
  }

  // Graceful fallback: chosen provider's CLI not installed — friendly state
  const cliExecutable = provider.executable;
  if (!checkCliAvailable(cliExecutable)) {
    const friendly = ageTier === 'teen'
      ? `Agy's "${provider.name}" backend is not installed on this computer yet — ask a parent to install it, or switch to Mock/Demo mode in Settings.\n\nAgy belum dipasang lagi — minta ibu bapa pasangkan dulu.`
      : `Agy is not installed on this computer yet — ask a parent to set it up!\n\nAgy belum dipasang lagi — minta ibu bapa pasangkan dulu ya!`;
    res.write(`data: ${JSON.stringify({ type: 'stdout', text: friendly })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', code: 0, cliAvailable: false })}\n\n`);
    res.end();
    return;
  }

  const socraticMode = config.engine.socraticMode !== false;
  const finalPrompt = PromptBuilder.build(prompt, socraticMode, persona, ageTier);
  const args = buildProviderArgs(provider.argsTemplate, finalPrompt);

  let finished = false;
  const proc = CliAdapter.run(
    cliExecutable,
    args,
    { cwd: fs.existsSync(directory) ? directory : repoRoot },
    (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', text: data.toString() })}\n\n`);
    },
    (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', text: data.toString() })}\n\n`);
    },
    (code) => {
      finished = true;
      res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
      res.end();
    },
    (err) => {
      finished = true;
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  );

  // Kill the spawned CLI process if the client disconnects (Stop button / tab close)
  req.on('close', () => {
    if (!finished && proc && !proc.killed) {
      try { proc.kill(); } catch (e) {}
    }
  });
});

// ============================================================================
// CONCURRENCY & COLLISION PROCESS GUARDS
// ============================================================================

const lockFile = path.join(__dirname, 'server.lock');

if (fs.existsSync(lockFile)) {
  const oldPid = parseInt(fs.readFileSync(lockFile, 'utf8'), 10);
  try {
    process.kill(oldPid, 0);
    console.log(`⚠️  [Warning] Agy Cadet server is already running (PID: ${oldPid}). Exiting to avoid collision.`);
    process.exit(0);
  } catch (e) {
    try { fs.unlinkSync(lockFile); } catch (err) {}
  }
}

fs.writeFileSync(lockFile, process.pid.toString(), 'utf8');

const cleanupLock = () => {
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  } catch (err) {}
};

process.on('exit', cleanupLock);
process.on('SIGINT', () => { cleanupLock(); process.exit(0); });
process.on('SIGTERM', () => { cleanupLock(); process.exit(0); });
process.on('uncaughtException', (err) => {
  cleanupLock();
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    const provider = resolveProvider();
    const useMock = MOCK_MODE || provider.name === 'mock';
    const cliAvailable = useMock ? false : checkCliAvailable(provider.executable);
    console.log(`================================================`);
    console.log(`🚀 Agy Cadet Space Station Server Running!`);
    console.log(`🌐 Local: http://localhost:${port}/servers/kids-terminal/`);
    console.log(`🔒 Tailscale: http://${TAILSCALE_IP}:${port}/servers/kids-terminal/`);
    console.log(`📁 Workspace: ${repoRoot}`);
    console.log(`🛡️  Security gate: ${isSecurityEnabled() ? 'ON' : 'OFF (open mode)'}`);
    console.log(`🤖 Provider: ${provider.name}${useMock ? ' (MOCK MODE — demo responses)' : cliAvailable ? ' - available' : ' - NOT FOUND, friendly fallback active'}`);
    console.log(`================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      cleanupLock();
      console.error('Server error:', err);
    }
  });
}

startServer(START_PORT);
