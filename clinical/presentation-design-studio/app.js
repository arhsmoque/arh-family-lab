import {
  canvasToPortableJson,
  clampSlideIndex,
  createCanvas,
  renderSlideHtml,
  renderThumbs,
  slideToViewModel
} from "./studio-core.js";
import {adaptInput, adapterFromFile} from "./adapters.js";

const STORAGE_KEY = "arh-family-lab:presentation-design-studio:v1";
const el = {
  adapter: document.querySelector("#adapterSelect"),
  input: document.querySelector("#inputBox"),
  config: document.querySelector("#configBox"),
  canvas: document.querySelector("#canvasHost"),
  thumbs: document.querySelector("#thumbRail"),
  title: document.querySelector("#deckTitle"),
  count: document.querySelector("#slideCount"),
  status: document.querySelector("#saveStatus"),
  file: document.querySelector("#fileInput")
};

let state = {
  canvas: createCanvas(loadConfig()),
  activeIndex: 0
};

const samples = {
  briefing: `# Government-facing dental briefing\n\n- Keep the narrative low-attention-span friendly\n- Preserve professional etiquette and Klinik Pergigian Dato Keramat context\n- Use visual chunks instead of dense paragraphs\n\n# Operator role\n\nSecond officer after YM: visible enough for ownership, not over-corporate.`,
  chart: "Cases screened,42\nFollow-up needed,12\nResolved,31\nEscalated,4",
  mermaid: "flowchart LR\nInput[User input] --> Adapter\nAdapter --> Core[Pure slide functions]\nCore --> Canvas\nCanvas --> Renderer"
};

function boot() {
  if (!el.input.value) el.input.value = samples.briefing;
  syncConfigBox();
  render();
  document.querySelector("#btnRender").addEventListener("click", onRender);
  document.querySelector("#btnExport").addEventListener("click", onExport);
  document.querySelector("#btnPrev").addEventListener("click", () => move(-1));
  document.querySelector("#btnNext").addEventListener("click", () => move(1));
  el.config.addEventListener("change", onConfigEdited);
  el.file.addEventListener("change", onFileSelected);
  document.querySelectorAll("[data-sample]").forEach(button => {
    button.addEventListener("click", () => {
      const key = button.dataset.sample;
      el.adapter.value = key === "briefing" ? "md" : key;
      el.input.value = samples[key];
      onRender();
    });
  });
}

function onRender() {
  try {
    const base = createCanvas(readConfigBox());
    const incoming = adaptInput(el.adapter.value, el.input.value);
    state.canvas = el.adapter.value === "json"
      ? incoming
      : createCanvas({
        ...base,
        title: incoming.title || base.title,
        slides: incoming.slides
      });
    state.activeIndex = clampSlideIndex(state.canvas, state.activeIndex);
    persist();
    render();
  } catch (error) {
    setStatus(`input error: ${error.message}`);
  }
}

function onConfigEdited() {
  try {
    state.canvas = createCanvas(readConfigBox());
    state.activeIndex = clampSlideIndex(state.canvas, state.activeIndex);
    persist();
    render();
  } catch (error) {
    setStatus(`config error: ${error.message}`);
  }
}

async function onFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const adapter = adapterFromFile(file);
  el.adapter.value = adapter;
  if (adapter === "jpg" || adapter === "png") {
    el.input.value = await readFileAsDataUrl(file);
  } else {
    el.input.value = await file.text();
  }
  onRender();
  event.target.value = "";
}

function onExport() {
  const blob = new Blob([canvasToPortableJson(state.canvas)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(state.canvas.title)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus("exported");
}

function move(delta) {
  state.activeIndex = clampSlideIndex(state.canvas, state.activeIndex + delta);
  render();
}

function render() {
  const viewModel = slideToViewModel(state.canvas, state.activeIndex);
  el.canvas.innerHTML = renderSlideHtml(viewModel);
  el.title.textContent = state.canvas.title;
  el.count.textContent = `${state.canvas.slides.length} slides`;
  el.thumbs.innerHTML = "";
  for (const thumb of renderThumbs(state.canvas, state.activeIndex)) {
    const button = document.createElement("button");
    button.className = `thumb${thumb.active ? " active" : ""}`;
    button.innerHTML = `<strong>${escapeText(thumb.title)}</strong><span>${escapeText(thumb.kicker)}</span>`;
    button.addEventListener("click", () => {
      state.activeIndex = thumb.index;
      render();
    });
    el.thumbs.append(button);
  }
  syncConfigBox();
  renderMermaid();
}

function renderMermaid() {
  if (!window.mermaid) return;
  window.mermaid.run({querySelector: ".mermaid"}).catch(() => setStatus("mermaid render warning"));
}

function readConfigBox() {
  return JSON.parse(el.config.value || "{}");
}

function syncConfigBox() {
  el.config.value = canvasToPortableJson(state.canvas);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, canvasToPortableJson(state.canvas));
  setStatus("saved locally");
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function setStatus(message) {
  el.status.textContent = message;
}

function slugify(value) {
  return String(value || "presentation-canvas").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

boot();
