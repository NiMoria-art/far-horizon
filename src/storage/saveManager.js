import { createNewState } from '../core/gameState.js';
import { DAYS_PER_YEAR } from '../core/gameTime.js';

const SAVE_KEY = 'far-horizon.save.v1';
const PLANET_FIELDS = new Set(['type', 'temperature', 'atmosphere', 'composition', 'research', 'resources']);
const STAR_FIELDS = new Set(['type', 'luminosity', 'radius', 'temperature']);

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const finiteNonNegative = (value) => Number.isFinite(value) && value >= 0;

function normalizeTime(value, fallback) {
  if (!isRecord(value) || !Number.isSafeInteger(value.year) || value.year < 1 || !Number.isSafeInteger(value.day) || value.day < 1) return fallback;
  const absoluteDay = (value.year - 1) * DAYS_PER_YEAR + value.day - 1;
  if (!Number.isSafeInteger(absoluteDay)) return fallback;
  return { ...value, year: Math.floor(absoluteDay / DAYS_PER_YEAR) + 1, day: (absoluteDay % DAYS_PER_YEAR) + 1 };
}

/** Migrate v1 saves in memory while retaining all valid saved fields and unknown extensions. */
export function migrateSave(data) {
  if (!isRecord(data)) return null;
  const defaults = createNewState({ seed: typeof data.worldSeed === 'string' ? data.worldSeed : 'far-horizon-legacy-save' });
  const state = { ...defaults, ...data, version: 3 };
  const normalizeSystem = (saved, fallback) => {
    const source = isRecord(saved) ? saved : fallback;
    const planetsValid = Array.isArray(source.planets) && source.planets.length > 0
      && source.planets.every((planet) => isRecord(planet) && typeof planet.id === 'string');
    const planets = planetsValid ? source.planets.map((planet) => {
      const base = fallback.planets?.find((item) => item.id === planet.id) ?? {};
      return {
        ...base,
        ...planet,
        resources: Array.isArray(planet.resources) ? planet.resources.filter((resource) => typeof resource === 'string') : base.resources ?? [],
        revealed: Array.isArray(planet.revealed) ? [...new Set(planet.revealed.filter((field) => PLANET_FIELDS.has(field)))] : [],
        scanned: Boolean(planet.scanned),
      };
    }) : structuredClone(fallback.planets ?? []);
    const starSource = isRecord(source.star) ? source.star : {};
    const fallbackStar = fallback.star ?? {};
    const star = {
      ...fallbackStar,
      ...starSource,
      revealed: Array.isArray(starSource.revealed) ? [...new Set(starSource.revealed.filter((field) => STAR_FIELDS.has(field)))] : [...(fallbackStar.revealed ?? [])],
    };
    return {
      ...fallback,
      ...source,
      seed: typeof source.seed === 'string' ? source.seed : fallback.seed,
      star,
      planets,
      discovered: source.discovered !== false,
      visited: Boolean(source.visited ?? (source.id === 'helios-9')),
      knowledge: { starSurveyed: false, planetsDetected: source.id === 'helios-9', ...(isRecord(source.knowledge) ? source.knowledge : {}) },
    };
  };

  const sourceSystems = Array.isArray(data.systems) && data.systems.length ? data.systems : [data.system ?? defaults.system];
  const byId = new Map(sourceSystems.filter((item) => isRecord(item) && typeof item.id === 'string').map((item) => [item.id, item]));
  if (!byId.has('helios-9')) byId.set('helios-9', defaults.system);
  const normalized = [...byId.values()].map((system) => {
    const fallback = system.id === 'helios-9' ? defaults.system : { id: system.id, planets: [], star: {}, name: system.name ?? `Система ${system.id}`, designation: system.designation ?? '' };
    return normalizeSystem(system, fallback);
  });
  state.systems = normalized;
  state.currentSystemId = normalized.some((system) => system.id === data.currentSystemId) ? data.currentSystemId
    : normalized.some((system) => system.id === data.system?.id) ? data.system.id : defaults.currentSystemId;
  state.system = normalized.find((system) => system.id === state.currentSystemId);

  const savedResources = isRecord(data.resources) ? data.resources : {};
  state.resources = { ...defaults.resources };
  for (const [key, value] of Object.entries(savedResources)) {
    if (finiteNonNegative(value)) state.resources[key] = value;
  }

  state.time = normalizeTime(data.time, defaults.time);
  state.worldSeed = typeof data.worldSeed === 'string' ? data.worldSeed : defaults.worldSeed;
  state.generatedSystemCount = Number.isSafeInteger(data.generatedSystemCount) && data.generatedSystemCount >= 0
    ? Math.min(data.generatedSystemCount, 3)
    : Math.max(0, normalized.filter((system) => system.id !== 'helios-9' && system.discovered).length);
  const savedShip = isRecord(data.ship) ? data.ship : {};
  const savedLocation = isRecord(savedShip.location) ? savedShip.location : {};
  state.ship = {
    location: { systemId: state.currentSystemId, bodyId: data.shipAt ?? 'star', ...savedLocation },
    maxEnergy: finiteNonNegative(savedShip.maxEnergy) && savedShip.maxEnergy > 0 ? savedShip.maxEnergy : 100,
    energyRemainder: Number.isFinite(savedShip.energyRemainder) && savedShip.energyRemainder >= 0 && savedShip.energyRemainder < 1 ? savedShip.energyRemainder : 0,
  };
  state.resources.energy = Math.min(state.resources.energy, state.ship.maxEnergy);
  const planetIds = new Set(state.system.planets.map((planet) => planet.id));
  state.selectedPlanetId = planetIds.has(data.selectedPlanetId) ? data.selectedPlanetId : defaults.selectedPlanetId;
  state.shipAt = data.shipAt === 'star' || planetIds.has(data.shipAt) ? data.shipAt : defaults.shipAt;
  state.ship.location = { systemId: state.currentSystemId, bodyId: state.shipAt };

  const savedTechnologies = Array.isArray(data.technologies) ? data.technologies.filter((item) => isRecord(item) && typeof item.id === 'string') : [];
  const technologyById = new Map(savedTechnologies.map((item) => [item.id, item]));
  state.technologies = defaults.technologies.map((item) => {
    const saved = technologyById.get(item.id);
    const status = ['available', 'researching', 'studied'].includes(saved?.status) ? saved.status : item.status;
    return saved ? { ...item, ...saved, status } : item;
  });
  const knownIds = new Set(state.technologies.map((item) => item.id));
  state.technologies.push(...savedTechnologies.filter((item) => !knownIds.has(item.id)));
  state.activeTechnologyId = state.technologies.some((item) => item.id === data.activeTechnologyId && item.status === 'researching') ? data.activeTechnologyId : null;

  state.journal = Array.isArray(data.journal)
    ? data.journal.filter((entry) => isRecord(entry) && typeof entry.text === 'string' && Number.isSafeInteger(entry.day) && Number.isSafeInteger(entry.year))
    : defaults.journal;
  return state;
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? migrateSave(JSON.parse(raw)) : null;
  }
  catch { return null; }
}

export function saveGame(state) {
  try {
    if (!isRecord(state)) return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  }
  catch { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); return true; }
  catch { return false; }
}
