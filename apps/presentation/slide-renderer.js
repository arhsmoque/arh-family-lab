import {DeckTemplates} from "./deck-core.js";

const DEFAULT_LABELS = {
  addPoint: "+ Add point",
  addStep: "+ Add step",
  addRow: "+ Add row",
  removeStep: "x remove",
  imageUrlPlaceholder: "Paste an image URL...",
  chartLabelPlaceholder: "Label",
  chartValuePlaceholder: "Number",
  noSlide: "No slides yet. Add a template or generate slides from text.",
  noImageSet: "No image set",
  unsupported: "Unsupported slide type"
};

export function slideMarkup(slide, editable = false, labels = {}) {
  const L = {...DEFAULT_LABELS, ...labels};
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
        <ul>${d.items.map((it, i) => `<li>
          <span data-field="items" data-index="${i}" ${ce}>${esc(it)}</span>
          ${editable ? actionButton("removeItem", "items", i) : ""}
        </li>`).join("")}</ul>
        ${editable ? `<button class="btn add-item" data-action="addItem" data-list="items">${esc(L.addPoint)}</button>` : ""}
      </div>`;
    case "image":
      return `<div class="slide-content s-image">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        ${editable ? `<input class="img-url-input" data-field="imageUrl" placeholder="${esc(L.imageUrlPlaceholder)}" value="${esc(d.imageUrl)}">` : ""}
        ${d.imageUrl ? `<img src="${esc(d.imageUrl)}" alt="">` : editable ? "" : `<p class="muted">${esc(L.noImageSet)}</p>`}
        <p class="s-caption" data-field="caption" ${ce}>${esc(d.caption)}</p>
      </div>`;
    case "compare":
      return `<div class="slide-content s-compare-wrap">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        <div class="s-compare">
          ${compareColumn("leftTitle", "leftItems", d.leftTitle, d.leftItems, editable, ce, L)}
          ${compareColumn("rightTitle", "rightItems", d.rightTitle, d.rightItems, editable, ce, L)}
        </div>
      </div>`;
    case "timeline":
      return `<div class="slide-content s-timeline-wrap">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        <div class="s-timeline">${d.steps.map((step, i) => `<div class="step">
          <div class="step-label" data-field="steps.label" data-index="${i}" ${ce}>${esc(step.label)}</div>
          <div class="step-detail" data-field="steps.detail" data-index="${i}" ${ce}>${esc(step.detail)}</div>
          ${editable ? `<button class="btn btn-ghost remove-item-btn" data-action="removeStep" data-index="${i}">${esc(L.removeStep)}</button>` : ""}
        </div>`).join("")}</div>
        ${editable ? `<button class="btn add-item" data-action="addStep">${esc(L.addStep)}</button>` : ""}
      </div>`;
    case "quote":
      return `<div class="slide-content s-quote">
        <p class="quote-text" data-field="quote" ${ce}>${esc(d.quote)}</p>
        <p class="quote-attr" data-field="attribution" ${ce}>${esc(d.attribution)}</p>
      </div>`;
    case "chart":
      return `<div class="slide-content s-chart-wrap">
        <h2 class="s-heading" data-field="heading" ${ce}>${esc(d.heading)}</h2>
        <div class="s-chart">${chartRowsMarkup(d.rows)}</div>
        ${editable ? `<div class="chart-editor">${d.rows.map((row, i) => `<div class="chart-edit-row">
          <input class="chart-label-input" data-field="rows.label" data-index="${i}" placeholder="${esc(L.chartLabelPlaceholder)}" value="${esc(row.label)}">
          <input class="chart-value-input" type="number" data-field="rows.value" data-index="${i}" placeholder="${esc(L.chartValuePlaceholder)}" value="${esc(row.value)}">
          <button class="btn btn-ghost remove-item-btn" data-action="removeChartRow" data-index="${i}">x</button>
        </div>`).join("")}
        <button class="btn add-item" data-action="addChartRow">${esc(L.addRow)}</button></div>` : ""}
      </div>`;
    default:
      return `<p class="muted">${esc(L.unsupported)}</p>`;
  }
}

export function thumbLabel(slide) {
  const data = slide.data || {};
  return data.heading || data.quote || DeckTemplates[slide.type]?.label || "Slide";
}

export function templateOptions() {
  return Object.entries(DeckTemplates).map(([type, def]) => ({type, label: def.label, icon: def.icon}));
}

export function esc(value) {
  return String(value || "").replace(/[&<>"]/g, char => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[char]));
}

export function chartRowsMarkup(rows) {
  const usable = rows.filter(row => row.label);
  const max = Math.max(...usable.map(row => Number(row.value) || 0), 1);
  return usable.map(row => {
    const value = Number(row.value) || 0;
    const width = Math.round((value / max) * 100);
    return `<div class="chart-row"><strong>${esc(row.label)}</strong><div class="chart-track"><span style="width:${width}%"></span></div><em>${value}</em></div>`;
  }).join("");
}

function compareColumn(titleField, listField, title, items, editable, ce, L) {
  return `<div class="col">
    <h4 data-field="${titleField}" ${ce}>${esc(title)}</h4>
    <ul>${items.map((it, i) => `<li><span data-field="${listField}" data-index="${i}" ${ce}>${esc(it)}</span>
      ${editable ? actionButton("removeItem", listField, i) : ""}</li>`).join("")}</ul>
    ${editable ? `<button class="btn add-item" data-action="addItem" data-list="${listField}">${esc(L.addPoint)}</button>` : ""}
  </div>`;
}

function actionButton(action, list, index) {
  return `<button class="btn btn-ghost remove-item-btn" data-action="${action}" data-list="${list}" data-index="${index}">x</button>`;
}
