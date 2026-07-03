/* App state + view wiring. Slide markup is shared across editor / present / print. */
const state = { deck: null, slideIndex: 0 };

const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function persist() {
  if (state.deck) Storage.saveDeck(state.deck);
}

/* ---------------- Slide markup ---------------- */
function slideMarkup(slide, editable) {
  const d = slide.data;
  const ce = editable ? 'contenteditable="true"' : "";
  switch (slide.type) {
    case "title":
      return `<div class="slide-content s-title">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        <p class="s-subheading" data-field="subheading" ${ce}>${esc(d.subheading)}</p>
      </div>`;

    case "bullets":
      return `<div class="slide-content s-bullets">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        <ul>${d.items
          .map(
            (it, i) => `<li>
              <span data-field="items" data-index="${i}" ${ce}>${esc(it)}</span>
              ${editable ? `<button class="btn btn-ghost remove-item-btn" data-action="removeItem" data-list="items" data-index="${i}">✕</button>` : ""}
            </li>`
          )
          .join("")}</ul>
        ${editable ? `<button class="btn add-item" data-action="addItem" data-list="items">+ Add point</button>` : ""}
      </div>`;

    case "image":
      return `<div class="slide-content s-image">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        ${editable ? `<input class="img-url-input" data-field="imageUrl" placeholder="Paste an image URL…" value="${esc(d.imageUrl)}">` : ""}
        ${d.imageUrl ? `<img src="${esc(d.imageUrl)}" alt="">` : editable ? "" : `<p class="muted">No image set</p>`}
        <p class="s-caption" data-field="caption" ${ce}>${esc(d.caption)}</p>
      </div>`;

    case "compare":
      return `<div class="slide-content s-compare-wrap">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        <div class="s-compare">
          <div class="col">
            <h4 data-field="leftTitle" ${ce}>${esc(d.leftTitle)}</h4>
            <ul>${d.leftItems
              .map(
                (it, i) => `<li><span data-field="leftItems" data-index="${i}" ${ce}>${esc(it)}</span>
                ${editable ? `<button class="btn btn-ghost remove-item-btn" data-action="removeItem" data-list="leftItems" data-index="${i}">✕</button>` : ""}</li>`
              )
              .join("")}</ul>
            ${editable ? `<button class="btn add-item" data-action="addItem" data-list="leftItems">+ Add point</button>` : ""}
          </div>
          <div class="col">
            <h4 data-field="rightTitle" ${ce}>${esc(d.rightTitle)}</h4>
            <ul>${d.rightItems
              .map(
                (it, i) => `<li><span data-field="rightItems" data-index="${i}" ${ce}>${esc(it)}</span>
                ${editable ? `<button class="btn btn-ghost remove-item-btn" data-action="removeItem" data-list="rightItems" data-index="${i}">✕</button>` : ""}</li>`
              )
              .join("")}</ul>
            ${editable ? `<button class="btn add-item" data-action="addItem" data-list="rightItems">+ Add point</button>` : ""}
          </div>
        </div>
      </div>`;

    case "timeline":
      return `<div class="slide-content s-timeline-wrap">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        <div class="s-timeline">
          ${d.steps
            .map(
              (s, i) => `<div class="step">
                <div class="step-label" data-field="steps.label" data-index="${i}" ${ce}>${esc(s.label)}</div>
                <div class="step-detail" data-field="steps.detail" data-index="${i}" ${ce}>${esc(s.detail)}</div>
                ${editable ? `<button class="btn btn-ghost remove-item-btn" data-action="removeStep" data-index="${i}">✕ remove</button>` : ""}
              </div>`
            )
            .join("")}
        </div>
        ${editable ? `<button class="btn add-item" data-action="addStep">+ Add step</button>` : ""}
      </div>`;

    case "quote":
      return `<div class="slide-content s-quote">
        <p class="quote-text" data-field="quote" ${ce}>${esc(d.quote)}</p>
        <p class="quote-attr" data-field="attribution" ${ce}>${esc(d.attribution)}</p>
      </div>`;
  }
}

