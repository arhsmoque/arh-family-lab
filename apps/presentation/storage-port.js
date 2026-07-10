import {createDeck, normalizeDeck} from "./deck-core.js";

const KEY = "arh-presentation-decks-v2";
const LEGACY_KEY = "arh-presentation-decks-v1";

export function createLocalDeckStore(storage = window.localStorage) {
  return {
    listDecks() {
      return Object.values(readAll(storage)).sort((a, b) => b.updatedAt - a.updatedAt);
    },
    getDeck(id) {
      const deck = readAll(storage)[id];
      return deck ? normalizeDeck(deck) : null;
    },
    createDeck(title) {
      const decks = readAll(storage);
      const deck = createDeck(title);
      decks[deck.id] = deck;
      writeAll(storage, decks);
      return deck;
    },
    saveDeck(deck) {
      const decks = readAll(storage);
      const normalized = normalizeDeck(deck);
      decks[normalized.id] = normalized;
      writeAll(storage, decks);
      return normalized;
    },
    deleteDeck(id) {
      const decks = readAll(storage);
      delete decks[id];
      writeAll(storage, decks);
    },
    duplicateDeck(id) {
      const decks = readAll(storage);
      const src = decks[id];
      if (!src) return null;
      const copy = normalizeDeck(JSON.parse(JSON.stringify(src)));
      copy.id = `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      copy.title = `${src.title} (copy)`;
      copy.createdAt = copy.updatedAt = Date.now();
      decks[copy.id] = copy;
      writeAll(storage, decks);
      return copy;
    }
  };
}

function readAll(storage) {
  try {
    const raw = storage.getItem(KEY) || storage.getItem(LEGACY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Object.fromEntries(Object.entries(parsed).map(([id, deck]) => [id, normalizeDeck(deck)]));
  } catch {
    return {};
  }
}

function writeAll(storage, decks) {
  storage.setItem(KEY, JSON.stringify(decks));
}
