import {
  addSource,
  applySlideAction,
  clampSlideIndex,
  createSlide,
  deckFromJson,
  deckToJson,
  deleteSlide,
  duplicateSlide,
  insertSlides,
  moveSlide,
  renameDeck,
  replaceSlide,
  updateSlideField
} from "./deck-core.js";
import {adaptModule, adapterFromFile, ModuleAdapters} from "./deck-modules.js";
import {chartRowsMarkup, esc, slideMarkup, templateOptions, thumbLabel} from "./slide-renderer.js";
import {createLocalDeckStore} from "./storage-port.js";
import {getLang, setLang, t} from "./i18n.js";

const store = createLocalDeckStore(undefined, onStoreWriteError);
const state = {deck: null, slideIndex: 0, lang: getLang()};

const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const tr = key => t(state.lang, key);

const els = {
  deckGrid: $("#deckGrid"),
  emptyState: $("#emptyState"),
  editor: $("#view-editor"),
  deckTitle: $("#deckTitleInput"),
  slideStrip: $("#slideStrip"),
  slideCanvas: $("#slideCanvas"),
  sourceList: $("#sourceList"),
  templateModal: $("#templateModal"),
  templateGrid: $("#templateGrid"),
  moduleKind: $("#moduleKind"),
  moduleInput: $("#moduleInput"),
  moduleFile: $("#moduleFile"),
  inspirationModal: $("#inspirationModal"),
  ideaQuery: $("#ideaQuery"),
  saveIndicator: $("#saveIndicator"),
  presentOverlay: $("#presentOverlay")
};

function boot() {
  bindDeckList();
  bindEditor();
  bindTemplateModal();
  bindInspiration();
  bindLanguageToggle();
  applyStaticStrings();
  seedSampleDeck();
  renderDeckList();
}

// ---------- Language ----------

function bindLanguageToggle() {
  $all(".lang-toggle").forEach(button => {
    button.addEventListener("click", () => {
      state.lang = state.lang === "en" ? "bm" : "en";
      setLang(state.lang);
      applyStaticStrings();
      renderModuleKinds();
      if (state.deck) renderEditor();
      renderDeckList();
    });
  });
}

function applyStaticStrings() {
  document.documentElement.lang = state.lang === "bm" ? "ms" : "en";
  $all("[data-i18n]").forEach(node => {
    const value = tr(node.dataset.i18n);
    if (typeof value === "string") node.textContent = value;
  });
  $all("[data-i18n-placeholder]").forEach(node => {
    const value = tr(node.dataset.i18nPlaceholder);
    if (typeof value === "string") node.placeholder = value;
  });
  $all("[data-i18n-aria]").forEach(node => {
    const value = tr(node.dataset.i18nAria);
    if (typeof value === "string") node.setAttribute("aria-label", value);
  });
  $all(".lang-toggle").forEach(button => {
    button.textContent = state.lang === "en" ? "BM" : "EN";
  });
  updateModuleHint();
}

// ---------- Reusable in-page modal (replaces prompt/confirm/alert) ----------

