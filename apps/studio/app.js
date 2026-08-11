const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => (s || "").toString().replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const state = { session: null, profile: null, projects: [], pinned: [], currentProjectId: null, cards: [], lang: "en" };
const SIZES = ["S", "M", "W", "L", "T"];
const LANG_KEY = "arh-studio-lang";

function showView(id) {
  $all(".view").forEach((v) => (v.hidden = v.id !== id));
}

/* ---------------- i18n (EN / Bahasa Melayu) ---------------- */
const I18N = {
  en: {
    tagline: "Your own workspace — notes, photos, and video links, one project at a time.",
    tabLogin: "Log in",
    tabSignup: "Sign up",
    labelEmail: "Email",
    labelPassword: "Password",
    submitLogin: "Log in",
    submitSignup: "Sign up",
    signupHintOpen: "New here? Sign up with any email — ask a parent if you get stuck.",
    signupHintGated: "Only email addresses your admin has approved can sign up. Ask them to add yours first.",
    forgot: "Forgot password?",
    resetSent: "Reset email sent! Check your inbox (and the spam folder).",
    resetNeedEmail: "Type your email above first, then tap “Forgot password?”.",
    hi: "Hi",
    yourProjects: "Your projects",
    editName: "Edit name",
    signOut: "Sign out",
    quickAccess: "📌 Quick access",
    projects: "My Work",
    newProject: "+ New project",
    projectEmpty: "Nothing here yet — make your first project!",
    back: "← My Work",
    addCard: "+ Add card",
    cardEmpty: "Nothing here yet — make your first card!",
    addCardTitle: "Add a card",
    note: "Note",
    photo: "Photo",
    video: "Video link",
    cancel: "Cancel",
    ok: "OK",
    newProjectTitle: "Name your project",
    newProjectBody: "For example: Science Fair, Sejarah notes, Exam revision.",
    aliasTitle: "Your display name",
    deleteCardTitle: "Delete this card?",
    deleteCardBody: "This can't be undone.",
    firstProjectName: "My First Project",
    welcomeCardTitle: "Welcome to Studio! 👋",
    welcomeCardBody:
      "This is your own workspace: make a project for each subject or hobby, then fill it with note, photo, and video cards.\nTap “+ New project” on the home page to start your own!",
    created: "Created {date}",
    untitled: "Untitled",
    notePh: "Write a note…",
    titlePh: "Title",
    videoPh: "Paste a video link…",
    uploadNote: "Max 500KB per photo",
    pinTitle: "Pin for quick access",
    deleteTitle: "Delete",
    openVideo: "▶ Open video",
    errWrongCreds: "Wrong email or password.",
    errEmailExists: "That email already has an account — try logging in instead.",
    errWeakPassword: "Password must be at least 6 characters.",
    errNotEnabled: "Email sign-in is not enabled yet — ask a parent.",
    errTooMany: "Too many tries. Wait a minute and try again.",
    errNetwork: "No internet, or the server can't be reached. Check your connection and try again.",
    errGeneric: "Something went wrong. Try again, or ask a parent for help.",
    errNotApproved: "This email hasn't been approved yet. Ask your admin to add it, then try again.",
    errGateUnreachable: "Can't check the approved list right now. Check your internet and try again.",
    errSessionExpired: "Session expired, please sign in again.",
    errNotImage: "Please choose an image file.",
    errTooBig: "Couldn't shrink that photo under {kb}KB. Try a simpler or smaller image.",
    errOverLimit: "This would put you over your {mb}MB storage limit. Delete some photos first.",
  },
  ms: {
    tagline: "Ruang kerja anda sendiri — nota, gambar dan pautan video, satu projek pada satu masa.",
    tabLogin: "Log masuk",
    tabSignup: "Daftar",
    labelEmail: "E-mel",
    labelPassword: "Kata laluan",
    submitLogin: "Log masuk",
    submitSignup: "Daftar",
    signupHintOpen: "Baru di sini? Daftar dengan mana-mana e-mel — tanya ibu bapa jika ada masalah.",
    signupHintGated: "Hanya e-mel yang diluluskan oleh admin boleh mendaftar. Minta mereka tambahkan e-mel anda dahulu.",
    forgot: "Lupa kata laluan?",
    resetSent: "E-mel set semula telah dihantar! Semak peti masuk anda (dan folder spam).",
    resetNeedEmail: "Taip e-mel anda di atas dahulu, kemudian tekan “Lupa kata laluan?”.",
    hi: "Hai",
    yourProjects: "Projek anda",
    editName: "Ubah nama",
    signOut: "Log keluar",
    quickAccess: "📌 Capaian pantas",
    projects: "Kerja Saya",
    newProject: "+ Projek baharu",
    projectEmpty: "Belum ada apa-apa — buat projek pertama anda!",
    back: "← Kerja Saya",
    addCard: "+ Tambah kad",
    cardEmpty: "Belum ada apa-apa — buat kad pertama!",
    addCardTitle: "Tambah kad",
    note: "Nota",
    photo: "Gambar",
    video: "Pautan video",
    cancel: "Batal",
    ok: "OK",
    newProjectTitle: "Namakan projek anda",
    newProjectBody: "Contohnya: Pesta Sains, nota Sejarah, ulang kaji peperiksaan.",
    aliasTitle: "Nama paparan anda",
    deleteCardTitle: "Padam kad ini?",
    deleteCardBody: "Tindakan ini tidak boleh dibatalkan.",
    firstProjectName: "Projek Pertama Saya",
    welcomeCardTitle: "Selamat datang ke Studio! 👋",
    welcomeCardBody:
      "Ini ruang kerja anda sendiri: buat satu projek untuk setiap subjek atau hobi, kemudian isikan dengan kad nota, gambar dan video.\nTekan “+ Projek baharu” di halaman utama untuk mula!",
    created: "Dibuat {date}",
    untitled: "Tanpa tajuk",
    notePh: "Tulis nota…",
    titlePh: "Tajuk",
    videoPh: "Tampal pautan video…",
    uploadNote: "Maksimum 500KB setiap gambar",
    pinTitle: "Sematkan untuk capaian pantas",
    deleteTitle: "Padam",
    openVideo: "▶ Buka video",
    errWrongCreds: "E-mel atau kata laluan salah.",
    errEmailExists: "E-mel itu sudah ada akaun — cuba log masuk.",
    errWeakPassword: "Kata laluan mesti sekurang-kurangnya 6 aksara.",
    errNotEnabled: "Log masuk e-mel belum diaktifkan — tanya ibu bapa.",
    errTooMany: "Terlalu banyak percubaan. Tunggu sebentar dan cuba lagi.",
    errNetwork: "Tiada internet, atau pelayan tidak dapat dicapai. Semak sambungan anda dan cuba lagi.",
    errGeneric: "Ada masalah. Cuba lagi, atau minta bantuan ibu bapa.",
    errNotApproved: "E-mel ini belum diluluskan. Minta admin menambahkannya, kemudian cuba lagi.",
    errGateUnreachable: "Senarai kelulusan tidak dapat disemak sekarang. Semak internet anda dan cuba lagi.",
    errSessionExpired: "Sesi telah tamat, sila log masuk semula.",
    errNotImage: "Sila pilih fail gambar.",
    errTooBig: "Gambar itu tidak dapat dikecilkan bawah {kb}KB. Cuba gambar yang lebih mudah atau lebih kecil.",
    errOverLimit: "Ini akan melebihi had storan {mb}MB anda. Padam beberapa gambar dahulu.",
  },
};

