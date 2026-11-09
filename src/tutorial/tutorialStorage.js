import { normalizeTutorialProgress } from './tutorialProgress.js';

export const TUTORIAL_SAVE_KEY = 'far-horizon.tutorial.v1';

export function loadTutorialProgress(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(TUTORIAL_SAVE_KEY);
    return raw ? normalizeTutorialProgress(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveTutorialProgress(progress, storage = globalThis.localStorage) {
  try {
    if (!storage || !progress || typeof progress !== 'object') return false;
    storage.setItem(TUTORIAL_SAVE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
