import { TUTORIAL_MODULES, TUTORIAL_TASKS, TUTORIAL_TASK_BY_ID } from './tutorialData.js';

const ids = new Set(TUTORIAL_TASKS.map((task) => task.id));
const uniqueKnown = (items) => [...new Set(Array.isArray(items) ? items.filter((id) => ids.has(id)) : [])];

export function createTutorialProgress(hintsEnabled = true) {
  return {
    version: 2,
    started: true,
    completed: false,
    skipped: false,
    replaying: false,
    dismissed: false,
    currentModule: TUTORIAL_MODULES[0].id,
    currentTaskId: TUTORIAL_TASKS[0].id,
    completedTaskIds: [],
    archivedTaskIds: [],
    skippedTaskIds: [],
    hintsEnabled: Boolean(hintsEnabled),
    seenHints: [],
  };
}

export function normalizeTutorialProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const completedTaskIds = uniqueKnown(value.completedTaskIds);
  const archivedTaskIds = uniqueKnown(value.archivedTaskIds);
  const skippedTaskIds = uniqueKnown(value.skippedTaskIds).filter((id) => !completedTaskIds.includes(id));
  let currentTaskId = ids.has(value.currentTaskId) ? value.currentTaskId : null;
  const oldCurriculum = !Number.isSafeInteger(value.version) || value.version < 2;
  const completed = Boolean(value.completed);
  const skipped = Boolean(value.skipped);
  const pendingGuide = oldCurriculum ? TUTORIAL_TASKS.find((item) => item.guide && !completedTaskIds.includes(item.id) && !skippedTaskIds.includes(item.id)) : null;
  const currentIndex = currentTaskId ? TUTORIAL_TASKS.findIndex((item) => item.id === currentTaskId) : -1;
  const guideIndex = pendingGuide ? TUTORIAL_TASKS.findIndex((item) => item.id === pendingGuide.id) : -1;
  const showUpdatedGuide = Boolean(pendingGuide && !skipped && (completed || currentIndex > guideIndex));
  if (showUpdatedGuide) currentTaskId = pendingGuide.id;
  const task = currentTaskId ? TUTORIAL_TASK_BY_ID.get(currentTaskId) : null;
  const seenHints = Array.isArray(value.seenHints) ? [...new Set(value.seenHints.filter((id) => typeof id === 'string' && id.length < 64))] : [];
  const finished = Boolean((completed && !showUpdatedGuide) || skipped);
  return {
    version: 2,
    started: value.started !== false,
    completed: completed && !showUpdatedGuide,
    skipped,
    replaying: Boolean(value.replaying) && !finished,
    dismissed: Boolean(value.dismissed),
    currentModule: task?.moduleId ?? (TUTORIAL_MODULES.some((module) => module.id === value.currentModule) ? value.currentModule : TUTORIAL_MODULES[0].id),
    currentTaskId: finished ? null : currentTaskId ?? TUTORIAL_TASKS.find((item) => !completedTaskIds.includes(item.id) && !skippedTaskIds.includes(item.id))?.id ?? null,
    completedTaskIds,
    archivedTaskIds,
    skippedTaskIds,
    hintsEnabled: value.hintsEnabled !== false,
    seenHints,
  };
}

export function getTutorialTaskStatus(progress, taskId) {
  if (progress.completedTaskIds.includes(taskId)) return 'completed';
  if (progress.skippedTaskIds.includes(taskId)) return 'skipped';
  if (progress.currentTaskId === taskId && !progress.completed && !progress.skipped) return 'active';
  return 'not-started';
}

export function getTutorialTaskIndex(progress) {
  if (!progress.currentTaskId) return TUTORIAL_TASKS.length;
  return TUTORIAL_TASKS.findIndex((task) => task.id === progress.currentTaskId);
}

export function getTutorialModule(progress) {
  return TUTORIAL_MODULES.find((module) => module.id === progress.currentModule) ?? TUTORIAL_MODULES[0];
}
