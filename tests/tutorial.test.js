import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createNewState } from '../src/core/gameState.js';
import { createSimulationEngine } from '../src/core/simulationEngine.js';
import { scanPlanet } from '../src/simulation/exploration.js';
import { createTutorialManager } from '../src/tutorial/tutorialManager.js';
import { TUTORIAL_TASKS } from '../src/tutorial/tutorialData.js';
import { getTutorialTaskStatus, normalizeTutorialProgress } from '../src/tutorial/tutorialProgress.js';
import { loadTutorialProgress, saveTutorialProgress, TUTORIAL_SAVE_KEY } from '../src/tutorial/tutorialStorage.js';

function memoryStorage() {
  const items = new Map();
  return { getItem(key) { return items.get(key) ?? null; }, setItem(key, value) { items.set(key, String(value)); }, removeItem(key) { items.delete(key); }, items };
}

function setup(storage = memoryStorage()) {
  const game = createGame(createNewState({ seed: 'tutorial-fixture' }));
  const saves = [];
  const manager = createTutorialManager(game, { storage, onChange: (snapshot) => saves.push(snapshot.progress.currentTaskId) });
  return { game, storage, manager, saves };
}

test('tutorial starts independently and persists its first task', () => {
  const { manager, storage } = setup();
  assert.equal(manager.getProgress().started, true);
  assert.equal(manager.getSnapshot().task.id, 'welcome');
  assert.equal(loadTutorialProgress(storage).currentTaskId, 'welcome');
  assert.equal(storage.items.has(TUTORIAL_SAVE_KEY), true);
});

test('tutorial advances only when the current task condition is met', () => {
  const { game, manager, storage } = setup();
  game.emit('tab:opened', { tab: 'overview' });
  assert.equal(manager.getSnapshot().task.id, 'welcome');
  manager.acknowledge();
  assert.equal(manager.getSnapshot().task.id, 'select-planet');
  game.emit('planet:selected', { planetId: 'vesper' });
  assert.equal(manager.getSnapshot().task.id, 'open-overview');
  game.emit('tab:opened', { tab: 'research' });
  assert.equal(manager.getSnapshot().task.id, 'open-overview');
  game.emit('tab:opened', { tab: 'overview' });
  assert.equal(manager.getSnapshot().task.id, 'scan-planet');
  assert.equal(manager.getProgress().completedTaskIds.length, 3);
});

test('a successful real scan completes the scan task; a failed scan does not', () => {
  const { game, manager } = setup();
  manager.acknowledge();
  game.emit('planet:selected', { planetId: 'vesper' });
  game.emit('tab:opened', { tab: 'overview' });
  const engine = createSimulationEngine(game);
  const failed = engine.run('scan', (state, context) => scanPlanet(state, 'missing', context));
  assert.equal(failed.ok, false);
  assert.equal(manager.getSnapshot().task.id, 'scan-planet');
  const successful = engine.run('scan', (state, context) => scanPlanet(state, 'vesper', context));
  assert.equal(successful.ok, true);
  assert.equal(manager.getSnapshot().task.id, 'scan-star');
  assert.ok(manager.getProgress().completedTaskIds.includes('scan-planet'));
});

test('training resumes from saved progress after manager recreation', () => {
  const storage = memoryStorage();
  const first = setup(storage);
  first.manager.acknowledge();
  first.manager.destroy();
  const restored = createTutorialManager(first.game, { storage });
  assert.equal(restored.getSnapshot().task.id, 'select-planet');
  assert.equal(restored.getProgress().completedTaskIds[0], 'welcome');
});

test('replay presents already satisfied exercises instead of changing the saved expedition', () => {
  const { game, manager } = setup();
  game.state.system.planets[0].scanned = true;
  const before = structuredClone(game.state);
  manager.restart();
  manager.acknowledge();
  game.emit('planet:selected', { planetId: 'vesper' });
  game.emit('tab:opened', { tab: 'overview' });
  assert.equal(manager.getSnapshot().task.id, 'scan-planet');
  assert.deepEqual(game.state, before);
});

