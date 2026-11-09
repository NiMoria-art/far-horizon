const bands = [
  { minimum: 85, label: 'Высокий потенциал' },
  { minimum: 65, label: 'Перспективный кандидат' },
  { minimum: 45, label: 'Условная пригодность' },
  { minimum: 25, label: 'Крайне суровые условия' },
  { minimum: 0, label: 'Непригоден без полной защиты' },
];

/** Prototype assessment for future human settlement planning; it does not imply safe surface exposure. */
export function assessHabitability(planet) {
  const temp = Number.isFinite(planet?.temperature) ? planet.temperature : -220;
  const radius = Number.isFinite(planet?.radius) ? planet.radius : 0;
  const type = String(planet?.type ?? '').toLowerCase();
  const atmosphere = String(planet?.atmosphere ?? '').toLowerCase();
  const composition = String(planet?.composition ?? '').toLowerCase();
  const resources = (planet?.resources ?? []).join(' ').toLowerCase();
  const temperatureScore = Math.max(0, Math.round(100 - Math.abs(temp - 15) * 1.65));
  const atmosphereScore = /водород|гелий|натри|не обнаруж|следы/.test(atmosphere) ? 0
    : /азот\s*[·,]\s*кислород/.test(atmosphere) ? 100
      : /азот|углекисл/.test(atmosphere) ? 48 : 25;
  const gravityScore = radius >= 5_000 && radius <= 8_000 ? 100
    : radius >= 3_500 && radius <= 10_000 ? 65
      : radius >= 2_500 && radius <= 12_000 ? 35 : 0;
  const waterScore = /вода|водяной лёд|океан/.test(`${composition} ${resources}`) ? 100 : 12;
  const gasPenalty = /газовый гигант/.test(type) ? 45 : 0;
  const score = Math.max(0, Math.min(100, Math.round(temperatureScore * 0.35 + atmosphereScore * 0.3 + gravityScore * 0.2 + waterScore * 0.15 - gasPenalty)));
  const band = bands.find((item) => score >= item.minimum);
  const factors = [
    { id: 'temperature', label: temperatureScore >= 65 ? 'Температурный диапазон приемлем' : 'Температурный режим требует защиты', status: temperatureScore >= 65 ? 'positive' : 'warning' },
    { id: 'atmosphere', label: atmosphereScore >= 65 ? 'Состав атмосферы перспективен' : atmosphereScore >= 35 ? 'Атмосфера требует переработки' : 'Атмосфера опасна или отсутствует', status: atmosphereScore >= 65 ? 'positive' : 'warning' },
    { id: 'gravity', label: gravityScore >= 65 ? 'Размер мира близок к земному' : 'Гравитация может быть проблемной', status: gravityScore >= 65 ? 'positive' : 'warning' },
    { id: 'water', label: waterScore >= 65 ? 'Обнаружена вода или водяной лёд' : 'Доступная вода не подтверждена', status: waterScore >= 65 ? 'positive' : 'warning' },
  ];
  return { score, label: band.label, factors };
}

export const PLANET_SCAN_FIELDS = ['type', 'temperature', 'atmosphere', 'composition', 'research', 'resources', 'habitability'];
export function habitabilityRevealed(planet) {
  return Array.isArray(planet?.revealed) && planet.revealed.includes('habitability');
}
