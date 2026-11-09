import { ACTION_DURATIONS } from './rules.js';
import { transactResources } from './resources.js';
const fields = ['type', 'temperature', 'atmosphere', 'composition', 'research', 'resources'];
export const scanEnergyCost = (state) => Math.max(1, Math.ceil(12 * (state.technologies.find((t) => t.id === 'solar' && t.status === 'studied') ? 0.75 : 1)));
function log(state, text, kind = 'discovery') { state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind, text }); state.journal = state.journal.slice(0, 60); }
export function scanPlanet(state, planetId, { advanceTime, emit }) {
  const planet = state.system.planets.find((item) => item.id === planetId);
  if (!planet) return { ok: false, message: 'Объект не найден.' };
  const unknown = fields.filter((field) => !planet.revealed.includes(field));
  if (!unknown.length) return { ok: false, message: `${planet.name}: все доступные данные уже собраны.` };
  const cost = scanEnergyCost(state);
  const revealedNow = unknown.slice(0, 2);
  const bonus = state.technologies.find((t) => t.id === 'analyzer' && t.status === 'studied') ? 8 : 0;
  const data = 12 + bonus;
  if (!transactResources(state, { costs: { energy: cost }, gains: { science: data } })) return { ok: false, message: 'Недостаточно энергии для сканирования.' };
  planet.revealed.push(...revealedNow); planet.scanned = true;
  advanceTime(ACTION_DURATIONS.scan);
  const names = revealedNow.map((field) => ({ type: 'классификация', temperature: 'температура', atmosphere: 'атмосфера', composition: 'состав', research: 'научный потенциал', resources: 'доступные ресурсы' })[field]);
  log(state, `Сканирование ${planet.name}: раскрыты данные — ${names.join(', ')}. Получено ${data} ед. научных данных.`, 'scan');
  emit('planet:scanned', { planetId, revealed: revealedNow, scienceGained: data, energySpent: cost });
  return { ok: true, message: `Сканирование завершено · +${data} научных данных` };
}

const starFields = ['luminosity', 'radius', 'temperature'];
export function scanStar(state, { advanceTime, emit }) {
  const star = state.system.star;
  const revealed = star.revealed ??= ['type'];
  const unknown = starFields.filter((field) => !revealed.includes(field));
  if (!unknown.length) return { ok: false, message: 'Звезда: все доступные данные уже собраны.' };
  const cost = scanEnergyCost(state);
  const revealedNow = unknown.slice(0, 2);
  if (!transactResources(state, { costs: { energy: cost }, gains: { science: 8 } })) return { ok: false, message: 'Недостаточно энергии для анализа звезды.' };
  revealed.push(...revealedNow);
  advanceTime(ACTION_DURATIONS.scan);
  const labels = { luminosity: 'светимость', radius: 'радиус', temperature: 'температура' };
  log(state, `Анализ звезды ${star.name}: раскрыты данные — ${revealedNow.map((field) => labels[field]).join(', ')}.`, 'scan');
  state.system.knowledge ??= { starSurveyed: false, planetsDetected: true };
  state.system.knowledge.starSurveyed = starFields.every((field) => revealed.includes(field));
  emit('star:scanned', { systemId: state.system.id, revealed: revealedNow, scienceGained: 8, energySpent: cost });
  return { ok: true, message: `Анализ звезды завершён · +8 научных данных` };
}
