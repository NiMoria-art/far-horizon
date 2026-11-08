const SAVE_KEY = 'far-horizon.save.v1';
export function loadGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
export function saveGame(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
export function clearSave() { localStorage.removeItem(SAVE_KEY); }