/* ---------------- Deck list view ---------------- */
function renderDeckList() {
  const decks = Storage.listDecks();
  const grid = $("#deckGrid");
  grid.innerHTML = "";
  $("#emptyState").hidden = decks.length > 0;
  decks.forEach((deck) => {
    const card = document.createElement("div");
    card.className = "deck-card";
    card.innerHTML = `
      <h3>${esc(deck.title)}</h3>
      <div class="deck-meta">${deck.slides.length} slide${deck.slides.length === 1 ? "" : "s"} · updated ${new Date(deck.updatedAt).toLocaleDateString()}</div>
      <div class="deck-actions">
        <button class="btn" data-action="duplicate">Duplicate</button>
        <button class="btn btn-danger" data-action="delete">Delete</button>
      </div>`;
    card.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "delete") {
        e.stopPropagation();
        if (confirm(`Delete "${deck.title}"? This can't be undone.`)) {
          Storage.deleteDeck(deck.id);
          renderDeckList();
        }
        return;
      }
      if (action === "duplicate") {
        e.stopPropagation();
        Storage.duplicateDeck(deck.id);
        renderDeckList();
        return;
      }
      openDeck(deck.id);
    });
    grid.appendChild(card);
  });
}

function showView(id) {
  $all(".view").forEach((v) => (v.hidden = v.id !== id));
}

$("#btnNewDeck").addEventListener("click", () => {
  const title = prompt("Deck name:", "My Presentation");
  if (title === null) return;
  const deck = Storage.createDeck(title || "Untitled Deck");
  openDeck(deck.id);
});

/* ---------------- Editor view ---------------- */
function openDeck(id) {
  state.deck = Storage.getDeck(id);
  state.slideIndex = 0;
  showView("view-editor");
  $("#deckTitleInput").value = state.deck.title;
  renderSlideStrip();
  renderCanvas();
}

$("#btnBack").addEventListener("click", () => {
  persist();
  state.deck = null;
  showView("view-list");
  renderDeckList();
});

$("#deckTitleInput").addEventListener("input", (e) => {
  state.deck.title = e.target.value;
  persist();
});

function renderSlideStrip() {
  const strip = $("#slideStrip");
  strip.innerHTML = "";
  state.deck.slides.forEach((slide, i) => {
    const btn = document.createElement("button");
    btn.className = "slide-thumb" + (i === state.slideIndex ? " active" : "");
    const label = slide.data.heading || slide.data.quote || Templates[slide.type].label;
    btn.innerHTML = `<span class="thumb-type">${Templates[slide.type].icon} ${i + 1}</span><span class="thumb-label">${esc(label).slice(0, 24)}</span>`;
    btn.addEventListener("click", () => {
      state.slideIndex = i;
      renderSlideStrip();
      renderCanvas();
    });
    strip.appendChild(btn);
  });
  const hasSlides = state.deck.slides.length > 0;
  $("#btnMoveUp").disabled = !hasSlides || state.slideIndex === 0;
  $("#btnMoveDown").disabled = !hasSlides || state.slideIndex === state.deck.slides.length - 1;
  $("#btnDuplicateSlide").disabled = !hasSlides;
  $("#btnDeleteSlide").disabled = !hasSlides;
}

function renderCanvas() {
  const canvas = $("#slideCanvas");
  const slide = state.deck.slides[state.slideIndex];
  if (!slide) {
    canvas.innerHTML = `<p class="muted" style="text-align:center">No slides yet — tap the + button to add one.</p>`;
    return;
  }
  canvas.innerHTML = slideMarkup(slide, true);
}

/* Live-edit bindings: event delegation over the canvas */
$("#slideCanvas").addEventListener("input", (e) => {
  const el = e.target.closest("[data-field]");
  if (!el) return;
  const slide = state.deck.slides[state.slideIndex];
  const field = el.dataset.field;
  const value = el.tagName === "INPUT" ? el.value : el.innerText;

  if (field === "steps.label" || field === "steps.detail") {
    const key = field.split(".")[1];
    slide.data.steps[+el.dataset.index][key] = value;
  } else if (el.dataset.index !== undefined) {
    slide.data[field][+el.dataset.index] = value;
  } else {
    slide.data[field] = value;
  }

  if (field === "imageUrl") renderCanvas();
  if (field === "heading" || field === "quote") renderSlideStrip();
  persist();
});

$("#slideCanvas").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const slide = state.deck.slides[state.slideIndex];
  const { action, list, index } = btn.dataset;

  if (action === "addItem") slide.data[list].push("New point");
  if (action === "removeItem") slide.data[list].splice(+index, 1);
  if (action === "addStep") slide.data.steps.push({ label: "Step", detail: "" });
  if (action === "removeStep") slide.data.steps.splice(+index, 1);

  renderCanvas();
  persist();
});

