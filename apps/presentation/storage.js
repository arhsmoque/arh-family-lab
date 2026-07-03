/*
  Storage adapter for the presentation app.
  This is the one deliberate seam: everything else talks to `Storage.*`
  and never touches localStorage directly. Swapping to Cloudflare KV/D1
  (for shareable group-project links) later means replacing this file only.
*/
const Storage = (() => {
  const KEY = "arh-presentation-decks-v1";

  function readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeAll(decks) {
    localStorage.setItem(KEY, JSON.stringify(decks));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  return {
    listDecks() {
      const decks = readAll();
      return Object.values(decks).sort((a, b) => b.updatedAt - a.updatedAt);
    },

    getDeck(id) {
      return readAll()[id] || null;
    },

    createDeck(title) {
      const decks = readAll();
      const id = uid();
      const now = Date.now();
      decks[id] = { id, title: title || "Untitled Deck", slides: [], createdAt: now, updatedAt: now };
      writeAll(decks);
      return decks[id];
    },

    saveDeck(deck) {
      const decks = readAll();
      deck.updatedAt = Date.now();
      decks[deck.id] = deck;
      writeAll(decks);
      return deck;
    },

    deleteDeck(id) {
      const decks = readAll();
      delete decks[id];
      writeAll(decks);
    },

    duplicateDeck(id) {
      const decks = readAll();
      const src = decks[id];
      if (!src) return null;
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = uid();
      copy.title = src.title + " (copy)";
      copy.createdAt = copy.updatedAt = Date.now();
      decks[copy.id] = copy;
      writeAll(decks);
      return copy;
    },

    newSlideId: uid,
  };
})();
