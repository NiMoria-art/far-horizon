export const BASE_ENERGY_PER_DAY = 0.04;
export const MINIMUM_STELLAR_DISTANCE_AU = 0.25;
export const MAX_ENERGY_PER_DAY = 0.12;

export function currentSystem(state) {
  return state.systems?.find((system) => system.id === state.currentSystemId) ?? state.system;
}

export function shipDistanceAU(state, system = currentSystem(state)) {
  if (state.shipAt === 'star') return MINIMUM_STELLAR_DISTANCE_AU;
  const planet = system?.planets?.find((item) => item.id === state.shipAt);
  return Number.isFinite(planet?.orbitAU) ? planet.orbitAU : Number.isFinite(planet?.orbit) ? planet.orbit / 149.6 : MINIMUM_STELLAR_DISTANCE_AU;
}

export function energyRecoveryRate(state, system = currentSystem(state), distanceAU = shipDistanceAU(state, system)) {
  const luminosity = Number.isFinite(system?.star?.luminosity) && system.star.luminosity > 0 ? system.star.luminosity : 1;
  const distance = Math.max(MINIMUM_STELLAR_DISTANCE_AU, Number.isFinite(distanceAU) ? distanceAU : MINIMUM_STELLAR_DISTANCE_AU);
  return Math.min(MAX_ENERGY_PER_DAY, BASE_ENERGY_PER_DAY * luminosity / ((distance + MINIMUM_STELLAR_DISTANCE_AU) ** 2));
}

/** A deterministic time processor; fractional energy carries across time steps. */
export function recoverEnergy({ state, days, emit, recoveryDistanceAU }) {
  const ship = state.ship ??= { location: { systemId: state.currentSystemId ?? state.system?.id, bodyId: state.shipAt ?? 'star' }, maxEnergy: 100, energyRemainder: 0 };
  ship.maxEnergy = Number.isFinite(ship.maxEnergy) && ship.maxEnergy > 0 ? ship.maxEnergy : 100;
  ship.energyRemainder = Number.isFinite(ship.energyRemainder) && ship.energyRemainder >= 0 ? ship.energyRemainder : 0;
  const system = currentSystem(state);
  const rate = energyRecoveryRate(state, system, recoveryDistanceAU);
  const before = state.resources.energy;
  const accrued = ship.energyRemainder + rate * days;
  const wholeUnits = Math.floor(accrued + 1e-9);
  const after = Math.min(ship.maxEnergy, before + wholeUnits);
  state.resources.energy = after;
  ship.energyRemainder = after >= ship.maxEnergy ? 0 : accrued - wholeUnits;
  const gained = after - before;
  if (gained > 0) emit('energy:recovered', { amount: gained, ratePerDay: rate, days, systemId: system?.id });
  return { gained, ratePerDay: rate };
}