function t(key, vars) {
  let s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

function initialLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "en" || saved === "ms") return saved;
  return (navigator.language || "").toLowerCase().startsWith("ms") ? "ms" : "en";
}

function applyI18n() {
  $all("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $("#authSubmit").textContent = authMode === "login" ? t("submitLogin") : t("submitSignup");
  $("#signupHint").textContent = APP_CONFIG.security.registrationGate ? t("signupHintGated") : t("signupHintOpen");
  $all(".lang-toggle").forEach((b) => (b.textContent = state.lang === "en" ? "Bahasa Melayu" : "English"));
  document.documentElement.lang = state.lang === "en" ? "en" : "ms";
}

$all(".lang-toggle").forEach((btn) =>
  btn.addEventListener("click", () => {
    state.lang = state.lang === "en" ? "ms" : "en";
    localStorage.setItem(LANG_KEY, state.lang);
    applyI18n();
    renderProjectGrid();
    renderPinnedRail();
    if (!$("#view-workspace").hidden) renderCardGrid();
  })
);

/* ---------------- Reusable prompt/confirm modal ---------------- */
function showModal({ title, body = null, input = null }) {
  return new Promise((resolve) => {
    $("#appModalTitle").textContent = title;
    const bodyEl = $("#appModalBody");
    bodyEl.hidden = !body;
    bodyEl.textContent = body || "";
    const inputEl = $("#appModalInput");
    inputEl.hidden = input === null;
    if (input !== null) inputEl.value = input;
    $("#appModalOk").textContent = t("ok");
    $("#appModalCancel").textContent = t("cancel");
    $("#appModal").hidden = false;
    if (input !== null) inputEl.focus();

    const close = (val) => {
      $("#appModal").hidden = true;
      $("#appModalOk").onclick = $("#appModalCancel").onclick = inputEl.onkeydown = null;
      resolve(val);
    };
    $("#appModalOk").onclick = () => close(input === null ? true : inputEl.value.trim() || null);
    $("#appModalCancel").onclick = () => close(null);
    inputEl.onkeydown = (e) => {
      if (e.key === "Enter") $("#appModalOk").click();
    };
  });
}

/* ---------------- Auth ---------------- */
let authMode = "login";
$all(".auth-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    authMode = tab.dataset.mode;
    $all(".auth-tab").forEach((tb) => tb.classList.toggle("active", tb === tab));
    $("#authSubmit").textContent = authMode === "login" ? t("submitLogin") : t("submitSignup");
    $("#signupHint").hidden = authMode !== "signup";
    hideAuthMessage();
  })
);

