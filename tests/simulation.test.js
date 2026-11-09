import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createNewState } from '../src/core/gameState.js';
import { advanceDays } from '../src/core/gameTime.js';
import { createSimulationEngine } from '../src/core/simulationEngine.js';
import { addResources, canAfford, spendResources, transactResources } from '../src/simulation/resources.js';
import { scanEnergyCost, scanPlanet } from '../src/simulation/exploration.js';
import { travelEnergyCost, travelTo } from '../src/simulation/travel.js';
import { startResearch } from '../src/simulation/research.js';
import { clearSave, loadGame, migrateSave, saveGame } from '../src/storage/saveManager.js';
import { generateStarSystem } from '../src/world/systemGenerator.js';
import { discoverSystem, systemTravelCost, travelToSystem } from '../src/simulation/systemNavigation.js';
import { energyRecoveryRate, recoverEnergy, shipDistanceAU } from '../src/simulation/energy.js';
import { scanStar } from '../src/simulation/exploration.js';
import { panelMarkup } from '../src/ui/panels.js';
import { advanceEconomy, startMining } from '../src/simulation/economy.js';
import { assessHabitability, PLANET_SCAN_FIELDS } from '../src/world/habitability.js';

function harness(options = {}) {
  const game = createGame(createNewState());
  const saved = [];
  const engine = createSimulationEngine(game, { save: (state) => { saved.push(structuredClone(state)); return true; }, ...options });
  return { game, engine, saved };
}

test('game time advances by integer game days and normalizes year boundaries', () => {
  const time = { year: 2187, day: 365 };
  advanceDays(time, 1);
  assert.deepEqual(time, { year: 2188, day: 1 });
  advanceDays(time, 364);
  assert.deepEqual(time, { year: 2188, day: 365 });
  assert.throws(() => advanceDays(time, -1), RangeError);
  assert.throws(() => advanceDays(time, 1.5), RangeError);
  assert.throws(() => advanceDays(time, Number.MAX_SAFE_INTEGER), RangeError);
  assert.deepEqual(time, { year: 2188, day: 365 });
});

test('engine processes time, emits domain events and saves only successful actions', () => {
  const observed = [];
  const { game, engine, saved } = harness({ timeProcessors: [({ days, source }) => observed.push([source, days])] });
  const events = [];
  game.on('time:advanced', (event) => events.push(['time', event.days]));
  game.on('planet:scanned', (event) => events.push(['scan', event.scienceGained]));

  const result = engine.run('scan', (state, context) => scanPlanet(state, 'cinder', context));
  assert.equal(result.ok, true);
  assert.deepEqual(observed, [['scan', 18]]);
  assert.deepEqual(events, [['time', 18], ['scan', 12]]);
  assert.equal(game.state.time.day, 160);
  assert.equal(saved.length, 1);

  const before = structuredClone(game.state);
  const failed = engine.run('scan', (state, context) => scanPlanet(state, 'missing', context));
  assert.equal(failed.ok, false);
  assert.deepEqual(game.state, before);
  assert.equal(saved.length, 1);
});

test('a failed action rolls back partial changes and publishes no event', () => {
  const { game, engine, saved } = harness();
  let eventCount = 0;
  game.on('time:advanced', () => eventCount++);
  const before = structuredClone(game.state);
  const result = engine.run('invalid', (state, context) => {
    state.resources.energy = 0;
    context.advanceTime(9);
    return { ok: false, message: 'rejected' };
  });
  assert.equal(result.ok, false);
  assert.deepEqual(game.state, before);
  assert.equal(eventCount, 0);
  assert.equal(saved.length, 0);
});

test('time processors can be registered and removed, with no real-time tick', () => {
  const { game, engine } = harness();
  const calls = [];
  const remove = engine.registerTimeProcessor(({ days }) => calls.push(days));
  assert.equal(engine.advanceBy(10).ok, true);
  remove();
  assert.equal(engine.advanceBy(4).ok, true);
  assert.deepEqual(calls, [10]);
  assert.equal(game.state.time.day, 156);
});