function uiModal({title, message, input, inputValue = "", confirmText, danger = false, cancellable = true}) {
  return new Promise(resolve => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop ui-modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal ui-modal glass-card" role="dialog" aria-modal="true">
        <h2 class="fd">${esc(title)}</h2>
        ${message ? `<p class="muted ui-modal-msg"></p>` : ""}
        ${input ? `<input class="idea-input ui-modal-input" type="text">` : ""}
        <div class="ui-modal-actions">
          ${cancellable ? `<button class="btn btn-ghost" data-role="cancel">${esc(tr("cancel"))}</button>` : ""}
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-role="confirm">${esc(confirmText || tr("ok"))}</button>
        </div>
      </div>`;
    const msgEl = $(".ui-modal-msg", backdrop);
    if (msgEl) msgEl.textContent = message;
    const inputEl = $(".ui-modal-input", backdrop);
    if (inputEl) {
      inputEl.placeholder = input;
      inputEl.value = inputValue;
    }
    const close = value => {
      backdrop.remove();
      document.removeEventListener("keydown", onKey);
      resolve(value);
    };
    const onKey = event => {
      if (event.key === "Escape") close(null);
      if (event.key === "Enter" && inputEl) close(inputEl.value.trim());
    };
    $("[data-role='confirm']", backdrop).addEventListener("click", () => close(inputEl ? inputEl.value.trim() : true));
    const cancelBtn = $("[data-role='cancel']", backdrop);
    if (cancelBtn) cancelBtn.addEventListener("click", () => close(null));
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) close(null);
    });
    document.addEventListener("keydown", onKey);
    document.body.append(backdrop);
    (inputEl || $("[data-role='confirm']", backdrop)).focus();
    if (inputEl) inputEl.select();
  });
}

let quotaWarnVisible = false;
function onStoreWriteError() {
  if (quotaWarnVisible) return;
  quotaWarnVisible = true;
  uiModal({title: tr("quotaTitle"), message: tr("quotaMsg"), cancellable: false})
    .then(() => {
      quotaWarnVisible = false;
    });
}

// ---------- Deck list ----------

function bindDeckList() {
  $("#btnNewDeck").addEventListener("click", async () => {
    const title = await uiModal({
      title: tr("deckNameTitle"),
      input: tr("deckNameDefault"),
      inputValue: "",
      confirmText: tr("create")
    });
    if (title === null) return;
    openDeck(store.createDeck(title || tr("untitledDeck")).id);
  });
  $("#btnImportDeck").addEventListener("click", () => $("#importDeckFile").click());
  $("#importDeckFile").addEventListener("change", onImportDeckFile);
}

function renderDeckList() {
  const decks = store.listDecks();
  els.deckGrid.innerHTML = "";
  els.emptyState.hidden = decks.length > 0;
  decks.forEach(deck => {
    const card = document.createElement("div");
    card.className = "deck-card";
    card.innerHTML = `
      <h3>${esc(deck.title)}</h3>
      <div class="deck-meta">${esc(tr("slidesWord")(deck.slides.length))} · ${esc(tr("updatedPrefix"))} ${new Date(deck.updatedAt).toLocaleDateString()}</div>
      <div class="deck-actions">
        <button class="btn" data-action="export">${esc(tr("export"))}</button>
        <button class="btn" data-action="duplicate">${esc(tr("duplicate"))}</button>
        <button class="btn btn-danger" data-action="delete">${esc(tr("delete"))}</button>
      </div>`;
    card.addEventListener("click", async event => {
      const action = event.target.dataset.action;
      if (action === "delete") {
        event.stopPropagation();
        const confirmed = await uiModal({
          title: tr("deleteDeckTitle"),
          message: tr("deleteDeckMsg")(deck.title),
          confirmText: tr("delete"),
          danger: true
        });
        if (confirmed) {
          store.deleteDeck(deck.id);
          renderDeckList();
        }
        return;
      }
      if (action === "duplicate") {
        event.stopPropagation();
        store.duplicateDeck(deck.id);
        renderDeckList();
        return;
      }
      if (action === "export") {
        event.stopPropagation();
        downloadDeck(deck);
        return;
      }
      openDeck(deck.id);
    });
    els.deckGrid.append(card);
  });
}

function downloadDeck(deck) {
  const blob = new Blob([deckToJson(deck)], {type: "application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const safeName = deck.title.replace(/[^\w\- ]+/g, "").trim() || "deck";
  link.download = `${safeName}.deckmate.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function onImportDeckFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const deck = deckFromJson(await file.text());
    store.saveDeck(deck);
    renderDeckList();
  } catch {
    uiModal({title: tr("invalidFileTitle"), message: tr("invalidFileMsg"), cancellable: false});
  }
}

// ---------- First-run sample deck ----------

const SEED_FLAG = "arh-deckmate-seeded-v1";

