import { spendResources } from './resources.js';
import { currentSystem, shipDistanceAU } from './energy.js';
import { generateStarSystem, INTERSYSTEM_TRAVEL_COST, INTERSYSTEM_TRAVEL_DAYS, SYSTEM_DISCOVERY_COST, SYSTEM_DISCOVERY_DAYS, SYSTEM_LIMIT } from '../world/systemGenerator.js';

function writeJournal(state, kind, text) {
  state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind, text });
  state.journal = state.journal.slice(0, 60);
}

export function discoverSystem(state, { advanceTime, emit }) {
  if (state.systems.filter((system) => system.discovered && system.id !== 'helios-9').length >= SYSTEM_LIMIT - 1) {
    return { ok: false, message: 'Все доступные сигналы в текущем секторе уже обследованы.' };
  }
  if (!spendResources(state, { energy: SYSTEM_DISCOVERY_COST })) return { ok: false, message: 'Недостаточно энергии для поиска сигнала.' };

  const sequence = state.generatedSystemCount + 1;
  const seed = `${state.worldSeed}:signal:${sequence}`;
  const system = generateStarSystem(seed);
  if (state.systems.some((item) => item.id === system.id)) return { ok: false, message: 'Сигнал уже внесён в каталог.' };
  state.systems.push(system);
  state.generatedSystemCount = sequence;
  advanceTime(SYSTEM_DISCOVERY_DAYS, 'system-discovery', { recoveryDistanceAU: shipDistanceAU(state) });
  writeJournal(state, 'discovery', `Обнаружен новый сигнал: ${system.name}. Звезда классифицирована как ${system.star.type}; орбитальная съёмка планет ещё не выполнена.`);
  emit('system:discovered', { systemId: system.id, seed, planetCount: system.planets.length });
  return { ok: true, message: `Сигнал внесён в каталог · ${system.name}` };
}

export function systemTravelCost(state, targetSystemId) {
  const target = state.systems.find((system) => system.id === targetSystemId && system.discovered);
  return target && target.id !== state.currentSystemId ? INTERSYSTEM_TRAVEL_COST : null;
}

export function travelToSystem(state, targetSystemId, { advanceTime, emit }) {
  const target = state.systems.find((system) => system.id === targetSystemId && system.discovered);
  if (!target) return { ok: false, message: 'Система не обнаружена.' };
  if (target.id === state.currentSystemId) return { ok: false, message: 'Корабль уже находится в этой системе.' };
  if (!spendResources(state, { energy: INTERSYSTEM_TRAVEL_COST })) return { ok: false, message: 'Недостаточно энергии для межсистемного перехода.' };

  const origin = currentSystem(state);
  const recoveryDistanceAU = shipDistanceAU(state, origin);
  advanceTime(INTERSYSTEM_TRAVEL_DAYS, 'inter-system-travel', { recoveryDistanceAU });
  origin.visited = true;
  target.visited = true;
  target.knowledge ??= { starSurveyed: false, planetsDetected: false };
  target.knowledge.planetsDetected = true;
  target.star.revealed ??= ['type'];
  state.currentSystemId = target.id;
  state.system = target;
  state.shipAt = 'star';
  state.ship.location = { systemId: target.id, bodyId: 'star' };
  state.selectedPlanetId = target.planets[0]?.id ?? null;
  writeJournal(state, 'travel', `Межсистемный переход завершён. Экспедиция прибыла в ${target.name}; обнаружено планет: ${target.planets.length}.`);
  emit('system:entered', { fromSystemId: origin.id, systemId: target.id, planetsDetected: target.planets.length, days: INTERSYSTEM_TRAVEL_DAYS });
  return { ok: true, message: `Прибытие в ${target.name} · −${INTERSYSTEM_TRAVEL_COST} энергии · ${INTERSYSTEM_TRAVEL_DAYS} дней` };
}
