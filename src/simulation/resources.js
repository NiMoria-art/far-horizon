const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function validResourceMap(resources, changes) {
  return isRecord(changes) && Object.entries(changes).every(([key, amount]) =>
    Object.hasOwn(resources, key) && Number.isFinite(amount) && amount >= 0 && Number.isFinite(resources[key]) && resources[key] >= 0,
  );
}

export function canAfford(state, costs) {
  const resources = state?.resources;
  return isRecord(resources) && validResourceMap(resources, costs)
    && Object.entries(costs).every(([key, amount]) => resources[key] >= amount);
}

/** Validate every cost and gain before changing any resource. */
export function transactResources(state, transaction = {}) {
  if (!isRecord(transaction)) return false;
  const { costs = {}, gains = {} } = transaction;
  const resources = state?.resources;
  if (!isRecord(resources) || !validResourceMap(resources, costs) || !validResourceMap(resources, gains) || !canAfford(state, costs)) return false;

  const keys = new Set([...Object.keys(costs), ...Object.keys(gains)]);
  for (const key of keys) {
    const next = resources[key] - (costs[key] ?? 0) + (gains[key] ?? 0);
    if (!Number.isFinite(next) || next < 0) return false;
  }
  for (const key of keys) resources[key] = resources[key] - (costs[key] ?? 0) + (gains[key] ?? 0);
  return true;
}

export function spendResources(state, costs) {
  return transactResources(state, { costs });
}

export function addResources(state, gains) {
  return transactResources(state, { gains });
}
