import {createSlide} from "./deck-core.js";

export const ModuleAdapters = Object.freeze({
  text: {label: "Plain text", hint: "Blank line creates a new slide."},
  md: {label: "Markdown", hint: "Each # or ## heading creates a slide."},
  image: {label: "Image URL / data URI", hint: "One image URL per line."},
  chart: {label: "Chart CSV", hint: "Use label,value rows."}
});

export function adaptModule(kind, raw, config = {}) {
  const value = String(raw || "").trim();
  if (kind === "md") return adaptMarkdown(value);
  if (kind === "image") return adaptImages(value, config);
  if (kind === "chart") return adaptChart(value, config);
  return adaptText(value);
}

export function adapterFromFile(file) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (name.endsWith(".md")) return "md";
  if (name.endsWith(".csv")) return "chart";
  if (type.includes("png") || type.includes("jpeg") || name.match(/\.(png|jpe?g|webp)$/)) return "image";
  return "text";
}

function adaptText(raw) {
  const chunks = splitBlocks(raw || "New point");
  return chunks.map((chunk, index) => createSlide("bullets", {
    heading: firstLine(chunk) || `Point ${index + 1}`,
    items: chunk.split(/\r?\n/).map(cleanBullet).filter(Boolean).slice(0, 6)
  }));
}

function adaptMarkdown(raw) {
  const sections = raw.split(/\n(?=#{1,3}\s+)/).map(section => section.trim()).filter(Boolean);
  const usable = sections.length ? sections : [raw || "# New slide\n- First point"];
  return usable.map(section => {
    const lines = section.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const heading = (lines.shift() || "Markdown slide").replace(/^#{1,3}\s+/, "");
    const bullets = lines.filter(line => /^[-*]\s+/.test(line)).map(cleanBullet);
    const body = lines.filter(line => !/^[-*]\s+/.test(line));
    return createSlide("bullets", {
      heading,
      items: [...body, ...bullets].slice(0, 6)
    });
  });
}

function adaptImages(raw, config = {}) {
  const urls = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return (urls.length ? urls : [""]).map((url, index) => createSlide("image", {
    heading: config.heading || `Image ${index + 1}`,
    imageUrl: url,
    caption: config.caption || "Caption / credit"
  }));
}

function adaptChart(raw, config = {}) {
  const rows = raw.split(/\r?\n/).map(line => {
    const [label, value] = line.split(/,|\t/).map(part => part.trim());
    return {label, value: Number(value)};
  }).filter(row => row.label && Number.isFinite(row.value));
  return [createSlide("chart", {
    heading: config.heading || "Chart",
    rows: rows.length ? rows : [{label: "A", value: 10}, {label: "B", value: 6}]
  })];
}

function splitBlocks(raw) {
  return raw.split(/\n\s*\n/).map(chunk => chunk.trim()).filter(Boolean);
}

function firstLine(raw) {
  return String(raw || "").split(/\r?\n/).map(line => cleanBullet(line.trim())).find(Boolean);
}

function cleanBullet(line) {
  return String(line || "").replace(/^#{1,3}\s+/, "").replace(/^[-*]\s+/, "").trim();
}
