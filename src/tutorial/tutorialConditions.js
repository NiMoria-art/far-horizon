import { TUTORIAL_MODULES, TUTORIAL_TASKS, TUTORIAL_TASK_BY_ID } from './tutorialData.js';

const eventMatches = {
  'planet-selected': (type) => type === 'planet:selected',
  'overview-opened': (type, payload) => type === 'tab:opened' && payload.tab === 'overview',
  'planet-scanned': (type) => type === 'planet:scanned',
  'star-scanned': (type) => type === 'star:scanned',
  'journal-opened': (type, payload) => type === 'tab:opened' && payload.tab === 'log',
  'planet-reached': (type, payload) => type === 'ship:arrived' && payload.destinationId !== 'star',
  'overview-energy-opened': (type, payload) => type === 'tab:opened' && payload.tab === 'overview',
  'waited-30-days': (type, payload) => type === 'time:advanced' && payload.source === 'manual-wait' && payload.days >= 30,
  'research-opened': (type, payload) => type === 'tab:opened' && payload.tab === 'research',
  'technology-studied': (type) => type === 'technology:studied',
  'system-discovered': (type) => type === 'system:discovered',
  'system-entered': (type) => type === 'system:entered',
};

export function tutorialEventCompletes(task, type, payload) {
  return Boolean(eventMatches[task.condition]?.(type, payload));
}

export function tutorialTaskAlreadySatisfied(task, gameState) {
  if (task.condition === 'planet-scanned') return gameState.systems?.some((system) => system.planets?.some((planet) => planet.scanned)) ?? false;
  if (task.condition === 'star-scanned') return (gameState.system?.star?.revealed ?? []).includes('luminosity') && (gameState.system?.star?.revealed ?? []).includes('temperature') && (gameState.system?.star?.revealed ?? []).includes('radius');
  if (task.condition === 'planet-reached') return gameState.shipAt !== 'star';
  if (task.condition === 'technology-studied') return gameState.technologies?.some((technology) => technology.status === 'studied') ?? false;
  if (task.condition === 'system-discovered') return gameState.systems?.some((system) => system.id !== 'helios-9' && system.discovered) ?? false;
  if (task.condition === 'system-entered') return gameState.systems?.some((system) => system.id !== 'helios-9' && system.visited) ?? false;
  return false;
}

export function nextPendingTutorialTask(progress, afterTaskId = null) {
  const start = Math.max(0, TUTORIAL_TASKS.findIndex((task) => task.id === afterTaskId) + 1);
  for (let offset = 0; offset < TUTORIAL_TASKS.length; offset += 1) {
    const task = TUTORIAL_TASKS[(start + offset) % TUTORIAL_TASKS.length];
    if (!progress.completedTaskIds.includes(task.id) && !progress.skippedTaskIds.includes(task.id)) return task;
  }
  return null;
}

export function moduleForTutorialTask(taskId) {
  const task = TUTORIAL_TASK_BY_ID.get(taskId);
  return task ? TUTORIAL_MODULES.find((module) => module.id === task.moduleId) ?? null : null;
}