test('resource costs and gains are validated atomically', () => {
  const state = createNewState();
  assert.equal(canAfford(state, { energy: 12, science: 10 }), true);
  assert.equal(transactResources(state, { costs: { energy: 12, science: 25 }, gains: { metals: 8 } }), false);
  assert.deepEqual(state.resources, { energy: 100, metals: 120, food: 180, science: 24 });
  assert.equal(spendResources(state, { energy: 101 }), false);
  assert.equal(spendResources(state, { energy: -1 }), false);
  assert.equal(spendResources(state, null), false);
  assert.equal(addResources(state, { energy: Number.NaN }), false);
  assert.equal(transactResources(state, { costs: { energy: 10 }, gains: { science: 6 } }), true);
  assert.equal(state.resources.energy, 90);
  assert.equal(state.resources.science, 30);
  assert.equal(Object.values(state.resources).every((amount) => Number.isFinite(amount) && amount >= 0), true);
});

test('scanning preserves cost and duration, reveals data once, and records events', () => {
  const { game, engine } = harness();
  const cinder = game.state.system.planets.find((item) => item.id === 'cinder');
  const result = engine.run('scan', (state, context) => scanPlanet(state, cinder.id, context));
  assert.equal(result.ok, true);
  assert.deepEqual(cinder.revealed, ['type', 'temperature', 'atmosphere']);
  assert.equal(game.state.resources.energy, 88);
  assert.equal(game.state.resources.science, 36);
  assert.equal(game.state.time.day, 160);
  assert.equal(game.state.journal[0].kind, 'scan');
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, cinder.id, context)).ok, true);
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, cinder.id, context)).ok, true);
  assert.equal(cinder.revealed.length, 7);
  const before = structuredClone(game.state);
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, cinder.id, context)).ok, false);
  assert.deepEqual(game.state, before);
});

test('scanning with insufficient energy changes neither resources, time nor discoveries', () => {
  const { game, engine } = harness();
  game.state.resources.energy = 0;
  const before = structuredClone(game.state);
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, 'cinder', context)).ok, false);
  assert.deepEqual(game.state, before);
});

test('travel validates destination, preserves energy rules and records the actual origin', () => {
  const { game, engine } = harness();
  const before = structuredClone(game.state);
  assert.equal(engine.run('travel', (state, context) => travelTo(state, 'not-a-planet', context)).ok, false);
  assert.deepEqual(game.state, before);
  assert.equal(travelEnergyCost(game.state, 'vesper'), 17);
  assert.equal(engine.run('travel', (state, context) => travelTo(state, 'vesper', context)).ok, true);
  assert.equal(game.state.shipAt, 'vesper');
  assert.equal(game.state.resources.energy, 83);
  assert.equal(game.state.time.day, 170);
  assert.equal(game.state.journal[0].kind, 'travel');
  let arrival;
  game.on('ship:arrived', (event) => { arrival = event; });
  game.state.technologies.find((item) => item.id === 'navigation').status = 'studied';
  assert.equal(travelEnergyCost(game.state, 'star'), 6);
  assert.equal(engine.run('travel', (state, context) => travelTo(state, 'star', context)).ok, true);
  assert.equal(arrival.originId, 'vesper');
  assert.equal(arrival.destinationId, 'star');
});

test('travel with insufficient energy does not move the ship or advance time', () => {
  const { game, engine } = harness();
  game.state.resources.energy = 0;
  const before = structuredClone(game.state);
  assert.equal(engine.run('travel', (state, context) => travelTo(state, 'cinder', context)).ok, false);
  assert.deepEqual(game.state, before);
});

test('research uses the shared time engine and applies technology effects', () => {
  const { game, engine } = harness();
  assert.equal(engine.run('research', (state, context) => startResearch(state, 'solar', context)).ok, false);
  engine.run('scan', (state, context) => scanPlanet(state, 'cinder', context));
  assert.equal(engine.run('research', (state, context) => startResearch(state, 'solar', context)).ok, true);
  assert.equal(game.state.technologies.find((item) => item.id === 'solar').status, 'studied');
  assert.equal(game.state.activeTechnologyId, null);
  assert.equal(game.state.time.day, 220);
  const before = game.state.resources.energy;
  assert.equal(scanEnergyCost(game.state), 9);
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, 'vesper', context)).ok, true);
  assert.equal(game.state.resources.energy, before - 9);
  assert.equal(game.state.journal[0].kind, 'scan');
  assert.equal(game.state.journal.some((entry) => entry.kind === 'research'), true);
});