function seedSampleDeck() {
  try {
    if (window.localStorage.getItem(SEED_FLAG)) return;
    window.localStorage.setItem(SEED_FLAG, "1");
    if (store.listDecks().length) return;
    const deck = store.createDeck("My First Deck / Dek Pertama Saya");
    const slides = [
      createSlide("title", {
        heading: "Tokoh Kemerdekaan Malaysia",
        subheading: "Contoh dek / Sample deck — klik teks untuk sunting / click text to edit"
      }),
      createSlide("bullets", {
        heading: "Tokoh kemerdekaan / Independence heroes",
        items: [
          "Tunku Abdul Rahman — Perdana Menteri pertama",
          "Dato' Onn Jaafar — Pengasas UMNO",
          "Tun V.T. Sambanthan",
          "Tan Cheng Lock"
        ]
      }),
      createSlide("timeline", {
        heading: "Jalan ke Merdeka / Road to independence",
        steps: [
          {label: "1946", detail: "Bangsa Melayu bersatu menentang Malayan Union"},
          {label: "1956", detail: "Rundingan kemerdekaan di London"},
          {label: "31 Ogos 1957", detail: "Hari Kemerdekaan!"}
        ]
      }),
      createSlide("chart", {
        heading: "Kegemaran kelas / Class favourites",
        rows: [
          {label: "Nasi lemak", value: 8},
          {label: "Roti canai", value: 6},
          {label: "Cendol", value: 4}
        ]
      })
    ];
    store.saveDeck(insertSlides(deck, slides, -1));
  } catch { /* seeding is best-effort; never block boot */ }
}

// ---------- Editor ----------

function bindEditor() {
  $("#btnBack").addEventListener("click", () => {
    persist();
    state.deck = null;
    showView("view-list");
    renderDeckList();
  });

  els.deckTitle.addEventListener("input", event => {
    state.deck = renameDeck(state.deck, event.target.value);
    persist();
  });

  els.slideCanvas.addEventListener("input", onCanvasInput);
  els.slideCanvas.addEventListener("change", () => renderCanvas());
  els.slideCanvas.addEventListener("click", onCanvasAction);

  $("#btnMoveUp").addEventListener("click", () => moveCurrentSlide(-1));
  $("#btnMoveDown").addEventListener("click", () => moveCurrentSlide(1));
  $("#btnDuplicateSlide").addEventListener("click", duplicateCurrentSlide);
  $("#btnDeleteSlide").addEventListener("click", deleteCurrentSlide);
  $("#btnPresent").addEventListener("click", enterPresentMode);
  $("#btnExport").addEventListener("click", exportPdf);

  $("#btnNext").addEventListener("click", presentNext);
  $("#btnPrev").addEventListener("click", presentPrev);
  $("#btnExitPresent").addEventListener("click", exitPresent);
  document.addEventListener("keydown", onPresentKeydown);
  document.addEventListener("fullscreenchange", onFullscreenChange);

  let touchStartX = null;
  els.presentOverlay.addEventListener("touchstart", event => {
    touchStartX = event.touches[0].clientX;
  });
  els.presentOverlay.addEventListener("touchend", event => {
    if (touchStartX === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    if (dx < -40) presentNext();
    if (dx > 40) presentPrev();
    touchStartX = null;
  });
}

function openDeck(id) {
  state.deck = store.getDeck(id);
  state.slideIndex = 0;
  showView("view-editor");
  els.deckTitle.value = state.deck.title;
  renderEditor();
}

function showView(id) {
  $all(".view").forEach(view => {
    view.hidden = view.id !== id;
  });
}

function renderEditor() {
  state.slideIndex = clampSlideIndex(state.deck, state.slideIndex);
  renderSlideStrip();
  renderCanvas();
  renderSources();
}

function renderSlideStrip() {
  els.slideStrip.innerHTML = "";
  state.deck.slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.className = `slide-thumb${index === state.slideIndex ? " active" : ""}`;
    button.innerHTML = `<span class="thumb-type">${esc(templateName(slide.type))} ${index + 1}</span><span class="thumb-label">${esc(thumbLabel(slide)).slice(0, 24)}</span>`;
    button.addEventListener("click", () => {
      state.slideIndex = index;
      renderEditor();
    });
    els.slideStrip.append(button);
  });
  const hasSlides = state.deck.slides.length > 0;
  $("#btnMoveUp").disabled = !hasSlides || state.slideIndex === 0;
  $("#btnMoveDown").disabled = !hasSlides || state.slideIndex === state.deck.slides.length - 1;
  $("#btnDuplicateSlide").disabled = !hasSlides;
  $("#btnDeleteSlide").disabled = !hasSlides;
}

