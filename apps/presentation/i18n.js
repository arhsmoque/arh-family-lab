// Deckmate bilingual strings (English / Bahasa Melayu).
// Plain vocabulary for Malaysian school kids; no jargon.

const LANG_KEY = "arh-deckmate-lang";

export const STRINGS = {
  en: {
    tagline: "Build a presentation. Present it from your phone. No account needed.",
    newDeck: "+ New deck",
    emptyState: "No decks yet — tap \"New deck\" to start your first presentation.",
    importDeck: "Import deck",
    back: "← Decks",
    ideas: "Find ideas",
    exportPdf: "Export PDF",
    present: "▶ Present",
    moveUp: "↑ Move up",
    moveDown: "↓ Move down",
    duplicateSlide: "⧉ Duplicate",
    deleteSlideBtn: "Delete slide",
    researchTitle: "Find ideas",
    researchHint: "Keep useful links here so image credits and sources do not disappear before presenting.",
    open: "Open",
    clickToEdit: "Tip: click any text on the slide to edit it.",
    addSlideTitle: "Add a slide",
    moduleTitle: "Add slides from text",
    moduleDesc: "Paste your notes once, and Deckmate turns them into slides for you.",
    moduleKindLabel: "What are you pasting?",
    modulePlaceholder: "Paste text, Markdown, image links, or label,number chart rows here",
    importFile: "Choose a file",
    addModule: "Make slides",
    cancel: "Cancel",
    inspirationTitle: "Ideas, Images & Sources",
    inspirationDesc: "Search outside sources, then paste the best image or link back into Deckmate.",
    topicLabel: "Topic / keywords",
    ideaQueryPlaceholder: "Example: food chain, water cycle, tokoh kemerdekaan",
    searchCanvaTitle: "Canva templates",
    searchCanvaDesc: "Look at layouts and school-style presentation ideas.",
    searchGoogleTitle: "Google Images",
    searchGoogleDesc: "Find visual references, then check the original source.",
    searchWikimediaTitle: "Wikimedia Commons",
    searchWikimediaDesc: "Better for reusable images and attribution.",
    searchUnsplashTitle: "Unsplash",
    searchUnsplashDesc: "Good for clean background photos.",
    addImageTitle: "Add image slide",
    imageUrlLabel: "Image URL",
    imageUrlPlaceholder: "https://...jpg / png / webp",
    captionLabel: "Caption / credit",
    captionPlaceholder: "Source: ...",
    addImageBtn: "Add image slide",
    saveSourceTitle: "Save a source",
    sourceTitleLabel: "Source title",
    sourceTitlePlaceholder: "Article, image, video, book",
    linkLabel: "Link",
    saveSourceBtn: "Save source",
    close: "Close",
    noSources: "No sources saved yet.",
    saved: "Saved ✓",
    duplicate: "Duplicate",
    delete: "Delete",
    export: "Export",
    slidesWord: n => `${n} slide${n === 1 ? "" : "s"}`,
    updatedPrefix: "updated",
    deckNameTitle: "Name your deck",
    deckNameDefault: "My Presentation",
    untitledDeck: "Untitled Deck",
    create: "Create",
    ok: "OK",
    deleteDeckTitle: "Delete this deck?",
    deleteDeckMsg: title => `"${title}" will be gone forever. This can't be undone.`,
    deleteSlideTitle: "Delete this slide?",
    deleteSlideMsg: "This can't be undone.",
    quotaTitle: "Your deck is too big to save",
    quotaMsg: "This device ran out of space for your deck. Try removing some photos or big images, then try again.",
    invalidFileTitle: "That file didn't work",
    invalidFileMsg: "It doesn't look like a Deckmate deck file (.json). Ask your friend to export it again.",
    needSlide: "Add at least one slide first.",
    template: {
      title: "Title",
      bullets: "Bullet points",
      image: "Image + caption",
      compare: "Comparison",
      timeline: "Timeline",
      quote: "Quote",
      chart: "Chart"
    },
    adapter: {
      text: "Plain text",
      md: "Markdown",
      image: "Image links",
      chart: "Chart numbers"
    },
    adapterHint: {
      text: "Type your points. An empty line starts a new slide.",
      md: "Each # heading becomes a new slide.",
      image: "One image link per line.",
      chart: "Make a bar chart — one label and number per line, like: Apples, 5"
    },
    slide: {
      addPoint: "+ Add point",
      addStep: "+ Add step",
      addRow: "+ Add row",
      removeStep: "x remove",
      imageUrlPlaceholder: "Paste an image URL...",
      chartLabelPlaceholder: "Label",
      chartValuePlaceholder: "Number",
      noImageSet: "No image set"
    },
    ariaAddSlide: "Add slide",
    ariaPrev: "Previous slide",
    ariaNext: "Next slide",
    ariaExit: "Exit presentation",
    ariaDeckTitle: "Deck title"
  },

  bm: {
    tagline: "Bina pembentangan. Bentang terus dari telefon. Tak perlu akaun.",
    newDeck: "+ Dek baharu",
    emptyState: "Belum ada dek — tekan \"Dek baharu\" untuk mula membentang.",
    importDeck: "Import dek",
    back: "← Semua dek",
    ideas: "Cari idea",
    exportPdf: "Eksport PDF",
    present: "▶ Bentang",
    moveUp: "↑ Naik",
    moveDown: "↓ Turun",
    duplicateSlide: "⧉ Salin slaid",
    deleteSlideBtn: "Padam slaid",
    researchTitle: "Cari idea",
    researchHint: "Simpan pautan berguna di sini supaya kredit gambar dan sumber tidak hilang sebelum membentang.",
    open: "Buka",
    clickToEdit: "Petua: klik mana-mana teks pada slaid untuk sunting.",
    addSlideTitle: "Tambah slaid",
    moduleTitle: "Tambah slaid daripada teks",
    moduleDesc: "Tampal nota anda sekali, dan Deckmate tukarkan ia menjadi slaid.",
    moduleKindLabel: "Apa yang anda tampal?",
    modulePlaceholder: "Tampal teks, Markdown, pautan gambar, atau baris carta label,nombor di sini",
    importFile: "Pilih fail",
    addModule: "Jadikan slaid",
    cancel: "Batal",
    inspirationTitle: "Idea, Gambar & Sumber",
    inspirationDesc: "Cari sumber di luar, kemudian tampal gambar atau pautan terbaik kembali ke Deckmate.",
    topicLabel: "Topik / kata kunci",
    ideaQueryPlaceholder: "Contoh: rantai makanan, kitaran air, tokoh kemerdekaan",
    searchCanvaTitle: "Templat Canva",
    searchCanvaDesc: "Lihat susun atur dan idea pembentangan gaya sekolah.",
    searchGoogleTitle: "Google Images",
    searchGoogleDesc: "Cari rujukan visual, kemudian semak sumber asal.",
    searchWikimediaTitle: "Wikimedia Commons",
    searchWikimediaDesc: "Lebih baik untuk gambar boleh guna semula dan atribusi.",
    searchUnsplashTitle: "Unsplash",
    searchUnsplashDesc: "Bagus untuk foto latar belakang yang bersih.",
    addImageTitle: "Tambah slaid gambar",
    imageUrlLabel: "URL gambar",
    imageUrlPlaceholder: "https://...jpg / png / webp",
    captionLabel: "Kapsyen / kredit",
    captionPlaceholder: "Sumber: ...",
    addImageBtn: "Tambah slaid gambar",
    saveSourceTitle: "Simpan sumber",
    sourceTitleLabel: "Tajuk sumber",
    sourceTitlePlaceholder: "Artikel, gambar, video, buku",
    linkLabel: "Pautan",
    saveSourceBtn: "Simpan sumber",
    close: "Tutup",
    noSources: "Belum ada sumber disimpan.",
    saved: "Disimpan ✓",
    duplicate: "Salin",
    delete: "Padam",
    export: "Eksport",
    slidesWord: n => `${n} slaid`,
    updatedPrefix: "dikemas kini",
    deckNameTitle: "Namakan dek anda",
    deckNameDefault: "Pembentangan Saya",
    untitledDeck: "Dek Tanpa Nama",
    create: "Cipta",
    ok: "OK",
    deleteDeckTitle: "Padam dek ini?",
    deleteDeckMsg: title => `"${title}" akan hilang selamanya. Ini tidak boleh dibatalkan.`,
    deleteSlideTitle: "Padam slaid ini?",
    deleteSlideMsg: "Ini tidak boleh dibatalkan.",
    quotaTitle: "Dek anda terlalu besar untuk disimpan",
    quotaMsg: "Peranti ini kehabisan ruang untuk dek anda. Cuba buang beberapa gambar atau foto besar, kemudian cuba lagi.",
    invalidFileTitle: "Fail itu tidak berjaya",
    invalidFileMsg: "Ia nampaknya bukan fail dek Deckmate (.json). Minta kawan anda eksport semula.",
    needSlide: "Tambah sekurang-kurangnya satu slaid dahulu.",
    template: {
      title: "Tajuk",
      bullets: "Poin",
      image: "Gambar + kapsyen",
      compare: "Perbandingan",
      timeline: "Garis masa",
      quote: "Petikan",
      chart: "Carta"
    },
    adapter: {
      text: "Teks biasa",
      md: "Markdown",
      image: "Pautan gambar",
      chart: "Nombor carta"
    },
    adapterHint: {
      text: "Taip poin anda. Garis kosong memulakan slaid baharu.",
      md: "Setiap tajuk # menjadi slaid baharu.",
      image: "Satu pautan gambar setiap baris.",
      chart: "Buat carta bar — satu label dan nombor setiap baris, contoh: Epal, 5"
    },
    slide: {
      addPoint: "+ Tambah poin",
      addStep: "+ Tambah langkah",
      addRow: "+ Tambah baris",
      removeStep: "x buang",
      imageUrlPlaceholder: "Tampal URL gambar...",
      chartLabelPlaceholder: "Label",
      chartValuePlaceholder: "Nombor",
      noImageSet: "Tiada gambar"
    },
    ariaAddSlide: "Tambah slaid",
    ariaPrev: "Slaid sebelumnya",
    ariaNext: "Slaid seterusnya",
    ariaExit: "Keluar pembentangan",
    ariaDeckTitle: "Tajuk dek"
  }
};

export function getLang() {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "bm") return stored;
  } catch { /* fall through to detection */ }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("ms") ? "bm" : "en";
}

export function setLang(lang) {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch { /* non-fatal: language just won't persist */ }
}

export function t(lang, key) {
  const value = key.split(".").reduce((node, part) => (node ? node[part] : undefined), STRINGS[lang]);
  return value !== undefined ? value : key.split(".").reduce((node, part) => (node ? node[part] : undefined), STRINGS.en);
}