function showAuthMessage(msg, ok = false) {
  const el = $("#authMessage");
  el.textContent = msg;
  el.classList.toggle("ok", ok);
  el.hidden = false;
}
function hideAuthMessage() {
  $("#authMessage").hidden = true;
}

$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthMessage();
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const btn = $("#authSubmit");
  btn.disabled = true;
  try {
    state.session = authMode === "login" ? await Auth.signIn(email, password) : await Auth.signUp(email, password);
    await afterAuthSuccess();
  } catch (err) {
    showAuthMessage(friendlyAuthError(err.message));
  } finally {
    btn.disabled = false;
  }
});

$("#btnForgot").addEventListener("click", async () => {
  const email = $("#authEmail").value.trim();
  if (!email) return showAuthMessage(t("resetNeedEmail"));
  try {
    await Auth.sendPasswordReset(email);
    showAuthMessage(t("resetSent"), true);
  } catch (err) {
    showAuthMessage(friendlyAuthError(err.message));
  }
});

function friendlyAuthError(message) {
  const m = message || "";
  if (m.includes("EMAIL_EXISTS")) return t("errEmailExists");
  if (m.includes("EMAIL_NOT_FOUND") || m.includes("INVALID_PASSWORD") || m.includes("INVALID_LOGIN_CREDENTIALS"))
    return t("errWrongCreds");
  if (m.includes("WEAK_PASSWORD")) return t("errWeakPassword");
  if (m.includes("OPERATION_NOT_ALLOWED")) return t("errNotEnabled");
  if (m.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) return t("errTooMany");
  if (m.includes("Failed to fetch") || m.includes("NetworkError") || m.includes("fetch")) return t("errNetwork");
  return t("errGeneric");
}

