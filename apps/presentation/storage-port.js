import {createDeck, normalizeDeck} from "./deck-core.js";

const KEY = "arh-presentation-decks-v2";
const LEGACY_KEY = "arh-presentation-decks-v1";

export function createLocalDeckStore(storage = window.localStorage, onWriteError = () => {}) {
  migrateLegacy(storage);
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
      writeAll(storage, decks, onWriteError);
      return deck;
    },
    saveDeck(deck) {
      const decks = readAll(storage);
      const normalized = normalizeDeck(deck);
      decks[normalized.id] = normalized;
      writeAll(storage, decks, onWriteError);
      return normalized;
    },
    deleteDeck(id) {
      const decks = readAll(storage);
      delete decks[id];
      writeAll(storage, decks, onWriteError);
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
      writeAll(storage, decks, onWriteError);
      return copy;
    }
  };
}

// One-time migration: if the v2 store is empty but a legacy v1 store exists,
// copy it forward under the v2 key and remove the old key.
function migrateLegacy(storage) {
  try {
    const legacy = storage.getItem(LEGACY_KEY);
    if (!legacy || storage.getItem(KEY)) return;
    storage.setItem(KEY, legacy);
    storage.removeItem(LEGACY_KEY);
  } catch {
    // Leave the legacy key in place; readAll still falls back to it.
  }
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

function writeAll(storage, decks, onWriteError) {
  try {
    storage.setItem(KEY, JSON.stringify(decks));
    return true;
  } catch (error) {
    // QuotaExceededError or storage unavailable — report instead of losing silently.
    onWriteError(error);
    return false;
  }
}
