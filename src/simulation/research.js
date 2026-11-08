import { advanceDays } from '../core/gameTime.js';
import { spendResources } from './resources.js';
export function startResearch(state, technologyId) {
  const tech = state.technologies.find((item) => item.id === technologyId);
  if (!tech || tech.status !== 'available') return { ok: false, message: 'Проект недоступен.' };
  if (state.activeTechnologyId) return { ok: false, message: 'Сначала завершите текущий проект.' };
  if (!spendResources(state, { science: tech.cost })) return { ok: false, message: 'Недостаточно научных данных.' };
  tech.status = 'researching'; state.activeTechnologyId = tech.id;
  advanceDays(state.time, 60);
  tech.status = 'studied'; state.activeTechnologyId = null;
  state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind: 'research', text: `Технологическое исследование завершено: ${tech.name}. ${tech.description}` });
  state.journal = state.journal.slice(0, 60);
  return { ok: true, message: `Исследование завершено · ${tech.name}` };
}
