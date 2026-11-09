import { createEventBus } from './eventBus.js';
import { createGameTime } from './gameTime.js';
import { planets, starSystem } from '../world/planet.js';
import { initialTechnologies } from '../simulation/technologyTree.js';
export { initialTechnologies };
export function createNewState({ seed = crypto.randomUUID() } = {}) {
  const system = structuredClone(starSystem);
  system.planets = structuredClone(planets);
  system.visited = true;
  const state = {
    version: 4,
    worldSeed: String(seed),
    systems: [system],
    currentSystemId: system.id,
    system,
    generatedSystemCount: 0,
    ship: { location: { systemId: system.id, bodyId: 'star' }, maxEnergy: 100, energyRemainder: 0, maxMetals: 500, maxFood: 500, foodRemainder: 0 },
    selectedPlanetId: 'vesper',
    shipAt: 'star',
    resources: { energy: 100, metals: 120, food: 180, science: 24 },
    time: createGameTime(),
    technologies: structuredClone(initialTechnologies),
    activeTechnologyId: null,
    journal: [{ id: crypto.randomUUID(), day: 142, year: 2187, kind: 'system', text: 'Вход в систему H-09. E.O.S. ожидает ваших распоряжений.' }],
  };
  return state;
}
export function createGame(initial = createNewState()) {
  const state = initial;
  const events = createEventBus();
  const publish = (type = 'change') => events.emit(type, state);
  return { state, on: events.on, emit: events.emit, changed: publish };
}

