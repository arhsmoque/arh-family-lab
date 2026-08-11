export const DEFAULT_THEME = Object.freeze({
  name: "Dato Keramat briefing",
  footer: "Presentation Design Studio",
  accent: "#2f7b67"
});

export function createCanvas(input = {}) {
  const slides = Array.isArray(input.slides) ? input.slides.map(normalizeSlide) : [];
  return {
    id: input.id || `canvas-${Date.now()}`,
    title: input.title || "Untitled canvas",
    theme: {...DEFAULT_THEME, ...(input.theme || {})},
    slides
  };
}

export function normalizeSlide(slide = {}) {
  return {
    id: slide.id || `slide-${Math.random().toString(36).slice(2, 10)}`,
    kicker: slide.kicker || "Canvas",
    title: slide.title || "Untitled slide",
    layout: slide.layout || "briefing",
    blocks: Array.isArray(slide.blocks) ? slide.blocks.map(normalizeBlock) : [],
    notes: slide.notes || ""
  };
}

export function normalizeBlock(block = {}) {
  return {
    type: block.type || "text",
    value: block.value ?? "",
    caption: block.caption || "",
    items: Array.isArray(block.items) ? block.items : [],
    data: Array.isArray(block.data) ? block.data : []
  };
}

export function appendSlides(canvas, slides) {
  return createCanvas({
    ...canvas,
    slides: [...canvas.slides, ...slides.map(normalizeSlide)]
  });
}

export function replaceSlides(canvas, slides) {
  return createCanvas({...canvas, slides});
}

export function getSlide(canvas, index) {
  if (!canvas.slides.length) return normalizeSlide({title: "Empty canvas", blocks: [{type: "text", value: "Add input, then render canvas."}]});
  return canvas.slides[Math.max(0, Math.min(index, canvas.slides.length - 1))];
}

export function clampSlideIndex(canvas, index) {
  return Math.max(0, Math.min(index, Math.max(0, canvas.slides.length - 1)));
}

export function canvasToPortableJson(canvas) {
  return JSON.stringify(createCanvas(canvas), null, 2);
}

export function slideToViewModel(canvas, index) {
  const slide = getSlide(canvas, index);
  return {
    theme: canvas.theme,
    total: canvas.slides.length,
    index: clampSlideIndex(canvas, index),
    slide
  };
}

export function renderSlideHtml(viewModel) {
  const {theme, slide, index, total} = viewModel;
  return `
    <article class="slide" style="--accent:${escapeAttr(theme.accent || DEFAULT_THEME.accent)}">
      <header class="slide-header">
        <p class="slide-kicker">${escapeHtml(slide.kicker)}</p>
        <h2 class="slide-title">${escapeHtml(slide.title)}</h2>
      </header>
      <section class="slide-body">
        ${slide.blocks.map(renderBlockHtml).join("")}
      </section>
      <footer class="slide-footer">${escapeHtml(theme.footer || DEFAULT_THEME.footer)} · ${index + 1}/${Math.max(total, 1)}</footer>
    </article>`;
}

export function renderThumbs(canvas, activeIndex) {
  return canvas.slides.map((slide, index) => ({
    id: slide.id,
    title: slide.title,
    kicker: slide.kicker,
    active: index === activeIndex,
    index
  }));
}

function renderBlockHtml(block) {
  if (block.type === "list") {
    return `<div class="block-list">${block.items.map(item => `<div>${escapeHtml(item)}</div>`).join("")}</div>`;
  }
  if (block.type === "image") {
    return `<figure><img class="block-image" src="${escapeAttr(block.value)}" alt="${escapeAttr(block.caption || "Slide image")}"><figcaption class="muted">${escapeHtml(block.caption)}</figcaption></figure>`;
  }
  if (block.type === "chart") {
    const max = Math.max(...block.data.map(row => Number(row.value) || 0), 1);
    return `<div class="chart">${block.data.map(row => {
      const value = Number(row.value) || 0;
      const width = Math.round((value / max) * 100);
      return `<div class="bar-row"><strong>${escapeHtml(row.label)}</strong><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><span>${value}</span></div>`;
    }).join("")}</div>`;
  }
  if (block.type === "mermaid") {
    return `<div class="mermaid-box"><pre class="mermaid">${escapeHtml(block.value)}</pre></div>`;
  }
  return `<div class="block-text">${escapeHtml(block.value)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
