import { advanceDays } from '../core/gameTime.js';
import { spendResources } from './resources.js';
export function travelTo(state, destinationId) {
  if (state.shipAt === destinationId) return { ok: false, message: 'Корабль уже находится в этой точке.' };
  const tech = state.technologies.find((item) => item.id === 'navigation' && item.status === 'studied');
  const rawCost = destinationId === 'star' ? 8 : 15 + state.system.planets.findIndex((item) => item.id === destinationId) * 2;
  const cost = Math.max(1, Math.ceil(rawCost * (tech ? 0.75 : 1)));
  if (!spendResources(state, { energy: cost })) return { ok: false, message: 'Недостаточно энергии для перелёта.' };
  const distance = Math.abs((state.system.planets.findIndex((item) => item.id === destinationId)) - (state.system.planets.findIndex((item) => item.id === state.shipAt)));
  const days = 12 + Math.max(0, distance) * 8;
  state.shipAt = destinationId; advanceDays(state.time, days);
  const destination = destinationId === 'star' ? 'орбита звезды' : `орбита ${state.system.planets.find((item) => item.id === destinationId).name}`;
  state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind: 'travel', text: `Перелёт завершён. Корабль прибыл: ${destination}. Расход энергии: ${cost}.` });
  state.journal = state.journal.slice(0, 60);
  return { ok: true, message: `Перелёт завершён · −${cost} энергии · ${days} дней` };
}
