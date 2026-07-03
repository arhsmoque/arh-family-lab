const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => (s || "").toString().replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const state = { session: null, profile: null, projects: [], pinned: [], currentProjectId: null, cards: [] };
const SIZES = ["S", "M", "W", "L", "T"];

function showView(id) {
  $all(".view").forEach((v) => (v.hidden = v.id !== id));
}

/* ---------------- Auth ---------------- */
let authMode = "login";
$all(".auth-tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    authMode = tab.dataset.mode;
    $all(".auth-tab").forEach((t) => t.classList.toggle("active", t === tab));
    $("#authSubmit").textContent = authMode === "login" ? "Log in" : "Sign up";
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

function friendlyAuthError(message) {
  if (message.includes("EMAIL_EXISTS")) return "That email already has an account — try logging in instead.";
  if (message.includes("EMAIL_NOT_FOUND") || message.includes("INVALID_PASSWORD") || message.includes("INVALID_LOGIN_CREDENTIALS"))
    return "Wrong email or password.";
  if (message.includes("WEAK_PASSWORD")) return "Password must be at least 6 characters.";
  return message;
}

async function afterAuthSuccess() {
  const key = emailKey(state.session.email);
  const allowed = await Db.get(`allowlist/${key}`, state.session.idToken).catch(() => null);
  if (!allowed) {
    Auth.signOut();
    state.session = null;
    showAuthMessage("This email hasn't been approved yet. Ask your admin to add it, then try again.");
    return;
  }
  await ensureProfile(allowed.alias);
  await loadLanding();
}

async function ensureProfile(defaultAlias) {
  const uid = state.session.uid;
  let profile = await Db.get(`users/${uid}/profile`, state.session.idToken).catch(() => null);
  if (!profile) {
    profile = { email: state.session.email, alias: defaultAlias || state.session.email.split("@")[0], createdAt: Date.now() };
    await Db.set(`users/${uid}/profile`, state.session.idToken, profile);
  }
  state.profile = profile;
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
  const next = prompt("Your display name:", state.profile.alias);
  if (!next) return;
  state.profile.alias = next;
  await Db.update(`users/${state.session.uid}/profile`, state.session.idToken, { alias: next });
  renderLandingHeader();
});

/* ---------------- Landing ---------------- */
async function loadLanding() {
  const uid = state.session.uid;
  const [projects, pinned] = await Promise.all([
    Db.get(`users/${uid}/projects`, state.session.idToken),
    Db.get(`users/${uid}/pinned`, state.session.idToken),
  ]);
  state.projects = Object.values(projects || {}).sort((a, b) => (b.order || 0) - (a.order || 0));
  state.pinned = Object.entries(pinned || {}).map(([cardId, v]) => ({ cardId, ...v }));
  renderLandingHeader();
  renderPinnedRail();
  renderProjectGrid();
  showView("view-landing");
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
        <span class="pc-title">${esc(p.title || "Untitled")}</span>
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
        <div class="deck-meta">Created ${new Date(p.createdAt).toLocaleDateString()}</div>
      </div>`
    )
    .join("");
  $all(".deck-card", grid).forEach((card) => card.addEventListener("click", () => openProject(card.dataset.id)));
}

$("#btnNewProject").addEventListener("click", async () => {
  const name = prompt("Project name (e.g. Science Fair, Group History Project):");
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
  const name = e.target.value.trim() || "Untitled project";
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
    body = `<textarea data-field="body" placeholder="Write a note…">${esc(card.body)}</textarea>`;
  } else if (card.type === "photo") {
    body = card.imageData
      ? `<img src="${card.imageData}" alt="">`
      : `<div class="upload-row">
          <input type="file" accept="image/*" data-action="upload">
          <span class="usage-note">Max 500KB per photo</span>
        </div>`;
  } else if (card.type === "video") {
    const embed = youtubeEmbedUrl(card.url);
    body = `<div class="upload-row">
      <input type="url" data-field="url" placeholder="Paste a video link…" value="${esc(card.url)}">
      ${embed ? `<iframe class="video-embed" src="${embed}" allowfullscreen></iframe>` : card.url ? `<a class="video-link" href="${esc(card.url)}" target="_blank" rel="noopener">▶ Open video</a>` : ""}
    </div>`;
  }

  return `<div class="wb-card size-${card.size || "S"}" data-id="${esc(card.id)}">
    <div class="wb-card-head">
      <input class="wb-card-title" data-field="title" value="${esc(card.title)}" placeholder="Title">
      <button class="wb-card-icon-btn ${card.pinned ? "pinned" : ""}" data-action="pin" title="Pin for quick access">📌</button>
      <button class="wb-card-icon-btn" data-action="delete" title="Delete">✕</button>
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
      title: card.title || "Untitled",
    });
  } else {
    await Db.remove(`users/${uid}/pinned/${card.id}`, state.session.idToken);
  }
  renderCardGrid();
}

async function deleteCard(card) {
  if (!confirm("Delete this card?")) return;
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
  const limits = STUDIO_APP_CONFIG.limits;
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    return;
  }

  const dataUrl = await compressImage(file, limits.maxImageBytes);
  if (!dataUrl) {
    alert(`Couldn't shrink that photo under ${Math.round(limits.maxImageBytes / 1024)}KB. Try a simpler or smaller image.`);
    return;
  }
  const newBytes = byteLengthOfDataUrl(dataUrl);

  const uid = state.session.uid;
  const currentUsage = (await Db.get(`users/${uid}/usageBytes`, state.session.idToken)) || 0;
  const previousBytes = card.imageData ? byteLengthOfDataUrl(card.imageData) : 0;
  if (currentUsage - previousBytes + newBytes > limits.maxUserBytes) {
    alert(`This would put you over your ${Math.round(limits.maxUserBytes / 1024 / 1024)}MB storage limit. Delete some photos first.`);
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
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ---------------- Boot ---------------- */
(async function boot() {
  try {
    const session = await Auth.currentSession();
    if (!session) return showView("view-auth");
    state.session = session;
    await afterAuthSuccess();
  } catch {
    showView("view-auth");
  }
})();
