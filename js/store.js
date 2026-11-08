/* Persistent app state (localStorage, with an in-memory fallback). */
const KEY = 'hafez-fal:v1';
const HISTORY_LIMIT = 200;

const defaults = () => ({
  onboarded: false,
  theme: 'auto',            // auto | light | dark
  size: 1,                  // 0 small, 1 medium, 2 large
  tabir: 0,                 // 0 traditional interpretation, 1 short interpretation
  sound: true,
  reminder: { on: false, time: '08:00' },
  favorites: [],
  history: []               // [{ id, ts, src }]
});

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    const base = defaults();
    return saved ? { ...base, ...saved, reminder: { ...base.reminder, ...(saved.reminder || {}) } } : base;
  } catch {
    return defaults();
  }
}

const state = load();
const listeners = new Set();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get: (key) => state[key],
  set(key, value) { state[key] = value; persist(); },
  patchReminder(patch) { state.reminder = { ...state.reminder, ...patch }; persist(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  isFav: (id) => state.favorites.includes(id),
  toggleFav(id) {
    state.favorites = state.favorites.includes(id)
      ? state.favorites.filter((x) => x !== id)
      : [id, ...state.favorites];
    persist();
    return state.favorites.includes(id);
  },

  addHistory(id, src) {
    state.history = [{ id, ts: Date.now(), src }, ...state.history].slice(0, HISTORY_LIMIT);
    persist();
  },
  clearHistory() { state.history = []; persist(); }
};