test('skip and replay affect training only, never the expedition save', () => {
  const { game, manager, storage } = setup();
  manager.acknowledge();
  const before = structuredClone(game.state);
  manager.toggleHints();
  assert.equal(manager.getProgress().hintsEnabled, false);
  manager.skipAll();
  assert.equal(manager.getProgress().skipped, true);
  assert.equal(manager.getProgress().skippedTaskIds.length, TUTORIAL_TASKS.length - 1);
  assert.ok(manager.getProgress().completedTaskIds.includes('welcome'));
  assert.deepEqual(game.state, before);
  manager.destroy();
  const restored = createTutorialManager(game, { storage });
  assert.equal(restored.getProgress().skipped, true);
  assert.equal(restored.getSnapshot().task, null);
  restored.restart();
  assert.equal(restored.getSnapshot().task.id, 'welcome');
  assert.equal(restored.getProgress().hintsEnabled, false);
  assert.equal(restored.getProgress().replaying, true);
  assert.ok(restored.getProgress().archivedTaskIds.includes('welcome'));
  assert.deepEqual(game.state, before);
});

test('tutorial can be closed and reopened without losing the current task', () => {
  const { manager } = setup();
  manager.acknowledge();
  manager.close();
  assert.equal(manager.getProgress().dismissed, true);
  assert.equal(manager.getProgress().currentTaskId, 'select-planet');
  manager.toggle();
  assert.equal(manager.getProgress().dismissed, false);
  assert.equal(manager.getSnapshot().task.id, 'select-planet');
});

test('context hints are one-time and respect the saved setting', () => {
  const { game, manager } = setup();
  game.emit('tutorial:action-result', { action: 'scan', ok: false, message: 'Недостаточно энергии для сканирования.' });
  assert.equal(manager.getSnapshot().contextHint.id, 'low-energy');
  manager.dismissHint();
  game.emit('tutorial:action-result', { action: 'travel', ok: false, message: 'Недостаточно энергии для перелёта.' });
  assert.equal(manager.getSnapshot().contextHint, null);
  manager.toggleHints();
  game.emit('system:discovered', { systemId: 'another-system' });
  assert.equal(manager.getSnapshot().contextHint, null);
});

test('all lesson actions complete the program in order', () => {
  const { game, manager } = setup();
  manager.acknowledge();
  const events = [
    ['planet:selected', { planetId: 'vesper' }],
    ['tab:opened', { tab: 'overview' }],
    ['planet:scanned', { planetId: 'vesper' }],
    ['star:scanned', { systemId: 'helios-9' }],
    ['tab:opened', { tab: 'log' }],
    ['ship:arrived', { destinationId: 'vesper' }],
    ['tab:opened', { tab: 'overview' }],
    ['time:advanced', { source: 'manual-wait', days: 30 }],
    ['tab:opened', { tab: 'research' }],
    ['technology:studied', { technologyId: 'solar' }],
    ['system:discovered', { systemId: 'system-2' }],
    ['system:entered', { systemId: 'system-2' }],
  ];
  for (const [type, payload] of events) game.emit(type, payload);
  assert.equal(manager.getProgress().completed, true);
  assert.equal(manager.getSnapshot().task, null);
  assert.equal(manager.getProgress().completedTaskIds.length, TUTORIAL_TASKS.length);
});

test('training progress normalizes corrupt and future task IDs without changing the game save format', () => {
  const progress = normalizeTutorialProgress({ version: 99, currentTaskId: 'future-task', completedTaskIds: ['welcome', 'future-task'], skippedTaskIds: ['welcome'], hintsEnabled: false });
  assert.equal(progress.currentTaskId, 'select-planet');
  assert.deepEqual(progress.completedTaskIds, ['welcome']);
  assert.deepEqual(progress.skippedTaskIds, []);
  assert.equal(progress.hintsEnabled, false);
  assert.equal(getTutorialTaskStatus(progress, 'welcome'), 'completed');
  assert.equal(getTutorialTaskStatus(progress, 'select-planet'), 'active');
  const oldExpedition = createNewState({ seed: 'old-save' });
  oldExpedition.version = 2;
  const before = structuredClone(oldExpedition);
  const tutorialStorage = memoryStorage();
  saveTutorialProgress(progress, tutorialStorage);
  assert.deepEqual(oldExpedition, before);
  assert.equal(loadTutorialProgress(tutorialStorage).version, 1);
});