function slideLabels() {
  return {
    addPoint: tr("slide.addPoint"),
    addStep: tr("slide.addStep"),
    addRow: tr("slide.addRow"),
    removeStep: tr("slide.removeStep"),
    imageUrlPlaceholder: tr("slide.imageUrlPlaceholder"),
    chartLabelPlaceholder: tr("slide.chartLabelPlaceholder"),
    chartValuePlaceholder: tr("slide.chartValuePlaceholder"),
    noImageSet: tr("slide.noImageSet")
  };
}

function renderCanvas() {
  const slide = state.deck.slides[state.slideIndex];
  els.slideCanvas.innerHTML = slide ? slideMarkup(slide, true, slideLabels()) : `<p class="muted no-slide">${esc(tr("addSlideTitle"))} → +</p>`;
}

function renderSources() {
  els.sourceList.innerHTML = "";
  if (!state.deck.sources.length) {
    els.sourceList.innerHTML = `<p class="muted">${esc(tr("noSources"))}</p>`;
    return;
  }
  state.deck.sources.forEach(source => {
    const item = document.createElement("a");
    item.className = "source-item";
    item.href = source.url || "#";
    item.target = "_blank";
    item.rel = "noopener";
    item.innerHTML = `<strong>${esc(source.title)}</strong><span>${esc(source.url)}</span>`;
    els.sourceList.append(item);
  });
}

function onCanvasInput(event) {
  const target = event.target.closest("[data-field]");
  if (!target) return;
  const slide = state.deck.slides[state.slideIndex];
  const value = target.tagName === "INPUT" ? target.value : target.innerText;
  const field = target.dataset.field;
  const nextSlide = updateSlideField(slide, field, value, target.dataset.index === undefined ? undefined : Number(target.dataset.index));
  state.deck = replaceSlide(state.deck, state.slideIndex, nextSlide);
  // Never re-render the canvas while typing — it would destroy the focused
  // input. Patch just the live preview instead; the `change` (blur) listener
  // re-renders once editing is done.
  if (field === "imageUrl") updateImagePreview(value);
  if (field === "rows.label" || field === "rows.value") updateChartPreview();
  renderSlideStrip();
  persist();
}

// Blocks javascript:/data: etc. from a pasted image URL. Modern browsers
// don't execute script from <img src> anyway, but there's no reason to
// accept anything other than an actual image link here.
function isSafeImageUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function updateImagePreview(url) {
  const wrap = els.slideCanvas.querySelector(".s-image");
  if (!wrap) return;
  let img = wrap.querySelector("img");
  if (url && isSafeImageUrl(url)) {
    if (!img) {
      img = document.createElement("img");
      img.alt = "";
      wrap.querySelector(".s-caption")?.before(img);
    }
    img.src = url;
  } else if (img) {
    img.remove();
  }
}

function updateChartPreview() {
  const chart = els.slideCanvas.querySelector(".s-chart");
  const slide = state.deck.slides[state.slideIndex];
  if (chart && slide) chart.innerHTML = chartRowsMarkup(slide.data.rows);
}

function onCanvasAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const slide = state.deck.slides[state.slideIndex];
  const nextSlide = applySlideAction(slide, button.dataset.action, button.dataset.list, Number(button.dataset.index));
  state.deck = replaceSlide(state.deck, state.slideIndex, nextSlide);
  renderEditor();
  persist();
}

