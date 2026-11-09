const STAR_CLASSES = [
  { id: 'M', name: 'Красный карлик', luminosity: 0.08, radius: 0.5, temperature: 3200, color: '#e58a78' },
  { id: 'K', name: 'Оранжевый карлик', luminosity: 0.45, radius: 0.8, temperature: 4600, color: '#f0ad79' },
  { id: 'G', name: 'Жёлтый карлик', luminosity: 1, radius: 1, temperature: 5780, color: '#f4d595' },
  { id: 'F', name: 'Жёлто-белая звезда', luminosity: 2.4, radius: 1.3, temperature: 6600, color: '#e6e4c2' },
];

const SYSTEM_NAMES = ['Aster', 'Orison', 'Calyx', 'Varda', 'Nacre', 'Serein', 'Talos', 'Ilyra'];
const PLANET_NAMES = ['Aven', 'Boreal', 'Ceto', 'Damar', 'Ephyra', 'Fallow', 'Galen'];
const PALETTE = ['#cf805e', '#57a9aa', '#7192c7', '#d8a56e', '#9a83bc', '#73b78e'];
const RESOURCE_SETS = [
  ['силикаты', 'железо'], ['водяной лёд', 'металлы'], ['углерод', 'редкоземельные элементы'],
  ['аммиак', 'водород'], ['никель', 'кремний'], ['органические соединения', 'вода'],
];

function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

function createRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function choose(random, values) { return values[Math.floor(random() * values.length)]; }

export function createSystemId(seed) {
  return `system-${hashSeed(seed).toString(36)}`;
}

/** Pure seeded world-data generation. It has no dependency on UI or mutable game state. */
export function generateStarSystem(seed, { planetCount, id } = {}) {
  const random = createRandom(seed);
  const starClass = choose(random, STAR_CLASSES);
  const count = Number.isInteger(planetCount) ? Math.max(3, Math.min(7, planetCount)) : 4 + Math.floor(random() * 3);
  const systemId = id ?? createSystemId(seed);
  const systemName = choose(random, SYSTEM_NAMES);
  const starName = `${systemName}-${String(Math.floor(random() * 90) + 10)}`;
  const planets = [];
  const availablePlanetNames = [...PLANET_NAMES];
  let orbitAU = 0.28 + random() * 0.24;

  for (let index = 0; index < count; index += 1) {
    if (index > 0) orbitAU *= 1.42 + random() * 0.34;
    const orbit = Number((orbitAU * 149.6).toFixed(1));
    const temperature = Math.round(Math.max(-220, Math.min(420, 278 * (starClass.luminosity ** 0.25) / Math.sqrt(orbitAU) - 248 + (random() - 0.5) * 30)));
    const type = temperature > 155 ? choose(random, ['Вулканический мир', 'Каменистый мир'])
      : temperature < -85 ? choose(random, ['Ледяной мир', 'Ледяной карлик'])
        : choose(random, ['Суперземля', 'Океанический мир', 'Каменистый мир']);
    const giant = orbitAU > 1.6 && random() < 0.24;
    const planetType = giant ? 'Газовый гигант' : type;
    const radius = giant ? 28_000 + Math.round(random() * 48_000) : 1_700 + Math.round(random() * 6_300);
    const size = giant ? 10 + Math.round(random() * 4) : 4 + Math.round(random() * 4);
    const atmosphere = giant ? 'Водород · гелий'
      : temperature > 180 ? 'Разреженная · натриевые пары'
        : temperature < -100 ? choose(random, ['Следы метана', 'Разреженный азот', 'Не обнаружена'])
          : choose(random, ['Азот · аргон', 'Азот · кислород', 'Углекислый газ']);
    const planetName = availablePlanetNames.splice(Math.floor(random() * availablePlanetNames.length), 1)[0];

    planets.push({
      id: `${systemId}-p${index + 1}`,
      name: planetName,
      type: planetType,
      radius,
      orbit,
      orbitAU,
      temperature,
      atmosphere,
      composition: giant ? 'Водород, гелий, летучие соединения' : choose(random, ['Силикаты, железо', 'Лёд, аммиак', 'Кремний, металлы', 'Вода, углеродистые породы']),
      resources: choose(random, RESOURCE_SETS),
      research: choose(random, ['Низкий', 'Средний', 'Высокий']),
      color: choose(random, PALETTE),
      size,
      angle: Number((random() * Math.PI * 2).toFixed(6)),
      revealed: [],
      scanned: false,
    });
  }

  return {
    id: systemId,
    seed: String(seed),
    name: `Система ${systemName}`,
    designation: `СЕКТОР · ${hashSeed(seed).toString(36).toUpperCase()}`,
    star: { name: starName, class: starClass.id, type: starClass.name, luminosity: starClass.luminosity, radius: starClass.radius, temperature: starClass.temperature, color: starClass.color, revealed: ['type'] },
    planets,
    discovered: true,
    visited: false,
    knowledge: { starSurveyed: false, planetsDetected: false },
  };
}

export const SYSTEM_LIMIT = 4;
export const SYSTEM_DISCOVERY_COST = 10;
export const SYSTEM_DISCOVERY_DAYS = 30;
export const INTERSYSTEM_TRAVEL_COST = 35;
export const INTERSYSTEM_TRAVEL_DAYS = 180;
