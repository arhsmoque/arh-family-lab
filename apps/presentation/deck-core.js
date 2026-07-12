export const DeckTemplates = Object.freeze({
  title: {
    label: "Title",
    icon: "Title",
    blank: () => ({heading: "Title", subheading: "Subtitle or your name"})
  },
  bullets: {
    label: "Bullet points",
    icon: "Bullets",
    blank: () => ({heading: "Heading", items: ["First point", "Second point"]})
  },
  image: {
    label: "Image + caption",
    icon: "Image",
    blank: () => ({heading: "Heading", imageUrl: "", caption: "Caption"})
  },
  compare: {
    label: "Comparison",
    icon: "Compare",
    blank: () => ({
      heading: "Heading",
      leftTitle: "Option A",
      leftItems: ["Point"],
      rightTitle: "Option B",
      rightItems: ["Point"]
    })
  },
  timeline: {
    label: "Timeline",
    icon: "Timeline",
    blank: () => ({
      heading: "Heading",
      steps: [
        {label: "Step 1", detail: ""},
        {label: "Step 2", detail: ""}
      ]
    })
  },
  quote: {
    label: "Quote / big statement",
    icon: "Quote",
    blank: () => ({quote: "Your quote or key statement", attribution: ""})
  },
  chart: {
    label: "Simple chart",
    icon: "Chart",
    blank: () => ({
      heading: "Chart",
      rows: [
        {label: "A", value: 10},
        {label: "B", value: 6}
      ]
    })
  }
});

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDeck(title = "Untitled Deck", now = Date.now()) {
  return normalizeDeck({id: uid("deck"), title, slides: [], sources: [], createdAt: now, updatedAt: now});
}

export function normalizeDeck(deck = {}) {
  const now = Date.now();
  return {
    id: deck.id || uid("deck"),
    title: deck.title || "Untitled Deck",
    slides: Array.isArray(deck.slides) ? deck.slides.map(normalizeSlide).filter(Boolean) : [],
    sources: Array.isArray(deck.sources) ? deck.sources.map(normalizeSource).filter(Boolean) : [],
    createdAt: Number(deck.createdAt) || now,
    updatedAt: Number(deck.updatedAt) || now
  };
}

export function normalizeSlide(slide = {}) {
  const type = DeckTemplates[slide.type] ? slide.type : "bullets";
  return {
    id: slide.id || uid("slide"),
    type,
    data: normalizeSlideData(type, slide.data)
  };
}

export function normalizeSource(source = {}) {
  const title = String(source.title || "").trim();
  const url = String(source.url || "").trim();
  if (!title && !url) return null;
  return {id: source.id || uid("source"), title: title || url, url};
}

export function createSlide(type, data = {}) {
  const slideType = DeckTemplates[type] ? type : "bullets";
  return normalizeSlide({id: uid("slide"), type: slideType, data: {...DeckTemplates[slideType].blank(), ...data}});
}

export function cloneSlide(slide) {
  const copy = normalizeSlide(structuredCloneSafe(slide));
  copy.id = uid("slide");
  return copy;
}

export function renameDeck(deck, title) {
  return touch({...normalizeDeck(deck), title: title || "Untitled Deck"});
}

export function insertSlides(deck, slides, afterIndex = -1) {
  const current = normalizeDeck(deck);
  const incoming = slides.map(normalizeSlide).filter(Boolean);
  const insertAt = clamp(afterIndex + 1, 0, current.slides.length);
  current.slides.splice(insertAt, 0, ...incoming);
  return touch(current);
}

export function replaceSlide(deck, index, slide) {
  const current = normalizeDeck(deck);
  if (!current.slides[index]) return current;
  current.slides[index] = normalizeSlide(slide);
  return touch(current);
}

export function duplicateSlide(deck, index) {
  const current = normalizeDeck(deck);
  if (!current.slides[index]) return {deck: current, index: clamp(index, 0, current.slides.length - 1)};
  current.slides.splice(index + 1, 0, cloneSlide(current.slides[index]));
  return {deck: touch(current), index: index + 1};
}

export function deleteSlide(deck, index) {
  const current = normalizeDeck(deck);
  if (!current.slides[index]) return {deck: current, index: 0};
  current.slides.splice(index, 1);
  return {deck: touch(current), index: clamp(index - 1, 0, current.slides.length - 1)};
}

export function moveSlide(deck, index, delta) {
  const current = normalizeDeck(deck);
  const target = index + delta;
  if (!current.slides[index] || target < 0 || target >= current.slides.length) return {deck: current, index};
  [current.slides[index], current.slides[target]] = [current.slides[target], current.slides[index]];
  return {deck: touch(current), index: target};
}

export function updateSlideField(slide, field, value, itemIndex) {
  const next = normalizeSlide(slide);
  if (field === "steps.label" || field === "steps.detail") {
    const key = field.split(".")[1];
    next.data.steps[itemIndex][key] = value;
    return next;
  }
  if (itemIndex !== undefined && Array.isArray(next.data[field])) {
    next.data[field][itemIndex] = value;
    return next;
  }
  next.data[field] = value;
  return next;
}

export function applySlideAction(slide, action, list, index) {
  const next = normalizeSlide(slide);
  if (action === "addItem" && Array.isArray(next.data[list])) next.data[list].push("New point");
  if (action === "removeItem" && Array.isArray(next.data[list])) next.data[list].splice(index, 1);
  if (action === "addStep") next.data.steps.push({label: "Step", detail: ""});
  if (action === "removeStep") next.data.steps.splice(index, 1);
  return next;
}

export function addSource(deck, source) {
  const current = normalizeDeck(deck);
  const normalized = normalizeSource(source);
  if (!normalized) return current;
  return touch({...current, sources: [normalized, ...current.sources]});
}

export function clampSlideIndex(deck, index) {
  return clamp(index, 0, Math.max(0, normalizeDeck(deck).slides.length - 1));
}

function normalizeSlideData(type, data = {}) {
  const base = DeckTemplates[type].blank();
  const merged = {...base, ...(data || {})};
  if (type === "bullets") merged.items = normalizeStringArray(merged.items);
  if (type === "compare") {
    merged.leftItems = normalizeStringArray(merged.leftItems);
    merged.rightItems = normalizeStringArray(merged.rightItems);
  }
  if (type === "timeline") {
    merged.steps = Array.isArray(merged.steps) ? merged.steps.map(step => ({
      label: String(step.label || "Step"),
      detail: String(step.detail || "")
    })) : base.steps;
  }
  if (type === "chart") {
    merged.rows = Array.isArray(merged.rows) ? merged.rows.map(row => ({
      label: String(row.label || ""),
      value: Number(row.value) || 0
    })).filter(row => row.label) : base.rows;
  }
  return merged;
}

function normalizeStringArray(items) {
  return Array.isArray(items) ? items.map(item => String(item || "")).filter(Boolean) : [];
}

function touch(deck) {
  return {...deck, updatedAt: Date.now()};
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