test('save migration retains v1 progress, safely normalizes dates, and round-trips', () => {
  const values = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    setItem(key, value) { values.set(key, value); },
    getItem(key) { return values.get(key) ?? null; },
    removeItem(key) { values.delete(key); },
  };
  try {
    const oldState = createNewState();
    oldState.version = 1;
    oldState.resources.energy = 73;
    oldState.time = { year: 2187, day: 366 };
    oldState.shipAt = 'cinder';
    oldState.modExtension = { progress: 5 };
    oldState.technologies.find((item) => item.id === 'solar').status = 'studied';
    const key = 'far-horizon.save.v1';
    values.set(key, JSON.stringify(oldState));

    const loaded = loadGame();
    assert.equal(loaded.version, 4);
    assert.equal(loaded.resources.energy, 73);
    assert.deepEqual(loaded.time, { year: 2188, day: 1 });
    assert.equal(loaded.shipAt, 'cinder');
    assert.deepEqual(loaded.modExtension, { progress: 5 });
    assert.equal(loaded.technologies.find((item) => item.id === 'solar').status, 'studied');
    assert.equal(values.get(key), JSON.stringify(oldState));

    assert.equal(saveGame(loaded), true);
    assert.equal(loadGame().resources.energy, 73);
    assert.equal(clearSave(), true);
    assert.equal(loadGame(), null);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

test('missing and malformed saves do not erase or throw over stored data', () => {
  const values = new Map([['far-horizon.save.v1', '{broken']]);
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    setItem(key, value) { values.set(key, value); },
    getItem(key) { return values.get(key) ?? null; },
    removeItem(key) { values.delete(key); },
  };
  try {
    assert.equal(loadGame(), null);
    assert.equal(values.get('far-horizon.save.v1'), '{broken');
    values.delete('far-horizon.save.v1');
    assert.equal(loadGame(), null);
    assert.equal(migrateSave(null), null);
    assert.equal(migrateSave({ version: 1 }).resources.energy, 100);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

test('system generation is seeded, identified and internally coherent', () => {
  const first = generateStarSystem('orion-seed-42');
  const second = generateStarSystem('orion-seed-42');
  assert.deepEqual(first, second);
  assert.equal(first.id, second.id);
  assert.equal(first.seed, 'orion-seed-42');
  assert.ok(first.planets.length >= 3 && first.planets.length <= 7);
  assert.ok(first.star.luminosity > 0 && first.star.radius > 0 && first.star.temperature > 0);
  assert.ok(first.planets.every((planet, index, list) => planet.radius > 0 && planet.orbit > 0 && Number.isFinite(planet.temperature)
    && Array.isArray(planet.resources) && Array.isArray(planet.revealed) && planet.revealed.length === 0
    && (index === 0 || planet.orbit > list[index - 1].orbit)));
});

test('planet and star scans reveal characteristics gradually and journal the findings', () => {
  const { game, engine } = harness();
  const planet = game.state.system.planets[0];
  assert.equal(planet.revealed.includes('resources'), false);
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, planet.id, context)).ok, true);
  assert.equal(planet.revealed.includes('resources'), false);
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, planet.id, context)).ok, true);
  assert.equal(planet.revealed.includes('resources'), false);
  assert.equal(engine.run('scan', (state, context) => scanPlanet(state, planet.id, context)).ok, true);
  assert.equal(planet.revealed.includes('resources'), true);
  assert.ok(game.state.journal[0].text.includes('ресурсы'));
  const revealedBefore = [...game.state.system.star.revealed];
  assert.equal(engine.run('star-scan', scanStar).ok, true);
  assert.ok(game.state.system.star.revealed.length > revealedBefore.length);
  assert.equal(game.state.journal[0].kind, 'scan');
});

