export function canAfford(state, costs) { return Object.entries(costs).every(([key, value]) => state.resources[key] >= value); }
export function spendResources(state, costs) {
  if (!canAfford(state, costs)) return false;
  for (const [key, value] of Object.entries(costs)) state.resources[key] -= value;
  return true;
}
export function addResources(state, changes) {
  for (const [key, value] of Object.entries(changes)) state.resources[key] = Math.max(0, state.resources[key] + value);
}