/*
  Registration gate: read the live flag from studio/config/registrationGate
  first (flippable from dev.html without redeploying), fall back to the
  config file. If the DB flag can't be read (older rules, offline), use the
  file value.
*/
async function registrationGateOn() {
  const dbFlag = await Db.get("config/registrationGate", state.session.idToken).catch(() => undefined);
  if (typeof dbFlag === "boolean") return dbFlag;
  return APP_CONFIG.security.registrationGate === true;
}

async function afterAuthSuccess() {
  let alias = state.session.email.split("@")[0];
  if (await registrationGateOn()) {
    const key = emailKey(state.session.email);
    let allowed = null;
    try {
      allowed = await Db.get(`allowlist/${key}`, state.session.idToken);
    } catch {
      // Rules denied or DB unreachable — NOT the same as "not on the list".
      Auth.signOut();
      state.session = null;
      showAuthMessage(t("errGateUnreachable"));
      showView("view-auth");
      return;
    }
    if (!allowed) {
      Auth.signOut();
      state.session = null;
      showAuthMessage(t("errNotApproved"));
      showView("view-auth");
      return;
    }
    alias = allowed.alias || alias;
  }
  const isNewUser = await ensureProfile(alias);
  await loadLanding(isNewUser);
}

async function ensureProfile(defaultAlias) {
  const uid = state.session.uid;
  let profile = await Db.get(`users/${uid}/profile`, state.session.idToken).catch(() => null);
  let created = false;
  if (!profile) {
    profile = { email: state.session.email, alias: defaultAlias || state.session.email.split("@")[0], createdAt: Date.now() };
    await Db.set(`users/${uid}/profile`, state.session.idToken, profile);
    created = true;
  }
  state.profile = profile;
  return created;
}

$("#btnSignOut").addEventListener("click", () => {
  Auth.signOut();
  state.session = null;
  state.profile = null;
  $("#authEmail").value = "";
  $("#authPassword").value = "";
  showView("view-auth");
});

$("#btnEditAlias").addEventListener("click", async () => {
  const next = await showModal({ title: t("aliasTitle"), input: state.profile.alias });
  if (!next) return;
  state.profile.alias = next;
  await Db.update(`users/${state.session.uid}/profile`, state.session.idToken, { alias: next });
  renderLandingHeader();
});

/* ---------------- Landing ---------------- */
async function loadLanding(withOnboarding = false) {
  const uid = state.session.uid;
  const [projects, pinned] = await Promise.all([
    Db.get(`users/${uid}/projects`, state.session.idToken),
    Db.get(`users/${uid}/pinned`, state.session.idToken),
  ]);
  state.projects = Object.values(projects || {}).sort((a, b) => (b.order || 0) - (a.order || 0));
  state.pinned = Object.entries(pinned || {}).map(([cardId, v]) => ({ cardId, ...v }));
  if (withOnboarding && state.projects.length === 0) await createFirstProject();
  renderLandingHeader();
  renderPinnedRail();
  renderProjectGrid();
  showView("view-landing");
}

// First-run onboarding: a brand-new user lands on something alive instead
// of an empty grid.
async function createFirstProject() {
  const uid = state.session.uid;
  const id = uid8();
  const project = { id, name: t("firstProjectName"), order: Date.now(), createdAt: Date.now() };
  await Db.set(`users/${uid}/projects/${id}`, state.session.idToken, project);
  const card = {
    id: uid8(),
    type: "note",
    title: t("welcomeCardTitle"),
    body: t("welcomeCardBody"),
    size: "M",
    order: Date.now(),
    pinned: false,
  };
  await Db.set(`users/${uid}/cards/${id}/${card.id}`, state.session.idToken, card);
  state.projects.unshift(project);
}

function renderLandingHeader() {
  $("#landingAlias").textContent = state.profile ? `, ${state.profile.alias}` : "";
}

