import { advanceDays } from '../core/gameTime.js';
import { addResources, spendResources } from './resources.js';
const fields = ['type', 'temperature', 'atmosphere', 'composition', 'research'];
const costFor = (state) => Math.max(1, Math.ceil(12 * (state.technologies.find((t) => t.id === 'solar' && t.status === 'studied') ? 0.75 : 1)));
function log(state, text, kind = 'discovery') { state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind, text }); state.journal = state.journal.slice(0, 60); }
export function scanPlanet(state, planetId) {
  const planet = state.system.planets.find((item) => item.id === planetId);
  if (!planet) return { ok: false, message: 'Объект не найден.' };
  const unknown = fields.filter((field) => !planet.revealed.includes(field));
  if (!unknown.length) return { ok: false, message: `${planet.name}: все доступные данные уже собраны.` };
  const cost = costFor(state);
  if (!spendResources(state, { energy: cost })) return { ok: false, message: 'Недостаточно энергии для сканирования.' };
  const revealedNow = unknown.slice(0, 2);
  planet.revealed.push(...revealedNow); planet.scanned = true;
  const bonus = state.technologies.find((t) => t.id === 'analyzer' && t.status === 'studied') ? 8 : 0;
  const data = 12 + bonus;
  addResources(state, { science: data }); advanceDays(state.time, 18);
  const names = revealedNow.map((field) => ({ type: 'классификация', temperature: 'температура', atmosphere: 'атмосфера', composition: 'состав', research: 'научный потенциал' })[field]);
  log(state, `Сканирование ${planet.name}: раскрыты данные — ${names.join(', ')}. Получено ${data} ед. научных данных.`, 'scan');
  return { ok: true, message: `Сканирование завершено · +${data} научных данных` };
}
