# Presentation Design Studio Ports

## Event Flow

1. Operator inputs content through GUI, JSON config, or file import.
2. Browser IO in `app.js` reads the input and selects an adapter.
3. `adapters.js` converts raw input into a portable canvas model.
4. `studio-core.js` normalizes canvas state and produces slide view models.
5. `studio-core.js` renders deterministic slide HTML from the view model.
6. Browser IO in `app.js` mounts HTML, persists optional local state, and handles downloads.

## Operator-Facing Ports

- Input box: text, Markdown, TXT notes, chart CSV, image URL/data URI, Mermaid.
- File import: JSON, MD, TXT, JPG, PNG.
- Canvas JSON: direct configuration and export.
- Slide navigation: previous, next, thumbnails.

## Agent-Facing Ports

- `createCanvas(input)`: pure canvas normalization.
- `appendSlides(canvas, slides)`: pure state transition.
- `slideToViewModel(canvas, index)`: pure view model.
- `renderSlideHtml(viewModel)`: pure render string.
- `adaptInput(kind, raw)`: deterministic adapter boundary.

## Boundary Rule

`studio-core.js` must not call DOM APIs, `localStorage`, `FileReader`, network APIs, timers for behavior, or browser download APIs. Those are IO concerns owned by `app.js`.