function moveCurrentSlide(delta) {
  const result = moveSlide(state.deck, state.slideIndex, delta);
  state.deck = result.deck;
  state.slideIndex = result.index;
  renderEditor();
  persist();
}

function duplicateCurrentSlide() {
  const result = duplicateSlide(state.deck, state.slideIndex);
  state.deck = result.deck;
  state.slideIndex = result.index;
  renderEditor();
  persist();
}

async function deleteCurrentSlide() {
  const confirmed = await uiModal({
    title: tr("deleteSlideTitle"),
    message: tr("deleteSlideMsg"),
    confirmText: tr("delete"),
    danger: true
  });
  if (!confirmed) return;
  const result = deleteSlide(state.deck, state.slideIndex);
  state.deck = result.deck;
  state.slideIndex = result.index;
  renderEditor();
  persist();
}

// ---------- Template picker & text-to-slides ----------

function bindTemplateModal() {
  $("#btnAddSlide").addEventListener("click", openTemplateModal);
  $("#btnCancelTemplate").addEventListener("click", () => {
    els.templateModal.hidden = true;
  });
  $("#btnAddModule").addEventListener("click", addModuleSlides);
  els.moduleFile.addEventListener("change", onModuleFile);

  els.moduleKind.addEventListener("change", updateModuleHint);
  renderModuleKinds();
}

function renderModuleKinds() {
  els.moduleKind.innerHTML = Object.entries(ModuleAdapters)
    .map(([kind, adapter]) => `<option value="${kind}">${esc(tr(`adapter.${kind}`) || adapter.label)}</option>`)
    .join("");
}

function openTemplateModal() {
  els.templateGrid.innerHTML = "";
  renderModuleKinds();
  updateModuleHint();
  templateOptions().forEach(option => {
    const button = document.createElement("button");
    button.className = "template-option";
    button.innerHTML = `<span class="t-icon">${esc(templateName(option.type))}</span>${esc(templateName(option.type))}`;
    button.addEventListener("click", () => {
      state.deck = insertSlides(state.deck, [createSlide(option.type)], state.slideIndex);
      state.slideIndex = state.deck.slides.length === 1 ? 0 : state.slideIndex + 1;
      els.templateModal.hidden = true;
      renderEditor();
      persist();
    });
    els.templateGrid.append(button);
  });
  els.templateModal.hidden = false;
}

function addModuleSlides() {
  const slides = adaptModule(els.moduleKind.value, els.moduleInput.value);
  state.deck = insertSlides(state.deck, slides, state.slideIndex);
  state.slideIndex = clampSlideIndex(state.deck, state.slideIndex + 1);
  els.templateModal.hidden = true;
  renderEditor();
  persist();
}

async function onModuleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const kind = adapterFromFile(file);
  els.moduleKind.value = kind;
  updateModuleHint();
  els.moduleInput.value = kind === "image" ? await readFileAsDataUrl(file) : await file.text();
  event.target.value = "";
}

function updateModuleHint() {
  if (!els.moduleKind.value) return;
  const hint = tr(`adapterHint.${els.moduleKind.value}`);
  $("#moduleHint").textContent = hint || ModuleAdapters[els.moduleKind.value]?.hint || "";
}

// ---------- Inspiration modal ----------

function bindInspiration() {
  $("#btnInspiration").addEventListener("click", openInspiration);
  $("#btnOpenInspiration").addEventListener("click", openInspiration);
  $("#btnCloseInspiration").addEventListener("click", () => {
    els.inspirationModal.hidden = true;
  });
  els.ideaQuery.addEventListener("input", syncSearchLinks);
  $("#btnAddImageFromUrl").addEventListener("click", addImageFromUrl);
  $("#btnSaveSource").addEventListener("click", saveSourceFromModal);
  syncSearchLinks();
}

function openInspiration() {
  els.inspirationModal.hidden = false;
  syncSearchLinks();
}

