import { ACTION_DURATIONS } from './rules.js';
import { transactResources } from './resources.js';
import { technologyBonuses } from './technologyTree.js';
import { PLANET_SCAN_FIELDS, assessHabitability } from '../world/habitability.js';
const fields = PLANET_SCAN_FIELDS;
export const scanEnergyCost = (state) => Math.max(1, Math.ceil(12 * technologyBonuses(state).scanCost * technologyBonuses(state).actionCost));
function log(state, text, kind = 'discovery') { state.journal.unshift({ id: crypto.randomUUID(), day: state.time.day, year: state.time.year, kind, text }); state.journal = state.journal.slice(0, 60); }
export function scanPlanet(state, planetId, { advanceTime, emit }) {
  const planet = state.system.planets.find((item) => item.id === planetId);
  if (!planet) return { ok: false, message: 'Объект не найден.' };
  const unknown = fields.filter((field) => !planet.revealed.includes(field));
  if (!unknown.length) return { ok: false, message: `${planet.name}: все доступные данные уже собраны.` };
  const cost = scanEnergyCost(state);
  const revealedNow = unknown.slice(0, 2);
  if (revealedNow.includes('habitability')) planet.habitability ??= assessHabitability(planet);
  const bonuses=technologyBonuses(state);
  const data = Math.floor((12 + bonuses.scanScience) * bonuses.scanYield);
  if (!transactResources(state, { costs: { energy: cost }, gains: { science: data } })) return { ok: false, message: 'Недостаточно энергии для сканирования.' };
  planet.revealed.push(...revealedNow); planet.scanned = true;
  advanceTime(ACTION_DURATIONS.scan);
  const names = revealedNow.map((field) => ({ type: 'классификация', temperature: 'температура', atmosphere: 'атмосфера', composition: 'состав', research: 'научный потенциал', resources: 'доступные ресурсы', habitability: 'оценка пригодности для людей' })[field]);
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
  const science=Math.floor(8*technologyBonuses(state).scanYield);
  if (!transactResources(state, { costs: { energy: cost }, gains: { science } })) return { ok: false, message: 'Недостаточно энергии для анализа звезды.' };
  revealed.push(...revealedNow);
  advanceTime(ACTION_DURATIONS.scan);
  const labels = { luminosity: 'светимость', radius: 'радиус', temperature: 'температура' };
  log(state, `Анализ звезды ${star.name}: раскрыты данные — ${revealedNow.map((field) => labels[field]).join(', ')}. Получено ${science} ед. научных данных.`, 'scan');
  state.system.knowledge ??= { starSurveyed: false, planetsDetected: true };
  state.system.knowledge.starSurveyed = starFields.every((field) => revealed.includes(field));
  emit('star:scanned', { systemId: state.system.id, revealed: revealedNow, scienceGained: science, energySpent: cost });
  return { ok: true, message: `Анализ звезды завершён · +${science} научных данных` };
}
