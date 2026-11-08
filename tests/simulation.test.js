import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewState } from '../src/core/gameState.js';
import { scanPlanet } from '../src/simulation/exploration.js';
import { travelTo } from '../src/simulation/travel.js';
import { startResearch } from '../src/simulation/research.js';

test('scanning reveals planet data, consumes energy and advances time once per useful scan', () => {
  const state = createNewState();
  const planet = state.system.planets.find((item) => item.id === 'cinder');
  const energy = state.resources.energy;
  const year = state.time.year;
  assert.equal(scanPlanet(state, planet.id).ok, true);
  assert.equal(planet.revealed.length, 3);
  assert.equal(state.resources.energy, energy - 12);
  assert.equal(state.resources.science, 36);
  assert.equal(state.time.year > year || state.time.day === 160, true);
  assert.equal(state.journal[0].kind, 'scan');
  assert.equal(scanPlanet(state, planet.id).ok, true);
  const science = state.resources.science;
  assert.equal(scanPlanet(state, planet.id).ok, false);
  assert.equal(state.resources.science, science);
});

test('travel is blocked without energy and moves the ship when affordable', () => {
  const state = createNewState();
  state.resources.energy = 0;
  assert.equal(travelTo(state, 'cinder').ok, false);
  assert.equal(state.shipAt, 'star');
  state.resources.energy = 100;
  assert.equal(travelTo(state, 'cinder').ok, true);
  assert.equal(state.shipAt, 'cinder');
  assert.equal(state.journal[0].kind, 'travel');
});

test('technology requires science and applies its effect after completion', () => {
  const state = createNewState();
  assert.equal(startResearch(state, 'solar').ok, false);
  scanPlanet(state, 'cinder');
  assert.equal(startResearch(state, 'solar').ok, true);
  assert.equal(state.technologies.find((item) => item.id === 'solar').status, 'studied');
  assert.equal(state.activeTechnologyId, null);
  const before = state.resources.energy;
  assert.equal(scanPlanet(state, 'vesper').ok, true);
  assert.equal(state.resources.energy, before - 9);
});
import { loadGame, saveGame, clearSave } from '../src/storage/saveManager.js';

test('save manager round-trips game state in localStorage', () => {
  const values = new Map();
  globalThis.localStorage = {
    setItem(key, value) { values.set(key, value); },
    getItem(key) { return values.get(key) ?? null; },
    removeItem(key) { values.delete(key); },
  };
  const state = createNewState();
  state.resources.energy = 73;
  assert.equal(saveGame(state), true);
  assert.equal(loadGame().resources.energy, 73);
  clearSave();
  assert.equal(loadGame(), null);
  delete globalThis.localStorage;
});