function renderPinnedRail() {
  const section = $("#pinnedSection");
  section.hidden = state.pinned.length === 0;
  $("#pinnedRail").innerHTML = state.pinned
    .map(
      (p) => `<button class="pinned-chip" data-project="${esc(p.projectId)}">
        <span class="pc-title">${esc(p.title || t("untitled"))}</span>
        <span class="pc-type">${cardTypeIcon(p.type)} ${p.type}</span>
      </button>`
    )
    .join("");
  $all(".pinned-chip", $("#pinnedRail")).forEach((chip) =>
    chip.addEventListener("click", () => openProject(chip.dataset.project))
  );
}

function renderProjectGrid() {
  const grid = $("#projectGrid");
  $("#projectEmpty").hidden = state.projects.length > 0;
  grid.innerHTML = state.projects
    .map(
      (p) => `<div class="deck-card" data-id="${esc(p.id)}">
        <h3>${esc(p.name)}</h3>
        <div class="deck-meta">${esc(t("created", { date: new Date(p.createdAt).toLocaleDateString() }))}</div>
      </div>`
    )
    .join("");
  $all(".deck-card", grid).forEach((card) => card.addEventListener("click", () => openProject(card.dataset.id)));
}

$("#btnNewProject").addEventListener("click", async () => {
  const name = await showModal({ title: t("newProjectTitle"), body: t("newProjectBody"), input: "" });
  if (!name) return;
  const id = uid8();
  const project = { id, name, order: Date.now(), createdAt: Date.now() };
  await Db.set(`users/${state.session.uid}/projects/${id}`, state.session.idToken, project);
  state.projects.unshift(project);
  renderProjectGrid();
  openProject(id);
});

/* ---------------- Workspace ---------------- */
async function openProject(id) {
  state.currentProjectId = id;
  const project = state.projects.find((p) => p.id === id);
  $("#projectNameInput").value = project ? project.name : "";
  const cards = await Db.get(`users/${state.session.uid}/cards/${id}`, state.session.idToken);
  state.cards = Object.values(cards || {}).sort((a, b) => (a.order || 0) - (b.order || 0));
  renderCardGrid();
  showView("view-workspace");
}

$("#btnBackToLanding").addEventListener("click", () => loadLanding());

$("#projectNameInput").addEventListener("change", async (e) => {
  const name = e.target.value.trim() || t("untitled");
  const project = state.projects.find((p) => p.id === state.currentProjectId);
  if (project) project.name = name;
  await Db.update(`users/${state.session.uid}/projects/${state.currentProjectId}`, state.session.idToken, { name });
});

function cardTypeIcon(type) {
  return { note: "📝", photo: "🖼️", video: "🎬" }[type] || "•";
}

function renderCardGrid() {
  const grid = $("#cardGrid");
  $("#cardEmpty").hidden = state.cards.length > 0;
  grid.innerHTML = state.cards.map(cardMarkup).join("");
  bindCardEvents();
}

function cardMarkup(card) {
  let body = "";
  if (card.type === "note") {
    body = `<textarea data-field="body" placeholder="${esc(t("notePh"))}">${esc(card.body)}</textarea>`;
  } else if (card.type === "photo") {
    body = card.imageData
      ? `<img src="${card.imageData}" alt="">`
      : `<div class="upload-row">
          <input type="file" accept="image/*" data-action="upload">
          <span class="usage-note">${esc(t("uploadNote"))}</span>
        </div>`;
  } else if (card.type === "video") {
    const embed = youtubeEmbedUrl(card.url);
    body = `<div class="upload-row">
      <input type="url" data-field="url" placeholder="${esc(t("videoPh"))}" value="${esc(card.url)}">
      ${embed ? `<iframe class="video-embed" src="${embed}" allowfullscreen></iframe>` : card.url ? `<a class="video-link" href="${esc(card.url)}" target="_blank" rel="noopener">${esc(t("openVideo"))}</a>` : ""}
    </div>`;
  }

  return `<div class="wb-card size-${card.size || "S"}" data-id="${esc(card.id)}">
    <div class="wb-card-head">
      <input class="wb-card-title" data-field="title" value="${esc(card.title)}" placeholder="${esc(t("titlePh"))}">
      <button class="wb-card-icon-btn ${card.pinned ? "pinned" : ""}" data-action="pin" title="${esc(t("pinTitle"))}">📌</button>
      <button class="wb-card-icon-btn" data-action="delete" title="${esc(t("deleteTitle"))}">✕</button>
    </div>
    <div class="wb-card-body">${body}</div>
    <div class="wb-card-footer">
      <div class="size-btns">
        ${SIZES.map((s) => `<button class="btn ${s === (card.size || "S") ? "btn-primary" : ""}" data-action="size" data-size="${s}">${s}</button>`).join("")}
      </div>
      <div class="row-actions">
        <button class="btn" data-action="up">↑</button>
        <button class="btn" data-action="down">↓</button>
      </div>
    </div>
  </div>`;
}