$("#btnMoveUp").addEventListener("click", () => {
  const s = state.deck.slides;
  if (state.slideIndex === 0) return;
  [s[state.slideIndex - 1], s[state.slideIndex]] = [s[state.slideIndex], s[state.slideIndex - 1]];
  state.slideIndex--;
  renderSlideStrip();
  renderCanvas();
  persist();
});

$("#btnMoveDown").addEventListener("click", () => {
  const s = state.deck.slides;
  if (state.slideIndex >= s.length - 1) return;
  [s[state.slideIndex + 1], s[state.slideIndex]] = [s[state.slideIndex], s[state.slideIndex + 1]];
  state.slideIndex++;
  renderSlideStrip();
  renderCanvas();
  persist();
});

$("#btnDuplicateSlide").addEventListener("click", () => {
  const original = state.deck.slides[state.slideIndex];
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = Storage.newSlideId();
  state.deck.slides.splice(state.slideIndex + 1, 0, copy);
  state.slideIndex++;
  renderSlideStrip();
  renderCanvas();
  persist();
});

$("#btnDeleteSlide").addEventListener("click", () => {
  if (!confirm("Delete this slide?")) return;
  state.deck.slides.splice(state.slideIndex, 1);
  state.slideIndex = Math.max(0, state.slideIndex - 1);
  renderSlideStrip();
  renderCanvas();
  persist();
});

/* ---------------- Template picker ---------------- */
$("#btnAddSlide").addEventListener("click", () => {
  const grid = $("#templateGrid");
  grid.innerHTML = "";
  Object.entries(Templates).forEach(([type, def]) => {
    const opt = document.createElement("button");
    opt.className = "template-option";
    opt.innerHTML = `<span class="t-icon">${def.icon}</span>${def.label}`;
    opt.addEventListener("click", () => {
      const slide = newSlide(type);
      state.deck.slides.splice(state.slideIndex + 1, 0, slide);
      state.slideIndex = state.deck.slides.length ? state.slideIndex + 1 : 0;
      if (state.deck.slides.length === 1) state.slideIndex = 0;
      $("#templateModal").hidden = true;
      renderSlideStrip();
      renderCanvas();
      persist();
    });
    grid.appendChild(opt);
  });
  $("#templateModal").hidden = false;
});
$("#btnCancelTemplate").addEventListener("click", () => ($("#templateModal").hidden = true));

/* ---------------- Present mode ---------------- */
function renderPresentSlide() {
  const slide = state.deck.slides[state.slideIndex];
  $("#presentSlide").innerHTML = slide ? slideMarkup(slide, false) : "";
  $("#presentCounter").textContent = `${state.slideIndex + 1} / ${state.deck.slides.length}`;
}

$("#btnPresent").addEventListener("click", () => {
  if (!state.deck.slides.length) return alert("Add at least one slide first.");
  state.slideIndex = 0;
  $("#presentOverlay").hidden = false;
  renderPresentSlide();
});

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
  renderSlideStrip();
  renderCanvas();
}

$("#btnNext").addEventListener("click", presentNext);
$("#btnPrev").addEventListener("click", presentPrev);
$("#btnExitPresent").addEventListener("click", exitPresent);

document.addEventListener("keydown", (e) => {
  if ($("#presentOverlay").hidden) return;
  if (e.key === "ArrowRight" || e.key === " ") presentNext();
  if (e.key === "ArrowLeft") presentPrev();
  if (e.key === "Escape") exitPresent();
});

// simple swipe support for present mode
let touchStartX = null;
$("#presentOverlay").addEventListener("touchstart", (e) => (touchStartX = e.touches[0].clientX));
$("#presentOverlay").addEventListener("touchend", (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (dx < -40) presentNext();
  if (dx > 40) presentPrev();
  touchStartX = null;
});

/* ---------------- Export to PDF (print) ---------------- */
$("#btnExport").addEventListener("click", () => {
  const sheet = $("#printSheet");
  sheet.innerHTML = state.deck.slides
    .map((slide) => `<div class="print-slide glass-card">${slideMarkup(slide, false)}</div>`)
    .join("");
  window.print();
});

/* ---------------- Boot ---------------- */
renderDeckList();
