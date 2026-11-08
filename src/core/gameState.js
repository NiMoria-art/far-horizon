import { createEventBus } from './eventBus.js';
import { createGameTime } from './gameTime.js';
import { planets, starSystem } from '../world/planet.js';

export const initialTechnologies = [
  { id: 'solar', name: 'Эффективные солнечные панели', category: 'Энергетика', description: 'Снижают расход энергии на сканирование на 25%.', cost: 30, status: 'available' },
  { id: 'analyzer', name: 'Автономные анализаторы', category: 'Вычислительные технологии', description: 'Приносят на 8 научных данных больше за сканирование.', cost: 40, status: 'available' },
  { id: 'navigation', name: 'Улучшенная навигация', category: 'Двигателестроение', description: 'Снижает стоимость перелётов на 25%.', cost: 35, status: 'available' },
];
export function createNewState() {
  return { version: 1, system: structuredClone(starSystem), selectedPlanetId: 'vesper', shipAt: 'star', resources: { energy: 100, metals: 120, food: 180, science: 24 }, time: createGameTime(), technologies: structuredClone(initialTechnologies), activeTechnologyId: null, journal: [{ id: crypto.randomUUID(), day: 142, year: 2187, kind: 'system', text: 'Вход в систему H-09. E.O.S. ожидает ваших распоряжений.' }] };
}
export function createGame(initial = createNewState()) {
  const state = initial;
  const events = createEventBus();
  const publish = (type = 'change') => events.emit(type, state);
  return { state, on: events.on, emit: events.emit, changed: publish };
}

