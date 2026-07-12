const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

const app = express();
const repoRoot = path.resolve(__dirname, '../../');

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
      process.env[key] = val;
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
    const proc = spawn(executable, args, options);
    
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

const PromptBuilder = {
  build(prompt, socraticMode, persona) {
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

    const addendum = `

[SYSTEM RULE ADDENDUM]
Persona Assignment: ${personaPrompt}

You are communicating with a 7 to 9-year-old child who has NO command-line or programming experience. You MUST follow these rules:
1. Socratic Method: DO NOT give direct answers to questions immediately. Instead, use a Socratic dialogue to loop the query and guide them to learn and figure it out.
   Example: If they ask "what is 7 x 8?", respond in your persona tone: "So you want to know what 7 times 8 is! How about we look at a cool way to count it together?" Then guide them. If they say "just tell me", reloop by proposing a visual way of working it out.
2. Plain Language: DO NOT use technical developer jargon like "JSON", "CSV", "Markdown", "compile", "path", "directory", "repository", "TUI", "CLI". Use simple words like "Folder", "File", "Game", "Helper", "Steps", "Agy Speech".
3. Visual YAML Generation: Whenever explaining math (multiplication, addition), counts, story choices, or step-by-step instructions, you MUST generate a YAML block inside a standard \`\`\`yaml code block. This YAML block will be parsed by our front-end engine and shown as an interactive game or diagram.
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
     
   - Interactive adventure story choices:
     \`\`\`yaml
     type: story-scene
     text: "You stand before the Magic Castle doors. They are green and glowing."
     choices:
       - text: "Knock on the door"
         action: "Describe knocking on the door and what funny creature opens it"
       - text: "Tickle the door knob"
         action: "Describe what happens when you tickle the door knob"
     \`\`\`
     
   - A friendly visual quiz:
     \`\`\`yaml
     type: quiz
     question: "Which of these is a variable container?"
     options:
       - text: "x = 5"
         correct: true
         feedback: "Super job! x is like a box holding the number 5."
       - text: "5"
         correct: false
         feedback: "Almost! 5 is just a number. A box needs a name, like x = 5!"
     \`\`\`
     
   - Step-by-step guide card:
     \`\`\`yaml
     type: step-by-step
     steps:
       - "Open your game file."
       - "Check line 3 for a print mistake."
       - "Run Agy again to check."
     \`\`\`
`;
    return `${prompt}\n\n${addendum}`;
  },

  buildTranslationPrompt(text, fromLang, toLang) {
    return `Translate the following text from language locale "${fromLang}" to language locale "${toLang}". Provide ONLY the direct translation. Do not add any greeting, explanation, markdown containers (except the translation itself), or meta text. Speak naturally in the target language.

Text: "${text}"`;
  }
};

// ============================================================================
// EXPRESS APP ORCHESTRATION & ROUTING
// ============================================================================

// Serve static files from the repository root
app.use(express.static(repoRoot));

// Serve index.html for the kids-terminal route
app.get('/apps/kids-terminal/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Config Endpoint: Merges .env values over config.json dynamically
app.get('/api/config', (req, res) => {
  const config = FileIOAdapter.readJson(path.join(__dirname, 'config.json'));
  if (config) {
    // Dynamic overlay from process.env
    if (process.env.FIREBASE_URL) config.firebase.url = process.env.FIREBASE_URL;
    if (process.env.FIREBASE_ROOT) config.firebase.root = process.env.FIREBASE_ROOT;
    if (process.env.FIREBASE_API_KEY) config.auth.apiKey = process.env.FIREBASE_API_KEY;
    
    if (process.env.PARENT_PIN) config.parent.pin = process.env.PARENT_PIN;
    if (process.env.PARENT_NOTIFY_URL) config.parent.notifyUrl = process.env.PARENT_NOTIFY_URL;
    if (process.env.PARENT_MASTER_EMAIL) config.parent.masterGatedEmail = process.env.PARENT_MASTER_EMAIL;
    
    if (process.env.CLI_EXECUTABLE) config.engine.cliExecutable = process.env.CLI_EXECUTABLE;
    
    res.json(config);
  } else {
    res.status(500).json({ error: 'Could not load settings config.json' });
  }
});

// Save Config Endpoint: Writes updates back to config.json (UI elements) and .env (secrets)
app.post('/api/save-config', (req, res) => {
  const incoming = req.body;
  const config = FileIOAdapter.readJson(path.join(__dirname, 'config.json'));

  if (!config) {
    res.status(500).json({ success: false, error: 'Could not read config.json' });
    return;
  }

  // 1. Separate UI elements to save in config.json
  config.theme = incoming.theme;
  config.layout = incoming.layout;
  config.engine.socraticMode = incoming.engine.socraticMode;
  config.engine.persona = incoming.engine.persona;
  config.speech = incoming.speech;

  // 2. Separate system path and key updates to save in .env
  const envUpdates = {};
  if (incoming.auth?.apiKey) envUpdates.FIREBASE_API_KEY = incoming.auth.apiKey;
  if (incoming.firebase?.url) envUpdates.FIREBASE_URL = incoming.firebase.url;
  if (incoming.parent?.pin) envUpdates.PARENT_PIN = incoming.parent.pin;
  if (incoming.parent?.notifyUrl) envUpdates.PARENT_NOTIFY_URL = incoming.parent.notifyUrl;
  
  const successJson = FileIOAdapter.writeJson(path.join(__dirname, 'config.json'), config);
  const successEnv = saveEnv(envUpdates);

  if (successJson && successEnv) {
    res.json({ success: true, message: 'Settings and environment variables saved successfully.' });
  } else {
    res.status(500).json({ success: false, error: 'Failed to write config updates.' });
  }
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

  const cliExecutable = process.env.CLI_EXECUTABLE || 'agy.exe';
  const skipPermissions = true; // Default safety bypass

  const translationPrompt = PromptBuilder.buildTranslationPrompt(text, fromLang, toLang);
  const args = [];
  if (skipPermissions) {
    args.push('--dangerously-skip-permissions');
  }
  args.push('-p', translationPrompt);

  let output = '';
  CliAdapter.run(
    cliExecutable,
    args,
    { cwd: repoRoot },
    (data) => { output += data.toString(); },
    (data) => {},
    (code) => {
      res.json({ success: true, translation: output.trim() });
    },
    (err) => {
      res.status(500).json({ error: err.message });
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

  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const config = FileIOAdapter.readJson(path.join(__dirname, 'config.json')) || { engine: {} };
  const socraticMode = config.engine.socraticMode !== false;
  const cliExecutable = process.env.CLI_EXECUTABLE || 'agy.exe';
  const skipPermissions = config.engine.skipPermissions !== false;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const finalPrompt = PromptBuilder.build(prompt, socraticMode, persona);

  const args = [];
  if (skipPermissions) {
    args.push('--dangerously-skip-permissions');
  }
  args.push('-p', finalPrompt);

  CliAdapter.run(
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
      res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
      res.end();
    },
    (err) => {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  );
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
    console.log(`================================================`);
    console.log(`🚀 Agy Cadet Space Station Server Running!`);
    console.log(`🌐 Local: http://localhost:${port}/apps/kids-terminal/`);
    console.log(`🔒 Tailscale: http://${TAILSCALE_IP}:${port}/apps/kids-terminal/`);
    console.log(`📁 Workspace: ${repoRoot}`);
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