test('system discovery continues procedurally beyond four systems with unique deterministic IDs', () => {
  const a = harness();
  const b = harness();
  a.game.state.worldSeed = b.game.state.worldSeed = 'fixed-expedition-seed';
  for (let index = 0; index < 8; index += 1) {
    assert.equal(a.engine.run('discover', discoverSystem).ok, true);
    assert.equal(b.engine.run('discover', discoverSystem).ok, true);
    assert.deepEqual(a.game.state.systems[index + 1], b.game.state.systems[index + 1]);
  }
  assert.equal(a.game.state.systems.length, 9);
  assert.equal(a.game.state.generatedSystemCount, 8);
  assert.equal(new Set(a.game.state.systems.map((system) => system.id)).size, 9);
  assert.equal(a.game.state.systems[1].visited, false);
  assert.equal(a.game.state.systems[1].planets[0].revealed.length, 0);
  assert.equal(a.game.state.journal[0].kind, 'discovery');
});

test('inter-system travel requires a discovered target and retains system and ship state', () => {
  const { game, engine } = harness();
  assert.equal(systemTravelCost(game.state, 'unknown'), null);
  assert.equal(engine.run('inter-system-travel', (state, context) => travelToSystem(state, 'unknown', context)).ok, false);
  assert.equal(engine.run('discover', discoverSystem).ok, true);
  const originId = game.state.currentSystemId;
  const target = game.state.systems[1];
  assert.equal(systemTravelCost(game.state, target.id), 35);
  assert.equal(engine.run('inter-system-travel', (state, context) => travelToSystem(state, target.id, context)).ok, true);
  assert.equal(game.state.currentSystemId, target.id);
  assert.equal(game.state.system, target);
  assert.equal(game.state.ship.location.systemId, target.id);
  assert.equal(game.state.shipAt, 'star');
  assert.equal(target.visited, true);
  assert.equal(target.knowledge.planetsDetected, true);
  assert.equal(game.state.systems.find((system) => system.id === originId).visited, true);
  assert.equal(game.state.journal[0].kind, 'travel');
});

test('inter-system travel rejects insufficient energy without partial changes', () => {
  const { game, engine } = harness();
  engine.run('discover', discoverSystem);
  game.state.resources.energy = 0;
  const target = game.state.systems[1];
  const before = structuredClone(game.state);
  assert.equal(engine.run('inter-system-travel', (state, context) => travelToSystem(state, target.id, context)).ok, false);
  assert.deepEqual(game.state, before);
});

test('stellar recovery depends on distance and star luminosity, accumulates time and respects capacity', () => {
  const state = createNewState({ seed: 'energy-test' });
  const closeRate = energyRecoveryRate(state, state.system, 0.25);
  const farRate = energyRecoveryRate(state, state.system, 2);
  assert.ok(closeRate > farRate);
  state.resources.energy = 90;
  let recovered;
  recoverEnergy({ state, days: 20, emit: (_type, payload) => { recovered = payload; }, recoveryDistanceAU: 0.25 });
  assert.equal(state.resources.energy, 96);
  assert.ok(state.ship.energyRemainder >= 0 && state.ship.energyRemainder < 1);
  state.resources.energy = state.ship.maxEnergy - 1;
  recoverEnergy({ state, days: 365, emit() {}, recoveryDistanceAU: 0.25 });
  assert.equal(state.resources.energy, state.ship.maxEnergy);
  assert.equal(state.ship.energyRemainder, 0);
  assert.ok(recovered.ratePerDay > 0);
  state.system.star.luminosity = 2;
  assert.ok(energyRecoveryRate(state, state.system, 1) > farRate);
});

test('energy recovery has a positive floor at distant orbits', () => {
  const state = createNewState({ seed: 'far-orbit-recovery' });
  const distance = 1e9;
  assert.equal(energyRecoveryRate(state, state.system, distance), 0.05);
  state.resources.energy = 0;
  recoverEnergy({ state, days: 30, emit() {}, recoveryDistanceAU: distance });
  assert.equal(state.resources.energy, 1);
  assert.ok(state.ship.energyRemainder > 0);
});

