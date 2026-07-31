import {createCanvas, normalizeSlide} from "./studio-core.js";

export function adaptInput(kind, raw) {
  const value = String(raw || "").trim();
  if (kind === "json") return adaptJson(value);
  if (kind === "md") return adaptMarkdown(value);
  if (kind === "txt" || kind === "text") return adaptText(value);
  if (kind === "chart") return adaptChart(value);
  if (kind === "mermaid") return adaptMermaid(value);
  if (kind === "image" || kind === "jpg" || kind === "png") return adaptImage(value, kind);
  return createCanvas({title: "Unsupported input", slides: [normalizeSlide({title: "Unsupported adapter", blocks: [{type: "text", value: kind}]})]});
}

export function adapterFromFile(file) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.includes("json") || name.endsWith(".json")) return "json";
  if (name.endsWith(".md")) return "md";
  if (name.endsWith(".txt") || type.includes("text")) return "txt";
  if (type.includes("png") || name.endsWith(".png")) return "png";
  if (type.includes("jpeg") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "jpg";
  return "text";
}

function adaptJson(raw) {
  if (!raw) return seedCanvas();
  const parsed = JSON.parse(raw);
  return createCanvas(parsed);
}

function adaptText(raw) {
  const chunks = splitChunks(raw);
  return createCanvas({
    title: firstLine(raw) || "Text canvas",
    slides: chunks.map((chunk, index) => normalizeSlide({
      kicker: "Text",
      title: index === 0 ? firstLine(chunk) || "Opening point" : `Point ${index + 1}`,
      blocks: [{type: "text", value: chunk}]
    }))
  });
}

function adaptMarkdown(raw) {
  const sections = raw.split(/\n(?=#{1,3}\s+)/).filter(Boolean);
  return createCanvas({
    title: firstHeading(raw) || "Markdown canvas",
    slides: sections.length ? sections.map(sectionToSlide) : adaptText(raw).slides
  });
}

function adaptChart(raw) {
  const rows = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const [label, value] = line.split(/,|\t/).map(part => part.trim());
    return {label, value: Number(value)};
  }).filter(row => row.label && Number.isFinite(row.value));
  return createCanvas({
    title: "Chart canvas",
    slides: [normalizeSlide({
      kicker: "Chart",
      title: "Visible pattern",
      blocks: [{type: "chart", data: rows}]
    })]
  });
}

function adaptMermaid(raw) {
  return createCanvas({
    title: "Mermaid canvas",
    slides: [normalizeSlide({
      kicker: "Diagram",
      title: "System flow",
      blocks: [{type: "mermaid", value: raw || "flowchart LR\nInput-->Adapter-->Core-->Canvas"}]
    })]
  });
}

function adaptImage(raw, kind) {
  return createCanvas({
    title: `${kind.toUpperCase()} image canvas`,
    slides: [normalizeSlide({
      kicker: "Image",
      title: "Visual slide",
      blocks: [{type: "image", value: raw, caption: "Configurable image block"}]
    })]
  });
}

function sectionToSlide(section) {
  const lines = section.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const heading = lines.shift()?.replace(/^#{1,3}\s+/, "") || "Markdown slide";
  const bullets = lines.filter(line => line.startsWith("- ")).map(line => line.slice(2));
  const paragraphs = lines.filter(line => !line.startsWith("- "));
  return normalizeSlide({
    kicker: "Markdown",
    title: heading,
    blocks: [
      ...(paragraphs.length ? [{type: "text", value: paragraphs.join("\n")}] : []),
      ...(bullets.length ? [{type: "list", items: bullets}] : [])
    ]
  });
}

function splitChunks(raw) {
  const chunks = raw.split(/\n\s*\n/).map(chunk => chunk.trim()).filter(Boolean);
  return chunks.length ? chunks : ["Add text in the input box."];
}

function firstLine(raw) {
  return String(raw || "").split(/\r?\n/).map(line => line.trim()).find(Boolean);
}

function firstHeading(raw) {
  const match = String(raw || "").match(/^#{1,3}\s+(.+)$/m);
  return match ? match[1] : firstLine(raw);
}

function seedCanvas() {
  return createCanvas({
    title: "Reusable briefing canvas",
    theme: {footer: "IO configurable · core portable"},
    slides: [
      normalizeSlide({
        kicker: "Pattern",
        title: "Separate IO from reusable slide functions",
        blocks: [{type: "list", items: ["Input ports adapt content", "Core returns a canvas model", "Renderer consumes a view model", "Browser storage remains optional"]}]
      })
    ]
  });
}