function youtubeEmbedUrl(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function findCard(id) {
  return state.cards.find((c) => c.id === id);
}

async function saveCard(card, patch) {
  await Db.update(`users/${state.session.uid}/cards/${state.currentProjectId}/${card.id}`, state.session.idToken, patch);
}

function bindCardEvents() {
  const grid = $("#cardGrid");

  $all("[data-field]", grid).forEach((el) => {
    const handler = debounce(async () => {
      const cardEl = el.closest(".wb-card");
      const card = findCard(cardEl.dataset.id);
      const field = el.dataset.field;
      card[field] = el.value;
      await saveCard(card, { [field]: el.value });
      if (field === "url") renderCardGrid();
    }, 500);
    el.addEventListener("input", handler);
  });

  $all("[data-action]", grid).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cardEl = btn.closest(".wb-card");
      const card = findCard(cardEl.dataset.id);
      const action = btn.dataset.action;

      if (action === "pin") await togglePin(card);
      if (action === "delete") await deleteCard(card);
      if (action === "size") {
        card.size = btn.dataset.size;
        await saveCard(card, { size: card.size });
        renderCardGrid();
      }
      if (action === "up" || action === "down") await reorderCard(card, action);
      if (action === "upload") {
        const file = cardEl.querySelector("input[type=file]").files[0];
        if (file) await handlePhotoUpload(card, file);
      }
    });
  });

  $all("input[type=file]", grid).forEach((input) =>
    input.addEventListener("change", async (e) => {
      const cardEl = input.closest(".wb-card");
      const card = findCard(cardEl.dataset.id);
      const file = e.target.files[0];
      if (file) await handlePhotoUpload(card, file);
    })
  );
}

async function togglePin(card) {
  card.pinned = !card.pinned;
  await saveCard(card, { pinned: card.pinned });
  const uid = state.session.uid;
  if (card.pinned) {
    await Db.set(`users/${uid}/pinned/${card.id}`, state.session.idToken, {
      projectId: state.currentProjectId,
      type: card.type,
      title: card.title || t("untitled"),
    });
  } else {
    await Db.remove(`users/${uid}/pinned/${card.id}`, state.session.idToken);
  }
  renderCardGrid();
}

async function deleteCard(card) {
  const yes = await showModal({ title: t("deleteCardTitle"), body: t("deleteCardBody") });
  if (!yes) return;
  await Db.remove(`users/${state.session.uid}/cards/${state.currentProjectId}/${card.id}`, state.session.idToken);
  if (card.pinned) await Db.remove(`users/${state.session.uid}/pinned/${card.id}`, state.session.idToken);
  if (card.type === "photo" && card.imageData) await adjustUsage(-byteLengthOfDataUrl(card.imageData));
  state.cards = state.cards.filter((c) => c.id !== card.id);
  renderCardGrid();
}

async function reorderCard(card, direction) {
  const idx = state.cards.indexOf(card);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= state.cards.length) return;
  const other = state.cards[swapIdx];
  [card.order, other.order] = [other.order, card.order];
  [state.cards[idx], state.cards[swapIdx]] = [state.cards[swapIdx], state.cards[idx]];
  await Promise.all([saveCard(card, { order: card.order }), saveCard(other, { order: other.order })]);
  renderCardGrid();
}