function syncSearchLinks() {
  const query = encodeURIComponent(els.ideaQuery.value || state.deck?.title || "school presentation");
  const links = {
    canva: `https://www.canva.com/templates/search/presentations/?query=${query}`,
    googleImages: `https://www.google.com/search?tbm=isch&q=${query}`,
    wikimedia: `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image`,
    unsplash: `https://unsplash.com/s/photos/${query}`
  };
  $all("[data-search]").forEach(link => {
    link.href = links[link.dataset.search];
  });
}

function addImageFromUrl() {
  const url = $("#imageUrlQuick").value.trim();
  if (!url) return;
  state.deck = insertSlides(state.deck, [createSlide("image", {
    heading: "Image slide",
    imageUrl: url,
    caption: $("#imageCaptionQuick").value.trim() || "Caption / credit"
  })], state.slideIndex);
  state.slideIndex = clampSlideIndex(state.deck, state.slideIndex + 1);
  els.inspirationModal.hidden = true;
  renderEditor();
  persist();
}

function saveSourceFromModal() {
  state.deck = addSource(state.deck, {
    title: $("#sourceTitleInput").value,
    url: $("#sourceUrlInput").value
  });
  $("#sourceTitleInput").value = "";
  $("#sourceUrlInput").value = "";
  renderSources();
  persist();
}

// ---------- Present mode (real fullscreen) ----------

async function enterPresentMode() {
  if (!state.deck.slides.length) {
    uiModal({title: tr("present"), message: tr("needSlide"), cancellable: false});
    return;
  }
  state.slideIndex = 0;
  els.presentOverlay.hidden = false;
  renderPresentSlide();
  try {
    await els.presentOverlay.requestFullscreen();
  } catch { /* fullscreen denied/unavailable — overlay presentation still works */ }
}

function renderPresentSlide() {
  const slide = state.deck.slides[state.slideIndex];
  $("#presentSlide").innerHTML = slide ? slideMarkup(slide, false) : "";
  $("#presentCounter").textContent = `${state.slideIndex + 1} / ${state.deck.slides.length}`;
}

function presentNext() {
  if (state.slideIndex < state.deck.slides.length - 1) {
    state.slideIndex++;
    renderPresentSlide();
  }
}

function presentPrev() {
  if (state.slideIndex > 0) {
    state.slideIndex--;
    renderPresentSlide();
  }
}

function exitPresent() {
  els.presentOverlay.hidden = true;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  renderEditor();
}

// Esc inside native fullscreen exits fullscreen without a keydown we can rely
// on; the browser fires fullscreenchange instead, so keep state in sync here.
function onFullscreenChange() {
  if (!document.fullscreenElement && !els.presentOverlay.hidden) {
    els.presentOverlay.hidden = true;
    renderEditor();
  }
}

function onPresentKeydown(event) {
  if (els.presentOverlay.hidden) return;
  if (event.key === "ArrowRight" || event.key === " ") presentNext();
  if (event.key === "ArrowLeft") presentPrev();
  if (event.key === "Escape") exitPresent();
}

// ---------- PDF export (print) ----------

function exportPdf() {
  const sheet = $("#printSheet");
  sheet.innerHTML = state.deck.slides
    .map(slide => `<div class="print-slide glass-card">${slideMarkup(slide, false)}</div>`)
    .join("");
  window.print();
}

// ---------- Persistence ----------

let saveTimer = null;
function flashSaved() {
  els.saveIndicator.textContent = tr("saved");
  els.saveIndicator.classList.add("show");
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => els.saveIndicator.classList.remove("show"), 1600);
}

function persist() {
  if (!state.deck) return;
  state.deck = store.saveDeck(state.deck);
  flashSaved();
}

function templateName(type) {
  return tr(`template.${type}`) || templateOptions().find(option => option.type === type)?.label || type;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function mount({ manifest, plugins }) {
  // Deckmate is currently local-only; the shared runtime is available here
  // for future Firebase-backed deck sync. For now we just boot the existing app.
  boot();
}
