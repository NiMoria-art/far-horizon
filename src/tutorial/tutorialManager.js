import { TUTORIAL_MODULE_BY_ID, TUTORIAL_TASK_BY_ID, TUTORIAL_TASKS } from './tutorialData.js';
import { tutorialEventCompletes, tutorialTaskAlreadySatisfied, nextPendingTutorialTask } from './tutorialConditions.js';
import { createTutorialProgress, getTutorialTaskIndex, normalizeTutorialProgress } from './tutorialProgress.js';
import { loadTutorialProgress, saveTutorialProgress } from './tutorialStorage.js';
import { scanEnergyCost } from '../simulation/exploration.js';
import { travelEnergyCost } from '../simulation/travel.js';
import { INTERSYSTEM_TRAVEL_COST, SYSTEM_DISCOVERY_COST } from '../world/systemGenerator.js';

export function createTutorialManager(game, { storage = globalThis.localStorage, onChange = () => {} } = {}) {
  const savedProgress = loadTutorialProgress(storage);
  let progress = savedProgress ?? createTutorialProgress();
  let contextHint = null;
  let destroyed = false;
  const persist = () => {
    saveTutorialProgress(progress, storage);
    onChange(getSnapshot());
  };

  function getSnapshot() {
    const task = progress.currentTaskId ? TUTORIAL_TASK_BY_ID.get(progress.currentTaskId) ?? null : null;
    return { progress: structuredClone(progress), task, module: task ? TUTORIAL_MODULE_BY_ID.get(task.moduleId) ?? null : null, contextHint, taskIndex: getTutorialTaskIndex(progress), taskCount: TUTORIAL_TASKS.length };
  }

  function updateCurrentFromState() {
    if (progress.replaying) return;
    let task = progress.currentTaskId ? TUTORIAL_TASK_BY_ID.get(progress.currentTaskId) : null;
    let advanced = false;
    while (task && task.condition !== 'acknowledge' && tutorialTaskAlreadySatisfied(task, game.state)) {
      progress.completedTaskIds.push(task.id);
      task = nextPendingTutorialTask(progress, task.id);
      progress.currentTaskId = task?.id ?? null;
      progress.currentModule = task?.moduleId ?? progress.currentModule;
      advanced = true;
    }
    if (!task && !progress.skipped) {
      progress.completed = true;
      progress.skipped = false;
      progress.currentTaskId = null;
    }
    if (advanced || !progress.started) persist();
  }

  function advanceCurrent(status = 'completed') {
    const task = progress.currentTaskId ? TUTORIAL_TASK_BY_ID.get(progress.currentTaskId) : null;
    if (!task) return false;
    const target = status === 'skipped' ? progress.skippedTaskIds : progress.completedTaskIds;
    if (!target.includes(task.id)) target.push(task.id);
    const next = nextPendingTutorialTask(progress, task.id);
    progress.currentTaskId = next?.id ?? null;
    if (next) progress.currentModule = next.moduleId;
    else {
      progress.completed = status !== 'skipped';
      progress.skipped = !progress.completed;
      progress.replaying = false;
    }
    persist();
    updateCurrentFromState();
    inspectEnergyContext();
    return true;
  }

  function handleEvent(type, payload = {}) {
    if (destroyed) return;
    const task = progress.currentTaskId ? TUTORIAL_TASK_BY_ID.get(progress.currentTaskId) : null;
    if (task && task.condition !== 'acknowledge' && tutorialEventCompletes(task, type, payload)) advanceCurrent();
    if (type === 'tutorial:action-result' && payload.ok === false && typeof payload.message === 'string') {
      const message = payload.message.toLowerCase();
      if (message.includes('недостаточно энергии')) showContextHint('low-energy', 'Энергии не хватает для этой операции. Время можно продвинуть ожиданием в обзоре; расчётная скорость зависит от расстояния до звезды.');
      else if (message.includes('недостаточно научных данных')) showContextHint('low-science', 'Для технологии нужны научные данные. Их можно получить сканированием неизвестных объектов.');
    }
    if (type === 'system:discovered') showContextHint('new-system', 'Система добавлена в каталог. Её свойства будут постепенно раскрыты после прибытия и сканирования.');
  }

  function inspectEnergyContext() {
    const task = progress.currentTaskId ? TUTORIAL_TASK_BY_ID.get(progress.currentTaskId) : null;
    if (!task || !progress.hintsEnabled) return;
    const requiredEnergy = {
      'scan-planet': scanEnergyCost(game.state),
      'scan-star': scanEnergyCost(game.state),
      'travel-to-planet': travelEnergyCost(game.state, game.state.selectedPlanetId) ?? 0,
      'discover-system': SYSTEM_DISCOVERY_COST,
      'enter-system': INTERSYSTEM_TRAVEL_COST,
    }[task.id] ?? 0;
    if (requiredEnergy > 0 && game.state.resources.energy < requiredEnergy) showContextHint('low-energy', 'Запаса энергии может не хватить для этой операции. Время можно продвинуть ожиданием в обзоре; скорость восстановления зависит от расстояния до звезды.');
  }

  function showContextHint(id, message) {
    if (!progress.hintsEnabled || progress.seenHints.includes(id)) return;
    progress.seenHints.push(id);
    contextHint = { id, message };
    persist();
  }

  const unsubs = ['planet:selected', 'tab:opened', 'planet:scanned', 'star:scanned', 'ship:arrived', 'time:advanced', 'technology:studied', 'system:discovered', 'system:entered', 'tutorial:action-result']
    .map((type) => game.on(type, (payload) => handleEvent(type, payload)));
  unsubs.push(game.on('change', inspectEnergyContext));

  function acknowledge() {
    if (progress.currentTaskId && TUTORIAL_TASK_BY_ID.get(progress.currentTaskId)?.condition === 'acknowledge') return advanceCurrent();
    return false;
  }

  function close() { progress.dismissed = true; persist(); }
  function open() { progress.dismissed = false; persist(); }
  function toggle() { if (progress.dismissed || progress.completed || progress.skipped) open(); else close(); }
  function skipTask() { return advanceCurrent('skipped'); }
  function skipAll() {
    progress.skippedTaskIds = [...new Set([...progress.skippedTaskIds, ...TUTORIAL_TASKS.filter((task) => !progress.completedTaskIds.includes(task.id)).map((task) => task.id)])];
    progress.currentModule = TUTORIAL_TASKS.at(-1).moduleId;
    progress.currentTaskId = null;
    progress.completed = false;
    progress.skipped = true;
    progress.replaying = false;
    progress.dismissed = false;
    persist();
  }
  function restart() {
    const hintsEnabled = progress.hintsEnabled;
    const archivedTaskIds = [...new Set([...(progress.archivedTaskIds ?? []), ...progress.completedTaskIds])];
    progress = createTutorialProgress(hintsEnabled);
    progress.archivedTaskIds = archivedTaskIds;
    progress.replaying = true;
    contextHint = null;
    persist();
  }
  function toggleHints() { progress.hintsEnabled = !progress.hintsEnabled; if (!progress.hintsEnabled) contextHint = null; persist(); }
  function dismissHint() { contextHint = null; persist(); }
  function setProgress(value) { progress = normalizeTutorialProgress(value) ?? createTutorialProgress(); persist(); updateCurrentFromState(); }
  function getProgress() { return structuredClone(progress); }

  updateCurrentFromState();
  inspectEnergyContext();
  if (!savedProgress) persist();
  return { getSnapshot, getProgress, acknowledge, close, open, toggle, skipTask, skipAll, restart, toggleHints, dismissHint, setProgress, destroy() { destroyed = true; unsubs.forEach((unsubscribe) => unsubscribe()); } };
}
