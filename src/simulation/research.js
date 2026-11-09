import { ACTION_DURATIONS } from './rules.js';
import { spendResources } from './resources.js';
import { refreshTechnologyAvailability, technologyBonuses } from './technologyTree.js';
export function startResearch(state, technologyId, { advanceTime, emit }) {
  const tech = state.technologies.find((item) => item.id === technologyId);
  if (!tech || tech.status !== 'available') return { ok: false, message: 'Проект недоступен.' };
  if (state.activeTechnologyId) return { ok: false, message: 'Сначала завершите текущий проект.' };
  refreshTechnologyAvailability(state);
  if (tech.status !== 'available') return { ok: false, message: 'Сначала изучите необходимые проекты.' };
  const bonuses=technologyBonuses(state);
  const scienceCost=Math.ceil(tech.cost*bonuses.researchCost);
  if (!spendResources(state, { science: scienceCost, metals: tech.metalCost??0 })) return { ok: false, message: 'Недостаточно научных данных или металлов.' };
  tech.status = 'researching'; state.activeTechnologyId = tech.id;
  advanceTime(ACTION_DURATIONS.research);
  tech.status = 'studied'; state.activeTechnologyId = null;
  state.ship.maxEnergy = 100 + technologyBonuses(state).energyCapacity;
  state.resources.energy = Math.min(state.resources.energy,state.ship.maxEnergy);
  refreshTechnologyAvailability(state);
  state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind: 'research', text: `Технологическое исследование завершено: ${tech.name}. ${tech.description}` });
  state.journal = state.journal.slice(0, 60);
  emit('technology:studied', { technologyId: tech.id, name: tech.name, effect: tech.description });
  return { ok: true, message: `Исследование завершено · ${tech.name}` };
}
