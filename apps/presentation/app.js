import {
  addSource,
  applySlideAction,
  clampSlideIndex,
  createSlide,
  deleteSlide,
  duplicateSlide,
  insertSlides,
  moveSlide,
  renameDeck,
  replaceSlide,
  updateSlideField
} from "./deck-core.js";
import {adaptModule, adapterFromFile, ModuleAdapters} from "./deck-modules.js";
import {esc, slideMarkup, templateOptions, thumbLabel} from "./slide-renderer.js";
import {createLocalDeckStore} from "./storage-port.js";

const store = createLocalDeckStore();
const state = {deck: null, slideIndex: 0};

const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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
  ideaQuery: $("#ideaQuery")
};

function boot() {
  bindDeckList();
  bindEditor();
  bindTemplateModal();
  bindInspiration();
  renderDeckList();
}

function bindDeckList() {
  $("#btnNewDeck").addEventListener("click", () => {
    const title = prompt("Deck name:", "My Presentation");
    if (title === null) return;
    openDeck(store.createDeck(title || "Untitled Deck").id);
  });
}

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

  let touchStartX = null;
  $("#presentOverlay").addEventListener("touchstart", event => {
    touchStartX = event.touches[0].clientX;
  });
  $("#presentOverlay").addEventListener("touchend", event => {
    if (touchStartX === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX;
    if (dx < -40) presentNext();
    if (dx > 40) presentPrev();
    touchStartX = null;
  });
}

function bindTemplateModal() {
  $("#btnAddSlide").addEventListener("click", openTemplateModal);
  $("#btnCancelTemplate").addEventListener("click", () => {
    els.templateModal.hidden = true;
  });
  $("#btnAddModule").addEventListener("click", addModuleSlides);
  els.moduleFile.addEventListener("change", onModuleFile);

  els.moduleKind.innerHTML = Object.entries(ModuleAdapters)
    .map(([kind, adapter]) => `<option value="${kind}">${esc(adapter.label)}</option>`)
    .join("");
  els.moduleKind.addEventListener("change", updateModuleHint);
  updateModuleHint();
}

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

function renderDeckList() {
  const decks = store.listDecks();
  els.deckGrid.innerHTML = "";
  els.emptyState.hidden = decks.length > 0;
  decks.forEach(deck => {
    const card = document.createElement("div");
    card.className = "deck-card";
    card.innerHTML = `
      <h3>${esc(deck.title)}</h3>
      <div class="deck-meta">${deck.slides.length} slide${deck.slides.length === 1 ? "" : "s"} · updated ${new Date(deck.updatedAt).toLocaleDateString()}</div>
      <div class="deck-actions">
        <button class="btn" data-action="duplicate">Duplicate</button>
        <button class="btn btn-danger" data-action="delete">Delete</button>
      </div>`;
    card.addEventListener("click", event => {
      const action = event.target.dataset.action;
      if (action === "delete") {
        event.stopPropagation();
        if (confirm(`Delete "${deck.title}"? This can't be undone.`)) {
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
      openDeck(deck.id);
    });
    els.deckGrid.append(card);
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
    button.innerHTML = `<span class="thumb-type">${esc(templateIcon(slide.type))} ${index + 1}</span><span class="thumb-label">${esc(thumbLabel(slide)).slice(0, 24)}</span>`;
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

function renderCanvas() {
  const slide = state.deck.slides[state.slideIndex];
  els.slideCanvas.innerHTML = slide ? slideMarkup(slide, true) : `<p class="muted no-slide">No slides yet. Add a template or generate a reusable module.</p>`;
}

function renderSources() {
  els.sourceList.innerHTML = "";
  if (!state.deck.sources.length) {
    els.sourceList.innerHTML = `<p class="muted">No sources saved yet.</p>`;
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
  const nextSlide = updateSlideField(slide, target.dataset.field, value, target.dataset.index === undefined ? undefined : Number(target.dataset.index));
  state.deck = replaceSlide(state.deck, state.slideIndex, nextSlide);
  if (target.dataset.field === "imageUrl") renderCanvas();
  renderSlideStrip();
  persist();
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

function deleteCurrentSlide() {
  if (!confirm("Delete this slide?")) return;
  const result = deleteSlide(state.deck, state.slideIndex);
  state.deck = result.deck;
  state.slideIndex = result.index;
  renderEditor();
  persist();
}

function openTemplateModal() {
  els.templateGrid.innerHTML = "";
  templateOptions().forEach(option => {
    const button = document.createElement("button");
    button.className = "template-option";
    button.innerHTML = `<span class="t-icon">${esc(option.icon)}</span>${esc(option.label)}`;
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
  $("#moduleHint").textContent = ModuleAdapters[els.moduleKind.value]?.hint || "";
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

function enterPresentMode() {
  if (!state.deck.slides.length) return alert("Add at least one slide first.");
  state.slideIndex = 0;
  $("#presentOverlay").hidden = false;
  renderPresentSlide();
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
  $("#presentOverlay").hidden = true;
  renderEditor();
}

function onPresentKeydown(event) {
  if ($("#presentOverlay").hidden) return;
  if (event.key === "ArrowRight" || event.key === " ") presentNext();
  if (event.key === "ArrowLeft") presentPrev();
  if (event.key === "Escape") exitPresent();
}

function exportPdf() {
  const sheet = $("#printSheet");
  sheet.innerHTML = state.deck.slides
    .map(slide => `<div class="print-slide glass-card">${slideMarkup(slide, false)}</div>`)
    .join("");
  window.print();
}

function persist() {
  if (state.deck) state.deck = store.saveDeck(state.deck);
}

function templateIcon(type) {
  return templateOptions().find(option => option.type === type)?.icon || "Slide";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

boot();