test('system panel offers an explicit return-to-star action from a planet', () => {
  const state = createNewState({ seed: 'return-button' });
  state.shipAt = state.system.planets[0].id;
  state.selectedPlanetId = state.shipAt;
  assert.match(panelMarkup(state, 'system'), /data-destination="star"[^>]*>.*Возврат к звезде/s);
  state.shipAt = 'star';
  assert.doesNotMatch(panelMarkup(state, 'system'), /Возврат к звезде/);
});

test('energy recovery runs only through the shared game-time transaction', () => {
  const { game, engine, saved } = harness();
  engine.registerTimeProcessor(recoverEnergy);
  game.state.resources.energy = 90;
  assert.equal(engine.advanceBy(30).ok, true);
  assert.equal(game.state.time.day, 172);
  assert.equal(game.state.resources.energy, 99);
  assert.equal(saved.length, 1);
});

test('save migration preserves v1 H-09 progress and adds v3 world and ship data', () => {
  const old = createNewState({ seed: 'legacy-fixture' });
  old.version = 1;
  old.resources.energy = 61;
  old.shipAt = 'vesper';
  old.system.planets.find((planet) => planet.id === 'vesper').revealed.push('composition');
  delete old.systems;
  delete old.currentSystemId;
  delete old.worldSeed;
  delete old.ship;
  delete old.generatedSystemCount;
  const restored = migrateSave(old);
  assert.equal(restored.version, 4);
  assert.equal(restored.system.id, 'helios-9');
  assert.equal(restored.systems.length, 1);
  assert.equal(restored.resources.energy, 61);
  assert.equal(restored.ship.location.bodyId, 'vesper');
  assert.ok(restored.system.planets.find((planet) => planet.id === 'vesper').revealed.includes('composition'));
  assert.ok(restored.system.planets.find((planet) => planet.id === 'vesper').resources.length > 0);
});

test('hydroponics gradually offsets crew food consumption only as game time advances', () => {
  const {game,engine}=harness({timeProcessors:[]});
  engine.registerTimeProcessor(advanceEconomy);
  const before=game.state.resources.food;
  assert.equal(game.state.ship.foodRemainder,0);
  engine.advanceBy(100);
  assert.equal(game.state.resources.food,before+5);
  assert.ok(game.state.ship.foodRemainder>0&&game.state.ship.foodRemainder<1);
});

test('scanned metal deposits can be mined gradually and save their finite site state', () => {
  const {game,engine}=harness({timeProcessors:[advanceEconomy]});
  const planet=game.state.system.planets.find((item)=>item.id==='cinder');
  planet.revealed.push('resources'); game.state.shipAt='cinder';
  const result=engine.run('mine',(state,context)=>startMining(state,'cinder',context));
  assert.equal(result.ok,true);
  assert.equal(game.state.resources.metals,102);
  engine.advanceBy(30);
  assert.equal(game.state.resources.metals,112);
  assert.equal(planet.miningSite.remaining,230);
});

test('technology tree contains five branches of eight projects with prerequisite locks',()=>{
  const state=createNewState();
  assert.equal(state.technologies.length,40);
  assert.equal(new Set(state.technologies.map((tech)=>tech.category)).size,5);
  assert.equal(state.technologies.filter((tech)=>tech.status==='available').length,5);
  assert.ok(state.technologies.some((tech)=>tech.status==='locked'&&tech.prerequisites.length));
});

test('human habitability assessment is withheld until scanned, then reports explainable factors',()=>{
  const state=createNewState();
  const planet=state.system.planets.find((item)=>item.id==='vesper');
  assert.equal(planet.revealed.includes('habitability'),false);
  const assessment=assessHabitability(planet);
  assert.ok(assessment.score>=0&&assessment.score<=100);
  assert.equal(assessment.factors.length,4);
  assert.ok(PLANET_SCAN_FIELDS.includes('habitability'));
  const markup=panelMarkup(state,'system');
  assert.match(markup,/ПРИГОДНОСТЬ ДЛЯ ЧЕЛОВЕЧЕСКОГО ПОСЕЛЕНИЯ/);
  assert.match(markup,/Неизвестно/);
  planet.revealed.push('habitability'); planet.habitability=assessment;
  assert.match(panelMarkup(state,'system'),/Предварительная оценка для людей/);
});