/* ---------------- Photo upload + usage limits ---------------- */
function byteLengthOfDataUrl(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

async function adjustUsage(deltaBytes) {
  const uid = state.session.uid;
  const current = (await Db.get(`users/${uid}/usageBytes`, state.session.idToken)) || 0;
  const next = Math.max(0, current + deltaBytes);
  await Db.set(`users/${uid}/usageBytes`, state.session.idToken, next);
  return next;
}

function loadImageEl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Downscales + re-encodes as JPEG until it fits maxBytes. Phone camera
// photos are typically several MB, so a hard size reject would make the
// photo card unusable — this makes "max 500KB" actually work in practice.
async function compressImage(file, maxBytes) {
  const img = await loadImageEl(file);
  let maxDim = 1600;
  for (let attempt = 0; attempt < 6; attempt++) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.6, 0.4, 0.25]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (byteLengthOfDataUrl(dataUrl) <= maxBytes) return dataUrl;
    }
    maxDim = Math.round(maxDim * 0.7);
  }
  return null;
}

async function handlePhotoUpload(card, file) {
  const limits = APP_CONFIG.limits;
  if (!file.type.startsWith("image/")) {
    alert(t("errNotImage"));
    return;
  }

  const dataUrl = await compressImage(file, limits.maxImageBytes);
  if (!dataUrl) {
    alert(t("errTooBig", { kb: Math.round(limits.maxImageBytes / 1024) }));
    return;
  }
  const newBytes = byteLengthOfDataUrl(dataUrl);

  const uid = state.session.uid;
  const currentUsage = (await Db.get(`users/${uid}/usageBytes`, state.session.idToken)) || 0;
  const previousBytes = card.imageData ? byteLengthOfDataUrl(card.imageData) : 0;
  if (currentUsage - previousBytes + newBytes > limits.maxUserBytes) {
    alert(t("errOverLimit", { mb: Math.round(limits.maxUserBytes / 1024 / 1024) }));
    return;
  }

  card.imageData = dataUrl;
  await saveCard(card, { imageData: dataUrl });
  await adjustUsage(newBytes - previousBytes);
  renderCardGrid();
}

/* ---------------- Add card modal ---------------- */
$("#btnAddCard").addEventListener("click", () => ($("#addCardModal").hidden = false));
$("#btnCancelAddCard").addEventListener("click", () => ($("#addCardModal").hidden = true));
$all(".template-option", $("#addCardModal")).forEach((opt) =>
  opt.addEventListener("click", async () => {
    const type = opt.dataset.type;
    const id = uid8();
    const card = { id, type, title: "", size: "S", order: Date.now(), pinned: false };
    if (type === "note") card.body = "";
    if (type === "video") card.url = "";
    await Db.set(`users/${state.session.uid}/cards/${state.currentProjectId}/${id}`, state.session.idToken, card);
    state.cards.push(card);
    $("#addCardModal").hidden = true;
    renderCardGrid();
  })
);

/* ---------------- Utils ---------------- */
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ---------------- Boot ---------------- */
function configIsReady() {
  const key = (APP_CONFIG.auth && APP_CONFIG.auth.apiKey) || "";
  return Boolean(key) && !key.startsWith("REPLACE_WITH");
}

(async function boot() {
  state.lang = initialLang();
  applyI18n();
  if (!configIsReady()) {
    // Placeholder API key — never attempt auth calls; show the setup panel.
    $("#setupPanel").hidden = false;
    $("#authArea").hidden = true;
    return showView("view-auth");
  }
  try {
    const session = await Auth.currentSession();
    if (!session) return showView("view-auth");
    state.session = session;
    await afterAuthSuccess();
  } catch {
    // Refresh (or a boot-time load) failed — say so instead of silently
    // dumping the user on the auth view.
    Auth.signOut();
    state.session = null;
    showAuthMessage(t("errSessionExpired"));
    showView("view-auth");
  }
})();
