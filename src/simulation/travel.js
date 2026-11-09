import { ACTION_DURATIONS, TRAVEL_ENERGY } from './rules.js';
import { spendResources } from './resources.js';
import { currentSystem, shipDistanceAU } from './energy.js';
import { technologyBonuses } from './technologyTree.js';
export const travelEnergyCost = (state, destinationId) => {
  const system = currentSystem(state);
  const travelFactor=technologyBonuses(state).travelCost;
  if (destinationId === 'star') return Math.max(1, Math.ceil(TRAVEL_ENERGY.returnToStar * travelFactor));
  const index = system.planets.findIndex((item) => item.id === destinationId);
  if (index < 0) return null;
  return Math.max(1, Math.ceil((TRAVEL_ENERGY.base + index * TRAVEL_ENERGY.perOrbit) * travelFactor));
};

export function travelTo(state, destinationId, { advanceTime, emit }) {
  const system = currentSystem(state);
  if (state.shipAt === destinationId) return { ok: false, message: 'Корабль уже находится в этой точке.' };
  const destinationIndex = destinationId === 'star' ? -1 : system.planets.findIndex((item) => item.id === destinationId);
  const originIndex = state.shipAt === 'star' ? -1 : system.planets.findIndex((item) => item.id === state.shipAt);
  if (destinationIndex < -1 || originIndex < -1 || (state.shipAt !== 'star' && originIndex === -1)) return { ok: false, message: 'Точка перелёта не найдена.' };
  const cost = travelEnergyCost(state, destinationId);
  if (cost === null) return { ok: false, message: 'Точка перелёта не найдена.' };
  if (!spendResources(state, { energy: cost })) return { ok: false, message: 'Недостаточно энергии для перелёта.' };
  const days = ACTION_DURATIONS.travelBase + Math.abs(destinationIndex - originIndex) * ACTION_DURATIONS.travelPerOrbit;
  const originId = state.shipAt;
  const originDistance = shipDistanceAU(state, system);
  const destinationDistance = destinationId === 'star' ? 0.25 : (system.planets[destinationIndex].orbitAU ?? system.planets[destinationIndex].orbit / 149.6);
  advanceTime(days, 'in-system-travel', { recoveryDistanceAU: (originDistance + destinationDistance) / 2 });
  state.shipAt = destinationId;
  state.ship.location = { systemId: system.id, bodyId: destinationId };
  const destination = destinationId === 'star' ? `орбита звезды ${system.star.name}` : `орбита ${system.planets.find((item) => item.id === destinationId).name}`;
  state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind: 'travel', text: `Перелёт завершён. Корабль прибыл: ${destination}. Расход энергии: ${cost}.` });
  state.journal = state.journal.slice(0, 60);
  emit('ship:arrived', { systemId: system.id, destinationId, originId, energySpent: cost, days });
  return { ok: true, message: `Перелёт завершён · −${cost} энергии · ${days} дней` };
}
